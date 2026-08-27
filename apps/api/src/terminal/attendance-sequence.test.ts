import{describe,expect,it}from'vitest';
import{isDuplicateScan,nextAttendanceDirection}from'./attendance-sequence.js';

describe('attendance sequence',()=>{
 it.each([[null,'time_in'],['time_in','time_out'],['time_out','time_in']] as const)('maps %s to %s',(latest,next)=>expect(nextAttendanceDirection(latest)).toBe(next));
 it('protects the first minute without rejecting the exact boundary',()=>{expect(isDuplicateScan('2026-08-26T07:30:59+08:00','2026-08-26T07:30:00+08:00')).toBe(true);expect(isDuplicateScan('2026-08-26T07:31:00+08:00','2026-08-26T07:30:00+08:00')).toBe(false)});
});
