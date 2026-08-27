import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { pool } from '../database/pool.js';
import { AppError } from '../lib/errors.js';
import { storage } from '../media/storage.js';
import { securityRepository } from '../security/repository.js';

const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const camel = (value: string) => value.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
const map = (row: Record<string, unknown>) => Object.fromEntries(Object.entries(row).map(([key, value]) => [camel(key), value]));
const appFields: Record<string,string> = { schoolId:'school_id',schoolYearId:'school_year_id',gradeLevelId:'grade_level_id',sectionId:'section_id',firstName:'first_name',middleName:'middle_name',lastName:'last_name',suffix:'suffix',preferredName:'preferred_name',birthDate:'birth_date',gender:'gender',learnerReferenceNumber:'learner_reference_number',personalEmail:'personal_email',mobilePhone:'mobile_phone',addressLine1:'address_line1',barangay:'barangay',city:'city',province:'province',postalCode:'postal_code',previousSchoolId:'previous_school_id',previousSchool:'previous_school',applicantNotes:'applicant_notes' };
const guardianFields: Record<string,string> = { firstName:'first_name',middleName:'middle_name',lastName:'last_name',suffix:'suffix',relationshipType:'relationship_type',email:'email',mobilePhone:'mobile_phone',occupation:'occupation',employer:'employer',receivesCommunications:'receives_communications' };
type PublicData = Record<string,unknown> & { applicationType:'new_student'|'returning_student';studentNumber?:string|null|undefined;guardians:Record<string,unknown>[];privacyConsent:boolean;privacyNoticeVersion:string };
type RequestContext = { requestId:string;ip?:string|undefined };

export class PublicAdmissionsService {
  async context() {
    const [schools,years,grades,sections,externalSchools]=await Promise.all([
      pool.query(`SELECT id,name FROM schools WHERE archived_at IS NULL AND active AND is_primary ORDER BY name`),
      pool.query(`SELECT id,name,school_id FROM school_years WHERE archived_at IS NULL AND status IN('planned','active') ORDER BY starts_on DESC`),
      pool.query(`SELECT id,name,school_id FROM grade_levels WHERE archived_at IS NULL AND active ORDER BY sequence,name,id`),
      pool.query(`SELECT id,name,school_year_id,grade_level_id FROM sections WHERE archived_at IS NULL AND active ORDER BY name`),
      pool.query(`SELECT id,name FROM external_schools WHERE archived_at IS NULL AND active ORDER BY lower(name)`),
    ]);
    return { schools:schools.rows.map(map),schoolYears:years.rows.map(map),gradeLevels:grades.rows.map(map),sections:sections.rows.map(map),externalSchools:externalSchools.rows.map(map),privacyNotice:{version:'2026-08',summary:'MMSC collects this information to evaluate admission and, only after approval, establish school records. Access is limited to authorized school personnel.'} };
  }

  private async validatePlacement(client:PoolClient,data:PublicData) {
    const placement=await client.query(`SELECT sy.id FROM schools s JOIN school_years sy ON sy.school_id=s.id JOIN grade_levels gl ON gl.school_id=s.id
      WHERE s.id=$1 AND s.archived_at IS NULL AND s.active AND s.is_primary AND sy.id=$2 AND sy.archived_at IS NULL AND sy.status IN('planned','active') AND gl.id=$3 AND gl.archived_at IS NULL AND gl.active`,[data.schoolId,data.schoolYearId,data.gradeLevelId]);
    if(!placement.rows[0])throw new AppError(400,'INVALID_ADMISSION_PLACEMENT','Select an available MMSC School Year and Grade Level');
    if(data.sectionId){const section=await client.query(`SELECT id FROM sections WHERE id=$1 AND school_year_id=$2 AND grade_level_id=$3 AND archived_at IS NULL AND active`,[data.sectionId,data.schoolYearId,data.gradeLevelId]);if(!section.rows[0])throw new AppError(400,'INVALID_ADMISSION_SECTION','The selected Section is not available for that School Year and Grade Level');}
  }

  async create(data:PublicData,context:RequestContext) {
    const client=await pool.connect();const token=randomBytes(32).toString('base64url');
    try {
      await client.query('BEGIN');await this.validatePlacement(client,data);let existingStudentId:string|null=null;
      if(data.applicationType==='returning_student'){
        const match=await client.query(`SELECT id,first_name,middle_name,last_name,suffix,preferred_name,birth_date,gender,learner_reference_number FROM students
          WHERE school_id=$1 AND archived_at IS NULL AND lower(student_number)=lower($2) AND birth_date=$3 AND($4::varchar IS NULL OR learner_reference_number=$4) FOR SHARE`,[data.schoolId,data.studentNumber,data.birthDate,data.learnerReferenceNumber??null]);
        if(!match.rows[0])throw new AppError(400,'RETURNING_STUDENT_NOT_VERIFIED','The returning-student details could not be verified');existingStudentId=String(match.rows[0].id);
        const duplicate=await client.query(`SELECT 1 FROM admission_applications WHERE existing_student_id=$1 AND school_year_id=$2 AND archived_at IS NULL AND status IN('draft','submitted','under_review','information_requested','approved') LIMIT 1`,[existingStudentId,data.schoolYearId]);
        if(duplicate.rows[0])throw new AppError(409,'DUPLICATE_ACTIVE_APPLICATION','An active registration already exists for this Student and School Year');
        for(const key of ['firstName','middleName','lastName','suffix','preferredName','birthDate','gender','learnerReferenceNumber']){const column=appFields[key];if(column&&match.rows[0][column]!==undefined)data[key]=match.rows[0][column];}
      } else {
        const duplicate=await client.query(`SELECT 1 FROM admission_applications WHERE application_type='new_student' AND school_id=$1 AND school_year_id=$2 AND lower(first_name)=lower($3) AND lower(last_name)=lower($4) AND birth_date=$5 AND archived_at IS NULL AND status IN('draft','submitted','under_review','information_requested','approved') LIMIT 1`,[data.schoolId,data.schoolYearId,data.firstName,data.lastName,data.birthDate]);
        if(duplicate.rows[0])throw new AppError(409,'DUPLICATE_ACTIVE_APPLICATION','An active application already exists for this applicant and School Year');
      }
      const entries=Object.entries(data).filter(([key,value])=>appFields[key]&&value!==undefined);
      const result=await client.query(`INSERT INTO admission_applications(${entries.map(([key])=>appFields[key]).join(',')},application_type,existing_student_id,source,status,resume_token_digest,resume_token_expires_at,privacy_consent_at,privacy_notice_version,submitted_at) VALUES(${entries.map((_,index)=>`$${index+1}`).join(',')},$${entries.length+1},$${entries.length+2},'public','draft',$${entries.length+3},now()+interval '30 days',now(),$${entries.length+4},NULL) RETURNING id,application_number,status,application_type,existing_student_id,first_name,last_name,school_year_id,grade_level_id,created_at,version`,[...entries.map(([,value])=>value),data.applicationType,existingStudentId,digest(token),data.privacyNoticeVersion]);
      const application=result.rows[0] as Record<string,unknown>;
      for(const[guardianIndex,guardian]of data.guardians.entries()){const fields=Object.entries(guardian).filter(([key,value])=>guardianFields[key]&&value!==undefined);await client.query(`INSERT INTO admission_guardians(application_id,${fields.map(([key])=>guardianFields[key]).join(',')},is_primary) VALUES($1,${fields.map((_,index)=>`$${index+2}`).join(',')},$${fields.length+2})`,[application.id,...fields.map(([,value])=>value),guardianIndex===0]);}
      await client.query(`INSERT INTO admission_status_history(application_id,to_status,reason,actor_user_id) VALUES($1,'draft','Public registration draft created',NULL)`,[application.id]);
      await securityRepository.audit({action:'admission.public.draft.create',targetType:'admission_application',targetId:String(application.id),outcome:'success',requestId:context.requestId,ipAddress:context.ip,metadata:{source:'public',applicationType:data.applicationType}},client);
      await client.query('COMMIT');return{application:map(application),resumeToken:token};
    }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
  }

  private async verify(applicationNumber:string,token:string,client:Pick<PoolClient,'query'>=pool){const result=await client.query(`SELECT * FROM admission_applications WHERE application_number=$1 AND resume_token_digest=$2 AND resume_token_revoked_at IS NULL AND resume_token_expires_at>now() AND source='public' AND archived_at IS NULL`,[applicationNumber,digest(token)]);if(!result.rows[0])throw new AppError(404,'APPLICATION_ACCESS_DENIED','Application details could not be verified');return result.rows[0] as Record<string,unknown>;}
  private dto(app:Record<string,unknown>){return{applicationNumber:app.application_number,studentName:`${app.first_name} ${app.last_name}`,applicationType:app.application_type,status:app.status,schoolYearId:app.school_year_id,gradeLevelId:app.grade_level_id,submittedAt:app.submitted_at,informationRequest:app.status==='information_requested'?app.information_request:null,applicantResponse:app.applicant_response,canEdit:['draft','information_requested'].includes(String(app.status)),returningStudentLinked:Boolean(app.existing_student_id)};}
  async view(applicationNumber:string,token:string,context:RequestContext){const app=await this.verify(applicationNumber,token);await securityRepository.audit({action:'admission.public.access',targetType:'admission_application',targetId:String(app.id),outcome:'success',requestId:context.requestId,ipAddress:context.ip});return this.dto(app);}
  async submit(applicationNumber:string,token:string,responseMessage:string|null,context:RequestContext){const client=await pool.connect();try{await client.query('BEGIN');const app=await this.verify(applicationNumber,token,client);const locked=await client.query(`SELECT * FROM admission_applications WHERE id=$1 FOR UPDATE`,[app.id]);const current=locked.rows[0] as Record<string,unknown>;if(current.status==='submitted'){await client.query('COMMIT');return this.dto(current);}if(!['draft','information_requested'].includes(String(current.status)))throw new AppError(409,'APPLICATION_NOT_EDITABLE','This application cannot be submitted in its current state');const from=String(current.status);const updated=await client.query(`UPDATE admission_applications SET status='submitted',submitted_at=COALESCE(submitted_at,now()),applicant_response=$1,updated_at=now(),version=version+1 WHERE id=$2 RETURNING *`,[responseMessage,current.id]);await client.query(`INSERT INTO admission_status_history(application_id,from_status,to_status,reason,actor_user_id) VALUES($1,$2,'submitted',$3,NULL)`,[current.id,from,responseMessage]);await securityRepository.audit({action:'admission.public.submit',targetType:'admission_application',targetId:String(current.id),outcome:'success',requestId:context.requestId,ipAddress:context.ip,metadata:{applicationType:current.application_type}},client);await client.query('COMMIT');return this.dto(updated.rows[0] as Record<string,unknown>);}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}}
  async upload(applicationNumber:string,token:string,file:Express.Multer.File,documentType:string,context:RequestContext){const app=await this.verify(applicationNumber,token);if(!['draft','information_requested'].includes(String(app.status)))throw new AppError(409,'APPLICATION_NOT_EDITABLE','Documents cannot be added in this application state');const signatures:Record<string,(data:Buffer)=>boolean>={'application/pdf':data=>data.subarray(0,5).toString()==='%PDF-','image/jpeg':data=>data.length>3&&data[0]===0xff&&data[1]===0xd8&&data[2]===0xff,'image/png':data=>data.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))};if(!signatures[file.mimetype]?.(file.buffer))throw new AppError(400,'INVALID_DOCUMENT_TYPE','Document content must be a valid PDF, JPEG, or PNG');const extension=file.mimetype==='application/pdf'?'pdf':file.mimetype==='image/png'?'png':'jpg';const key=`admissions/${app.id}/${randomUUID()}.${extension}`;await storage.upload(key,file.buffer);try{const result=await pool.query(`INSERT INTO admission_documents(application_id,document_type,display_name,storage_key,original_filename,mime_type,size_bytes,status) VALUES($1,$2,$3,$4,$5,$6,$7,'received') RETURNING id,document_type,display_name,status,created_at`,[app.id,documentType,file.originalname.slice(0,200),key,file.originalname.slice(0,255),file.mimetype,file.size]);await securityRepository.audit({action:'admission.public.document.upload',targetType:'admission_application',targetId:String(app.id),outcome:'success',requestId:context.requestId,ipAddress:context.ip,metadata:{documentType,fileSize:file.size}});return map(result.rows[0]);}catch(error){await storage.delete(key);throw error;}}
}
export const publicAdmissionsService=new PublicAdmissionsService();
