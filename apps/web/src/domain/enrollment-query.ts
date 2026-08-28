export function enrollmentListPath(filters:Record<string,string|number|undefined>){const query=new URLSearchParams();for(const[key,value]of Object.entries(filters))if(value!==undefined&&value!=='')query.set(key,String(value));return `/enrollments${query.size?`?${query}`:''}`}
export type EnrollmentCandidateKind='admission'|'enrollment';
export function enrollmentCompletionPath(kind:EnrollmentCandidateKind,id:string){return `/enrollments/candidates/${kind}/${id}/complete`}
export function isEnrollmentCandidateKind(value:unknown):value is EnrollmentCandidateKind{return value==='admission'||value==='enrollment'}
type CompletionCandidate={candidateKind:EnrollmentCandidateKind;status:string};
export function canCompleteEnrollmentCandidate(candidate:CompletionCandidate,canManage:boolean){return canManage&&((candidate.candidateKind==='admission'&&candidate.status==='approved')||(candidate.candidateKind==='enrollment'&&candidate.status==='pending'))}
export type EnrollmentReadiness='ready'|'view_only'|'curriculum_missing'|'sections_missing'|'not_completable';
export function enrollmentReadiness(candidate:CompletionCandidate,canManage:boolean,sectionCount:number,subjectCount:number):EnrollmentReadiness{
 if(subjectCount===0)return'curriculum_missing';
 if(sectionCount===0)return'sections_missing';
 if(!canManage)return'view_only';
 return canCompleteEnrollmentCandidate(candidate,canManage)?'ready':'not_completable';
}
