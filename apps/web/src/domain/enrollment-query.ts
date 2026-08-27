export function enrollmentListPath(filters:Record<string,string|number|undefined>){const query=new URLSearchParams();for(const[key,value]of Object.entries(filters))if(value!==undefined&&value!=='')query.set(key,String(value));return `/enrollments${query.size?`?${query}`:''}`}
export type EnrollmentCandidateKind='admission'|'enrollment';
export function enrollmentCompletionPath(kind:EnrollmentCandidateKind,id:string){return `/enrollments/candidates/${kind}/${id}/complete`}
export function isEnrollmentCandidateKind(value:unknown):value is EnrollmentCandidateKind{return value==='admission'||value==='enrollment'}
