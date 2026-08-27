import{pool}from'../database/pool.js';import{AppError}from'../lib/errors.js';import{schedulingRepository}from'./scheduling-repository.js';
export const clinicPortalSafeRepository={
 async student(userId:string){const r=await pool.query(`SELECT id FROM students WHERE user_id=$1 AND archived_at IS NULL`,[userId]);if(!r.rows[0])throw new AppError(403,'STUDENT_PROFILE_REQUIRED','This account is not linked to a Student');return{items:await schedulingRepository.studentReleases(r.rows[0].id,'student')}},
 async guardian(userId:string,studentId:string){const r=await pool.query(`SELECT 1 FROM guardians g JOIN student_guardians sg ON sg.guardian_id=g.id AND sg.student_id=$2 AND sg.archived_at IS NULL WHERE g.user_id=$1 AND g.archived_at IS NULL`,[userId,studentId]);if(!r.rows[0])throw new AppError(404,'GUARDIAN_CHILD_NOT_FOUND','The selected Student is not linked to this Guardian');return{items:await schedulingRepository.studentReleases(studentId,'guardians')}},
};
