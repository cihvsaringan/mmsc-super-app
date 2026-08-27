export type AttendanceDirection='time_in'|'time_out';

export const nextAttendanceDirection=(latest:AttendanceDirection|null):AttendanceDirection=>latest==='time_in'?'time_out':'time_in';

export const isDuplicateScan=(capturedAt:string,acceptedAt:string,minimumMilliseconds=60_000)=>
  Math.abs(new Date(capturedAt).getTime()-new Date(acceptedAt).getTime())<minimumMilliseconds;
