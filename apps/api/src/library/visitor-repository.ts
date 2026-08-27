import type { PoolClient } from 'pg';
import { resolveActiveCredential } from '../credentials/resolver.js';
import { pool } from '../database/pool.js';
import { AppError } from '../lib/errors.js';
import { securityRepository } from '../security/repository.js';

type Context={actorId:string;requestId:string;ip?:string|undefined};
type PatronRef={patronType:'student'|'employee';personId:string};
type Mode='entry'|'exit';
const schoolDay=`(entry_at AT TIME ZONE 'Asia/Manila')::date`;
const audit=(client:PoolClient,context:Context,action:string,id:string,metadata:Record<string,unknown>)=>securityRepository.audit({actorUserId:context.actorId,action,targetType:'library_visit',targetId:id,outcome:'success',requestId:context.requestId,ipAddress:context.ip,metadata},client);

async function credential(client:PoolClient,value:string){
  const row=await resolveActiveCredential(client,value,['rfid','qr','barcode']);
  if(!row)throw new AppError(404,'LIBRARY_VISITOR_CREDENTIAL_NOT_FOUND','No MMSC RFID, QR, or barcode credential matches that scan');
  if(!row.active)throw new AppError(409,'LIBRARY_VISITOR_CREDENTIAL_INACTIVE','This MMSC credential is inactive, expired, lost, replaced, or revoked');
  return{patronType:row.ownerType,personId:row.ownerId,method:row.credentialType}as PatronRef&{method:string};
}

async function patron(client:PoolClient,ref:PatronRef){
  if(ref.patronType==='student'){
    const row=(await client.query(`SELECT s.id "personId",concat_ws(' ',s.first_name,s.middle_name,s.last_name,s.suffix) "displayName",s.student_number identifier,'student'::text "patronCategory",gl.name "gradeLevel",sec.name section,(s.archived_at IS NULL AND s.enrollment_status='enrolled') valid FROM students s LEFT JOIN LATERAL(SELECT e.grade_level_id,e.section_id FROM enrollments e JOIN school_years sy ON sy.id=e.school_year_id WHERE e.student_id=s.id AND e.status='enrolled' AND sy.status='active' ORDER BY sy.starts_on DESC LIMIT 1)en ON true LEFT JOIN grade_levels gl ON gl.id=en.grade_level_id LEFT JOIN sections sec ON sec.id=en.section_id WHERE s.id=$1`,[ref.personId])).rows[0];
    if(!row)throw new AppError(404,'LIBRARY_VISITOR_NOT_FOUND','Student identity was not found');
    if(!row.valid)throw new AppError(409,'LIBRARY_VISITOR_NOT_ELIGIBLE','Student identity is not active');
    return row;
  }
  const row=(await client.query(`SELECT e.id "personId",concat_ws(' ',e.first_name,e.middle_name,e.last_name,e.suffix) "displayName",e.employee_number identifier,CASE WHEN tp.id IS NULL THEN 'employee' ELSE 'teacher' END "patronCategory",NULL::text "gradeLevel",NULL::text section,(e.archived_at IS NULL AND e.employment_status='active')valid FROM employees e LEFT JOIN LATERAL(SELECT id FROM teacher_profiles WHERE employee_id=e.id AND archived_at IS NULL AND faculty_status<>'inactive' LIMIT 1)tp ON true WHERE e.id=$1`,[ref.personId])).rows[0];
  if(!row)throw new AppError(404,'LIBRARY_VISITOR_NOT_FOUND','Employee identity was not found');
  if(!row.valid)throw new AppError(409,'LIBRARY_VISITOR_NOT_ELIGIBLE','Employee identity is not active');
  return row;
}

async function record(client:PoolClient,mode:Mode,ref:PatronRef,method:string,station:string|undefined,context:Context){
  await client.query(`SELECT id FROM ${ref.patronType==='student'?'students':'employees'} WHERE id=$1 FOR UPDATE`,[ref.personId]);
  const person=await patron(client,ref);
  if(mode==='entry'){
    const existing=(await client.query(`SELECT id,entry_at "entryAt" FROM library_visits WHERE patron_type=$1 AND COALESCE(student_id,employee_id)=$2 AND exit_at IS NULL`,[ref.patronType,ref.personId])).rows[0];
    if(existing)return{visit:existing,patron:person,alreadyInside:true};
    const visit=(await client.query(`INSERT INTO library_visits(patron_type,student_id,employee_id,patron_category,grade_level_snapshot,section_snapshot,entry_operator_id,entry_method,entry_station)VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)RETURNING id,entry_at "entryAt",exit_at "exitAt",version`,[ref.patronType,ref.patronType==='student'?ref.personId:null,ref.patronType==='employee'?ref.personId:null,person.patronCategory,person.gradeLevel,person.section,context.actorId,method,station??null])).rows[0];
    await audit(client,context,'library.visitor.entry',visit.id,{patronType:ref.patronType,personId:ref.personId,method,station});
    return{visit,patron:person,alreadyInside:false};
  }
  const active=(await client.query(`SELECT id,entry_at FROM library_visits WHERE patron_type=$1 AND COALESCE(student_id,employee_id)=$2 AND exit_at IS NULL FOR UPDATE`,[ref.patronType,ref.personId])).rows[0];
  if(!active)throw new AppError(409,'LIBRARY_VISITOR_NOT_INSIDE','No open Library visit exists for this patron');
  const visit=(await client.query(`UPDATE library_visits SET exit_at=now(),exit_operator_id=$2,exit_method=$3,exit_station=$4,updated_at=now(),version=version+1 WHERE id=$1 RETURNING id,entry_at "entryAt",exit_at "exitAt",extract(epoch FROM(exit_at-entry_at))::int "durationSeconds",version`,[active.id,context.actorId,method,station??null])).rows[0];
  await audit(client,context,'library.visitor.exit',visit.id,{patronType:ref.patronType,personId:ref.personId,method,station});
  return{visit,patron:person,alreadyInside:false};
}

export const libraryVisitorRepository={
  async scan(input:{mode:Mode;credential:string;station?:string|undefined},context:Context){const client=await pool.connect();try{await client.query('BEGIN');const found=await credential(client,input.credential),result=await record(client,input.mode,found,found.method,input.station,context);await client.query('COMMIT');return result}catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}},
  async manual(input:{mode:Mode;patron:PatronRef;station?:string|undefined},context:Context){const client=await pool.connect();try{await client.query('BEGIN');const result=await record(client,input.mode,input.patron,'manual',input.station,context);await client.query('COMMIT');return result}catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}},
  async list(query:{date:string;patronType?:string|undefined;grade?:string|undefined;section?:string|undefined;inside?:boolean|undefined;limit:number;offset:number}){const values:unknown[]=[query.date],where=[`${schoolDay}=$1::date`];for(const[value,column]of[[query.patronType,'patron_category'],[query.grade,'grade_level_snapshot'],[query.section,'section_snapshot']]as const)if(value){values.push(value);where.push(`${column}=$${values.length}`)}if(query.inside!==undefined)where.push(query.inside?'exit_at IS NULL':'exit_at IS NOT NULL');const filter=where.join(' AND '),count=await pool.query(`SELECT count(*)::int total FROM library_visits WHERE ${filter}`,values);values.push(query.limit,query.offset);const rows=await pool.query(`SELECT v.id,v.patron_type "ownerType",v.patron_category "patronType",COALESCE(v.student_id,v.employee_id)"personId",CASE WHEN v.patron_type='student'THEN concat_ws(' ',s.first_name,s.middle_name,s.last_name)ELSE concat_ws(' ',e.first_name,e.middle_name,e.last_name)END "displayName",COALESCE(s.student_number,e.employee_number)identifier,v.grade_level_snapshot "gradeLevel",v.section_snapshot section,v.entry_at "entryAt",v.exit_at "exitAt",CASE WHEN v.exit_at IS NOT NULL THEN extract(epoch FROM(v.exit_at-v.entry_at))::int END "durationSeconds" FROM library_visits v LEFT JOIN students s ON s.id=v.student_id LEFT JOIN employees e ON e.id=v.employee_id WHERE ${filter} ORDER BY v.entry_at DESC LIMIT $${values.length-1} OFFSET $${values.length}`,values);return{items:rows.rows,total:count.rows[0]?.total??0}},
  async analytics(date:string){const[summary,hours,grades,sections,days]=await Promise.all([
    pool.query(`SELECT count(*)::int "visitorsToday",count(DISTINCT patron_type||':'||COALESCE(student_id,employee_id)::text)::int "uniqueVisitorsToday",count(*)FILTER(WHERE exit_at IS NULL)::int "currentlyInside",COALESCE(round(avg(extract(epoch FROM(exit_at-entry_at))/60)FILTER(WHERE exit_at IS NOT NULL))::int,0)"averageDurationMinutes" FROM library_visits WHERE ${schoolDay}=$1::date`,[date]),
    pool.query(`SELECT extract(hour FROM entry_at AT TIME ZONE 'Asia/Manila')::int "hour",count(*)::int visits FROM library_visits WHERE ${schoolDay}=$1::date GROUP BY 1 ORDER BY 1`,[date]),
    pool.query(`SELECT COALESCE(grade_level_snapshot,'Not applicable')label,count(*)::int visits FROM library_visits WHERE ${schoolDay}=$1::date GROUP BY 1 ORDER BY 2 DESC`,[date]),
    pool.query(`SELECT COALESCE(section_snapshot,'Not applicable')label,count(*)::int visits FROM library_visits WHERE ${schoolDay}=$1::date GROUP BY 1 ORDER BY 2 DESC`,[date]),
    pool.query(`SELECT to_char(${schoolDay},'YYYY-MM-DD') "day",count(*)::int visits FROM library_visits WHERE ${schoolDay} BETWEEN $1::date-6 AND $1::date GROUP BY 1 ORDER BY 1`,[date]),
  ]);return{summary:summary.rows[0],visitsByHour:hours.rows,visitsByGrade:grades.rows,visitsBySection:sections.rows,visitsByDay:days.rows}},
};
