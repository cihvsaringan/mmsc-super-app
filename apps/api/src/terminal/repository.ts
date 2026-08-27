import { createHash, randomBytes } from 'node:crypto';
import type { PoolClient } from 'pg';
import { DatabaseError } from 'pg';
import { pool } from '../database/pool.js';
import { AppError } from '../lib/errors.js';
import { securityRepository } from '../security/repository.js';
import { createSessionToken, digestSessionToken } from '../security/crypto.js';
import { nextAttendanceDirection, type AttendanceDirection } from './attendance-sequence.js';
import { logger } from '../lib/logger.js';

const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const camel = (value: string) => value.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
const map = (row: Record<string, unknown>) => Object.fromEntries(Object.entries(row).map(([key, value]) => [camel(key), value]));
type CaptureMethod = 'qr' | 'rfid' | 'nfc' | 'barcode' | 'manual_verification';
type ScanSource = 'rfid' | 'qr_scanner' | 'qr_camera' | 'manual_credential_test' | 'manual_verification' | 'nfc' | 'barcode';
type TerminalEvent = { clientEventId: string; credentialValue?: string; captureMethod: CaptureMethod; scanSource: ScanSource; capturedAt: string; identityType?:'student'|'employee';identityId?:string };
type SyncReceipt = { clientEventId: string; outcome: string; message: string; syncStatus?:'synced'|'already_processed'|'duplicate_scan'|'rejected'; attendanceStatus?: string|undefined; subjectType?: string | null; subjectId?: string | null; displayName?: string | null; identifier?: string | null; profilePhotoUrl?: string | null; capturedAt?: string; scanSource?: string };
type AttendanceState={duplicate:boolean;direction:AttendanceDirection;latestAt:string|null;latestDirection:AttendanceDirection|null};

export class TerminalRepository {
  async adminContext() {
    const [terminals, campuses, audits, devices, tokens] = await Promise.all([
      pool.query(`SELECT t.id,t.code,t.name,t.location,t.description,t.status,t.campus_id,c.name campus_name,t.last_seen_at,t.last_sync_at,t.version,
        d.device_identifier assigned_device_identifier,d.last_heartbeat_at,d.pending_count,d.failed_count,d.sync_state,d.application_version
        FROM attendance_terminals t LEFT JOIN campuses c ON c.id=t.campus_id
        LEFT JOIN attendance_terminal_devices d ON d.terminal_id=t.id AND d.status='active' ORDER BY t.name`),
      pool.query(`SELECT id,name FROM campuses WHERE archived_at IS NULL ORDER BY name`),
      pool.query(`SELECT ae.id,ae.action,ae.target_id,ae.occurred_at,ae.outcome,u.display_name actor_name FROM audit_events ae LEFT JOIN users u ON u.id=ae.actor_user_id WHERE ae.target_type IN('attendance_terminal','attendance_terminal_device') ORDER BY ae.occurred_at DESC LIMIT 50`),
      pool.query(`SELECT d.id,d.device_identifier,d.status,d.provisioned_at,d.last_seen_at,d.last_sync_at,d.last_heartbeat_at,d.application_version,d.pending_count,d.failed_count,d.sync_state,d.revoked_at,d.revocation_reason,u.display_name provisioned_by,t.name terminal_name FROM attendance_terminal_devices d JOIN users u ON u.id=d.provisioned_by JOIN attendance_terminals t ON t.id=d.terminal_id ORDER BY d.provisioned_at DESC`),
      pool.query(`SELECT p.id,p.terminal_id,p.display_suffix,p.status,p.created_at,p.expires_at,p.consumed_at,u.display_name created_by FROM attendance_terminal_provisioning_tokens p JOIN users u ON u.id=p.created_by ORDER BY p.created_at DESC LIMIT 20`),
    ]);
    return { terminals:terminals.rows.map(map), campuses:campuses.rows.map(map), audits:audits.rows.map(map), devices:devices.rows.map(map), provisioningTokens:tokens.rows.map(map) };
  }

  async createProvisioningToken(terminalId:string,actor:string,requestId:string){
    const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',bytes=randomBytes(8);let raw='MMSC-';for(let index=0;index<8;index++){raw+=alphabet[bytes[index]!%alphabet.length];if(index===3)raw+='-'}
    const result=await pool.query(`INSERT INTO attendance_terminal_provisioning_tokens(terminal_id,token_digest,display_suffix,created_by,expires_at) SELECT id,$2,$3,$4,now()+interval '15 minutes' FROM attendance_terminals WHERE id=$1 AND status='active' RETURNING id,expires_at`,[terminalId,digestSessionToken(raw),raw.slice(-4),actor]);
    if(!result.rows[0])throw new AppError(400,'TERMINAL_DISABLED','Provisioning requires an enabled terminal');
    await securityRepository.audit({actorUserId:actor,action:'attendance.terminal.provisioning.create',targetType:'attendance_terminal',targetId:terminalId,outcome:'success',requestId});
    return{id:String(result.rows[0].id),provisioningCode:raw,expiresAt:result.rows[0].expires_at};
  }

  async provision(input:{provisioningCode:string;deviceIdentifier:string;applicationVersion:string},requestId:string){
    const credential=createSessionToken(),client=await pool.connect();try{await client.query('BEGIN');
      const token=await client.query(`SELECT * FROM attendance_terminal_provisioning_tokens WHERE token_digest=$1 FOR UPDATE`,[digestSessionToken(input.provisioningCode.trim().toUpperCase())]);const row=token.rows[0];
      if(!row)throw new AppError(400,'PROVISIONING_CODE_INVALID','Provisioning code is invalid');
      if(row.status==='consumed')throw new AppError(409,'PROVISIONING_CODE_CONSUMED','Provisioning code has already been used');
      if(row.status!=='active'||new Date(row.expires_at)<=new Date())throw new AppError(400,'PROVISIONING_CODE_EXPIRED','Provisioning code has expired');
      const device=await client.query(`INSERT INTO attendance_terminal_devices(terminal_id,device_identifier,credential_digest,application_version,provisioned_by,last_seen_at,last_heartbeat_at) VALUES($1,$2,$3,$4,$5,now(),now()) RETURNING *`,[row.terminal_id,input.deviceIdentifier,digestSessionToken(credential),input.applicationVersion,row.created_by]);
      await client.query(`UPDATE attendance_terminal_provisioning_tokens SET status='consumed',consumed_at=now(),consumed_by_device_id=$2 WHERE id=$1`,[row.id,device.rows[0].id]);
      await securityRepository.audit({actorUserId:String(row.created_by),action:'attendance.terminal.device.provision',targetType:'attendance_terminal_device',targetId:String(device.rows[0].id),outcome:'success',requestId,metadata:{terminalId:row.terminal_id}},client);
      await client.query('COMMIT');return{deviceId:String(device.rows[0].id),terminalId:String(row.terminal_id),deviceCredential:credential};
    }catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}
  }

  async bootstrap(deviceId:string){const result=await pool.query(`UPDATE attendance_terminal_devices d SET last_seen_at=now(),updated_at=now() FROM attendance_terminals t LEFT JOIN campuses c ON c.id=t.campus_id WHERE d.id=$1 AND t.id=d.terminal_id RETURNING d.id device_id,t.id terminal_id,t.code,t.name,t.location,t.status,t.campus_id,c.name campus_name,'Asia/Manila' timezone,now() server_time,(SELECT coalesce(max(updated_at),'epoch') FROM credentials) credential_snapshot_version`,[deviceId]);if(!result.rows[0])throw new AppError(404,'TERMINAL_DEVICE_NOT_FOUND','Device was not found');return map(result.rows[0]);}
  async heartbeat(deviceId:string,input:{pendingCount:number;failedCount:number;syncState:string;applicationVersion:string}){await pool.query(`UPDATE attendance_terminal_devices SET last_seen_at=now(),last_heartbeat_at=now(),pending_count=$2,failed_count=$3,sync_state=$4,application_version=$5,updated_at=now() WHERE id=$1`,[deviceId,input.pendingCount,input.failedCount,input.syncState,input.applicationVersion]);}
  async revokeDevice(id:string,reason:string,actor:string,requestId:string){const result=await pool.query(`UPDATE attendance_terminal_devices SET status='revoked',revoked_at=now(),revoked_by=$2,revocation_reason=$3,updated_at=now() WHERE id=$1 AND status='active' RETURNING id`,[id,actor,reason]);if(!result.rows[0])throw new AppError(404,'TERMINAL_DEVICE_NOT_FOUND','Active device was not found');await securityRepository.audit({actorUserId:actor,action:'attendance.terminal.device.revoke',targetType:'attendance_terminal_device',targetId:id,outcome:'success',requestId,metadata:{reason}});}

  async issue(data: { subjectType: 'student' | 'employee'; subjectId: string; credentialType: string; value: string }, actor: string) {
    const result = await pool.query(
      `INSERT INTO credentials(subject_type,student_id,employee_id,credential_type,value_digest,display_suffix,created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id,subject_type,credential_type,display_suffix,status`,
      [data.subjectType, data.subjectType === 'student' ? data.subjectId : null, data.subjectType === 'employee' ? data.subjectId : null, data.credentialType, digest(data.value), data.value.slice(-6), actor],
    );
    return map(result.rows[0]);
  }

  async register(data: { code: string; name: string; location: string | null; campusId: string | null; description: string | null }, actor: string, requestId: string) {
    const result = await pool.query(
      `INSERT INTO attendance_terminals(code,name,location,campus_id,description,created_by) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
      [data.code, data.name, data.location, data.campusId, data.description, actor],
    );
    await securityRepository.audit({ actorUserId: actor, action: 'attendance.terminal.create', targetType: 'attendance_terminal', targetId: result.rows[0].id, outcome: 'success', requestId });
    return map(result.rows[0]);
  }

  async update(id: string, data: { name: string; location: string | null; campusId: string | null; description: string | null; version: number }, actor: string, requestId: string) {
    const result = await pool.query(`UPDATE attendance_terminals SET name=$2,location=$3,campus_id=$4,description=$5,version=version+1,updated_at=now() WHERE id=$1 AND version=$6 RETURNING *`, [id,data.name,data.location,data.campusId,data.description,data.version]);
    if (!result.rows[0]) throw new AppError(409,'VERSION_CONFLICT','Terminal was changed by another user');
    await securityRepository.audit({ actorUserId: actor, action: 'attendance.terminal.update', targetType: 'attendance_terminal', targetId: id, outcome: 'success', requestId });
    return map(result.rows[0]);
  }

  async setStatus(id: string, status: 'active'|'inactive'|'revoked', actor: string, requestId: string) {
    const client=await pool.connect(); try { await client.query('BEGIN');
      const result=await client.query(`UPDATE attendance_terminals SET status=$2,version=version+1,updated_at=now() WHERE id=$1 RETURNING *`,[id,status]);
      if(!result.rows[0]) throw new AppError(404,'TERMINAL_NOT_FOUND','Terminal not found');
      if(status==='revoked') await client.query(`UPDATE attendance_terminal_devices SET status='revoked',revoked_at=now(),revoked_by=$2,revocation_reason='Logical terminal revoked',updated_at=now() WHERE terminal_id=$1 AND status='active'`,[id,actor]);
      await securityRepository.audit({actorUserId:actor,action:`attendance.terminal.${status==='active'?'enable':status==='inactive'?'disable':'revoke'}`,targetType:'attendance_terminal',targetId:id,outcome:'success',requestId},client);
      await client.query('COMMIT'); return map(result.rows[0]);
    } catch(e){await client.query('ROLLBACK');throw e} finally{client.release()}
  }

  private async attendanceState(client:PoolClient,subjectType:'student'|'employee',subjectId:string,attendanceOwnerId:string,day:string,event:TerminalEvent):Promise<AttendanceState>{
    await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1,0))`,[`${subjectType}:${subjectId}:${day}`]);
    const latest=await client.query<{captured_at:string;attendance_direction:AttendanceDirection;attendance_record_id:string|null}>(`SELECT captured_at,attendance_direction,attendance_record_id FROM attendance_terminal_events WHERE subject_type=$1 AND subject_id=$2 AND outcome='accepted' AND attendance_direction IS NOT NULL AND (captured_at AT TIME ZONE 'Asia/Manila')::date=$3::date AND captured_at<$4::timestamptz ORDER BY captured_at DESC,processed_at DESC,id DESC LIMIT 1`,[subjectType,subjectId,day,event.capturedAt]);
    const nearby=await client.query(`SELECT attendance_record_id,captured_at,attendance_direction FROM attendance_terminal_events WHERE subject_type=$1 AND subject_id=$2 AND outcome='accepted' AND (captured_at AT TIME ZONE 'Asia/Manila')::date=$3::date AND abs(extract(epoch from(captured_at-$4::timestamptz)))<60 ORDER BY abs(extract(epoch from(captured_at-$4::timestamptz))) LIMIT 1`,[subjectType,subjectId,day,event.capturedAt]);
    const latestRow=latest.rows[0];
    let latestDirection=latestRow?.attendance_direction??null;
    if(!latestDirection){
      const open=subjectType==='employee'
        ?await client.query(`SELECT 1 FROM employee_attendance_records WHERE employee_id=$1 AND attendance_date=$2 AND archived_at IS NULL AND time_in IS NOT NULL AND time_out IS NULL LIMIT 1`,[attendanceOwnerId,day])
        :await client.query(`SELECT 1 FROM student_attendance_records WHERE enrollment_id=$1 AND attendance_date=$2 AND attendance_scope='campus' AND archived_at IS NULL AND time_in IS NOT NULL AND time_out IS NULL LIMIT 1`,[attendanceOwnerId,day]);
      if(open.rows[0])latestDirection='time_in';
    }
    return{duplicate:Boolean(nearby.rows[0]),direction:nextAttendanceDirection(latestDirection),latestAt:latestRow?.captured_at??null,latestDirection};
  }

  private async recordEmployee(client: PoolClient, subjectId: string, event: TerminalEvent, terminalId: string, actor: string, name: string) {
    const dateResult=await client.query<{attendance_day:string}>(`SELECT (($1::timestamptz AT TIME ZONE 'Asia/Manila')::date)::text AS attendance_day`,[event.capturedAt]);
    const day = dateResult.rows[0]!.attendance_day;
    const state=await this.attendanceState(client,'employee',subjectId,subjectId,day,event);
    const source = event.captureMethod === 'manual_verification' ? 'manual' : event.captureMethod === 'rfid' ? 'rfid_terminal' : 'qr_terminal';
    if(state.duplicate){
      return{recordId:null,message:`Already recorded for ${name}. Please wait before scanning again.`,attendanceStatus:'duplicate',direction:null,accepted:false};
    }
    if(state.direction==='time_in'){
      const inserted=await client.query(`INSERT INTO employee_attendance_records(employee_id,attendance_date,time_in,status,source,external_event_id,created_by) VALUES($1,$2,$3,'present',$4,$5,$6) RETURNING id`,[subjectId,day,event.capturedAt,source,`${terminalId}:${event.clientEventId}`,actor]);
      return{recordId:String(inserted.rows[0].id),message:`Time in recorded for ${name}`,attendanceStatus:'time_in',direction:'time_in' as const,accepted:true};
    }
    const closed=await client.query(`UPDATE employee_attendance_records SET time_out=$3,updated_at=now(),version=version+1 WHERE id=(SELECT id FROM employee_attendance_records WHERE employee_id=$1 AND attendance_date=$2 AND archived_at IS NULL AND time_in IS NOT NULL AND time_out IS NULL ORDER BY time_in DESC,created_at DESC LIMIT 1 FOR UPDATE) RETURNING id`,[subjectId,day,event.capturedAt]);
    if(!closed.rows[0])return{recordId:null,message:'Attendance sequence could not find an open employee session',attendanceStatus:'sequence_conflict',direction:null,accepted:false};
    return{recordId:String(closed.rows[0].id),message:`Time out recorded for ${name}`,attendanceStatus:'time_out',direction:'time_out' as const,accepted:true};
  }

  private async recordStudent(client: PoolClient, subjectId: string, event: TerminalEvent, terminalId: string, actor: string, name: string) {
    const enrollment = await client.query(`SELECT id FROM enrollments WHERE student_id=$1 AND status IN('pending','enrolled') ORDER BY enrollment_date DESC LIMIT 1`, [subjectId]);
    if (!enrollment.rows[0]) return { recordId: null, message: 'Student has no eligible enrollment' };
    const dateResult=await client.query<{attendance_day:string}>(`SELECT (($1::timestamptz AT TIME ZONE 'Asia/Manila')::date)::text AS attendance_day`,[event.capturedAt]);
    const day = dateResult.rows[0]!.attendance_day;
    const state=await this.attendanceState(client,'student',subjectId,String(enrollment.rows[0].id),day,event);
    const source = event.captureMethod === 'manual_verification' ? 'manual' : event.captureMethod === 'rfid' ? 'rfid_terminal' : 'qr_terminal';
    if(state.duplicate){
      return{recordId:null,message:`Already recorded for ${name}. Please wait before scanning again.`,attendanceStatus:'duplicate',direction:null,accepted:false};
    }
    if(state.direction==='time_in'){
      const inserted=await client.query(`INSERT INTO student_attendance_records(enrollment_id,attendance_date,time_in,status,source,external_event_id,created_by) VALUES($1,$2,$3,'present',$4,$5,$6) RETURNING id`,[enrollment.rows[0].id,day,event.capturedAt,source,`${terminalId}:${event.clientEventId}`,actor]);
      return{recordId:String(inserted.rows[0].id),message:`Time in recorded for ${name}`,attendanceStatus:'time_in',direction:'time_in' as const,accepted:true};
    }
    const closed=await client.query(`UPDATE student_attendance_records SET time_out=$3,updated_at=now(),version=version+1 WHERE id=(SELECT id FROM student_attendance_records WHERE enrollment_id=$1 AND attendance_date=$2 AND attendance_scope='campus' AND archived_at IS NULL AND time_in IS NOT NULL AND time_out IS NULL ORDER BY time_in DESC,created_at DESC LIMIT 1 FOR UPDATE) RETURNING id`,[enrollment.rows[0].id,day,event.capturedAt]);
    if(!closed.rows[0])return{recordId:null,message:'Attendance sequence could not find an open student session',attendanceStatus:'sequence_conflict',direction:null,accepted:false};
    return{recordId:String(closed.rows[0].id),message:`Time out recorded for ${name}`,attendanceStatus:'time_out',direction:'time_out' as const,accepted:true};
  }

  async sync(terminalId: string, deviceId: string, events: TerminalEvent[], actor: string, requestId: string) {
    const client = await pool.connect();
    const results: SyncReceipt[] = [];
    try {
      await client.query('BEGIN');
      const terminal = await client.query(`SELECT id FROM attendance_terminals WHERE id=$1 AND status='active'`, [terminalId]);
      if (!terminal.rows[0]) throw new AppError(403, 'TERMINAL_NOT_ACTIVE', 'The attendance terminal is not registered or active');
      const device=await client.query(`SELECT id FROM attendance_terminal_devices WHERE id=$1 AND terminal_id=$2 AND status='active'`,[deviceId,terminalId]);
      if(!device.rows[0]) throw new AppError(403,'TERMINAL_DEVICE_REVOKED','The attendance terminal device is not active');

      for (const event of [...events].sort((a,b)=>new Date(a.capturedAt).getTime()-new Date(b.capturedAt).getTime()||a.clientEventId.localeCompare(b.clientEventId))) {
        await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1,0))`,[`terminal-capture:${terminalId}:${event.clientEventId}`]);
        const prior = await client.query(`SELECT te.client_event_id,te.outcome,te.message,te.subject_type,te.subject_id,te.captured_at,te.scan_source,te.attendance_direction attendance_status,
          CASE WHEN te.subject_type='student' THEN concat_ws(' ',s.first_name,s.middle_name,s.last_name,s.suffix) ELSE concat_ws(' ',e.first_name,e.middle_name,e.last_name,e.suffix) END display_name,
          COALESCE(s.student_number,e.employee_number) identifier,COALESCE(s.profile_photo_url,e.profile_photo_url) profile_photo_url
          FROM attendance_terminal_events te LEFT JOIN students s ON te.subject_type='student' AND s.id=te.subject_id LEFT JOIN employees e ON te.subject_type='employee' AND e.id=te.subject_id
          WHERE te.terminal_id=$1 AND te.client_event_id=$2`, [terminalId, event.clientEventId]);
        if (prior.rows[0]) { results.push({...map(prior.rows[0]),syncStatus:'already_processed'} as SyncReceipt); continue; }

        const credential = event.captureMethod==='manual_verification'
          ? await client.query(`SELECT 'student' subject_type,NULL::uuid id,s.id student_id,NULL::uuid employee_id,'active' status,NULL::timestamptz expires_at,
              s.first_name student_first_name,s.middle_name student_middle_name,s.last_name student_last_name,s.suffix student_suffix,s.student_number,s.profile_photo_url student_photo,s.archived_at student_archived,s.enrollment_status,
              NULL::varchar employee_first_name,NULL::varchar employee_middle_name,NULL::varchar employee_last_name,NULL::varchar employee_suffix,NULL::varchar employee_number,NULL::varchar employee_photo,NULL::timestamptz employee_archived,NULL::varchar employment_status
              FROM students s WHERE $1='student' AND s.id=$2
              UNION ALL SELECT 'employee',NULL::uuid,NULL::uuid,emp.id,'active',NULL::timestamptz,
              NULL,NULL,NULL,NULL,NULL,NULL,NULL::timestamptz,NULL,NULL,emp.first_name,emp.middle_name,emp.last_name,emp.suffix,emp.employee_number,emp.profile_photo_url,emp.archived_at,emp.employment_status
              FROM employees emp WHERE $1='employee' AND emp.id=$2`,[event.identityType,event.identityId])
          : await client.query(
            `SELECT c.*,s.first_name student_first_name,s.middle_name student_middle_name,s.last_name student_last_name,s.suffix student_suffix,s.student_number,s.profile_photo_url student_photo,s.archived_at student_archived,s.enrollment_status,
             emp.first_name employee_first_name,emp.middle_name employee_middle_name,emp.last_name employee_last_name,emp.suffix employee_suffix,emp.employee_number,emp.profile_photo_url employee_photo,emp.archived_at employee_archived,emp.employment_status
             FROM credentials c LEFT JOIN students s ON s.id=c.student_id LEFT JOIN employees emp ON emp.id=c.employee_id
             WHERE c.value_digest=$1
             ORDER BY CASE WHEN c.status='active' THEN 0 ELSE 1 END,c.updated_at DESC
             LIMIT 1`,
            [digest(event.credentialValue!)],
          );
        let outcome = 'rejected';
        let message = 'Credential is invalid or inactive';
        let subjectType: string | null = null;
        let subjectId: string | null = null;
        let recordId: string | null = null;
        let attendanceStatus: string | undefined;
        let attendanceDirection:AttendanceDirection|null=null;
        let displayName: string | null = null,identifier: string | null = null,profilePhotoUrl: string | null = null;
        const row = credential.rows[0];
        if (row) {
          subjectType = String(row.subject_type);
          subjectId = String(row.student_id ?? row.employee_id);
          displayName=subjectType==='employee'?[row.employee_first_name,row.employee_middle_name,row.employee_last_name,row.employee_suffix].filter(Boolean).join(' '):[row.student_first_name,row.student_middle_name,row.student_last_name,row.student_suffix].filter(Boolean).join(' ');
          identifier=String(subjectType==='employee'?row.employee_number:row.student_number);
          profilePhotoUrl=subjectType==='employee'?row.employee_photo:row.student_photo;
          const credentialValid=row.status==='active'&&(!row.expires_at||new Date(row.expires_at)>new Date());
          const identityEligible=subjectType==='employee'?row.employee_archived===null&&row.employment_status==='active':row.student_archived===null&&row.enrollment_status==='enrolled';
          if(!credentialValid) message='Credential not valid';
          else if(!identityEligible) message='Identity is not eligible for attendance';
          else {
            const recorded = subjectType === 'employee'
              ? await this.recordEmployee(client, subjectId, event, terminalId, actor, displayName)
              : await this.recordStudent(client, subjectId, event, terminalId, actor, displayName);
            recordId = recorded.recordId; message = recorded.message; attendanceStatus=recorded.attendanceStatus;
            attendanceDirection=recorded.direction??null;outcome=recorded.accepted?'accepted':'rejected';
            if(recordId&&row.id) await client.query(`UPDATE credentials SET last_used_at=$2,updated_at=now(),updated_by=$3 WHERE id=$1`,[row.id,event.capturedAt,actor]);
          }
        } else {
          message='Credential not recognized';
        }
        await client.query(
          `INSERT INTO attendance_terminal_events(terminal_id,device_id,client_event_id,captured_at,credential_digest,capture_method,scan_source,subject_type,subject_id,outcome,message,attendance_record_id,attendance_direction,created_by,clock_offset_seconds)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,extract(epoch from(now()-$4::timestamptz))::integer)`,
          [terminalId,deviceId,event.clientEventId,event.capturedAt,event.credentialValue?digest(event.credentialValue):null,event.captureMethod,event.scanSource,subjectType,subjectId,outcome,message,recordId,attendanceDirection,actor],
        );
        await securityRepository.audit({actorUserId:actor,action:'attendance.terminal.scan',targetType:'attendance_terminal_event',targetId:event.clientEventId,outcome:outcome==='accepted'?'success':'failure',requestId,metadata:{terminalId,scanSource:event.scanSource,subjectType,subjectId,queuedDurationSeconds:Math.max(0,Math.round((Date.now()-new Date(event.capturedAt).getTime())/1000))}},client);
        results.push({ clientEventId: event.clientEventId, outcome, message, syncStatus:outcome==='accepted'?'synced':attendanceStatus==='duplicate'?'duplicate_scan':'rejected', attendanceStatus, subjectType, subjectId,displayName,identifier,profilePhotoUrl,capturedAt:event.capturedAt,scanSource:event.scanSource });
      }
      await client.query(`UPDATE attendance_terminals SET last_seen_at=now(),last_sync_at=now() WHERE id=$1`, [terminalId]);
      await client.query(`UPDATE attendance_terminal_devices SET last_seen_at=now(),last_sync_at=now(),last_heartbeat_at=now(),pending_count=0,sync_state='online',updated_at=now() WHERE id=$1`,[deviceId]);
      await securityRepository.audit({ actorUserId: actor, action: 'attendance.terminal.sync', targetType: 'attendance_terminal', targetId: terminalId, outcome: 'success', requestId, metadata: { eventCount: events.length } }, client);
      await client.query('COMMIT');
      return { results };
    } catch (error) {
      await client.query('ROLLBACK');
      if(error instanceof DatabaseError&&error.code==='23505'){
        logger.error({err:error,requestId,terminalId,deviceId,constraint:error.constraint,table:error.table,schema:error.schema},'Unexpected unique constraint during attendance terminal synchronization');
        throw new AppError(500,'ATTENDANCE_PERSISTENCE_CONFLICT','Attendance could not be synchronized due to an unexpected persistence conflict');
      }
      throw error;
    } finally {
      client.release();
    }
  }
}

export const terminalRepository = new TerminalRepository();
