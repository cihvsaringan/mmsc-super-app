import type{CachedCredential,Capture}from'./storage';
export type AttendanceDirection='time_in'|'time_out';
const day=(value:string)=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Manila',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
const next=(latest:AttendanceDirection|null):AttendanceDirection=>latest==='time_in'?'time_out':'time_in';
export const predictAttendance=(credential:CachedCredential,captures:Capture[],credentialValue:string,capturedAt:string)=>{
 const relevant=captures.filter(item=>item.credentialValue.trim()===credentialValue.trim()&&day(item.capturedAt)===day(capturedAt)&&item.syncState!=='failed_permanent').sort((a,b)=>new Date(a.capturedAt).getTime()-new Date(b.capturedAt).getTime());
 const times=[...(credential.lastAttendanceAt&&day(credential.lastAttendanceAt)===day(capturedAt)?[credential.lastAttendanceAt]:[]),...relevant.map(item=>item.capturedAt)];
 const latestAt=times.sort((a,b)=>new Date(a).getTime()-new Date(b).getTime()).at(-1)??null;
 let latest:AttendanceDirection|null=credential.lastAttendanceAt&&day(credential.lastAttendanceAt)===day(capturedAt)?credential.lastAttendanceDirection:null;
 for(let index=0;index<relevant.length;index++)latest=next(latest);
 return{duplicate:Boolean(latestAt&&Math.abs(new Date(capturedAt).getTime()-new Date(latestAt).getTime())<60_000),direction:next(latest),latestAt};
};
