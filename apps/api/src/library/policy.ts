export type PatronPolicyType='student'|'teacher'|'employee';
export type BorrowingPolicy={maximumActiveLoans:number;loanPeriodDays:number;maximumRenewals:number;gracePeriodDays:number;allowBorrowingWithOverdue:boolean};
export const addPolicyDays=(from:Date,days:number)=>new Date(from.getTime()+days*86_400_000);
export const overdueAfter=(dueAt:Date,gracePeriodDays:number)=>addPolicyDays(dueAt,gracePeriodDays);
export const isOverdue=(dueAt:Date,gracePeriodDays:number,at=new Date())=>at.getTime()>overdueAfter(dueAt,gracePeriodDays).getTime();
export const renewalDueAt=(currentDueAt:Date,renewedAt:Date,loanPeriodDays:number)=>addPolicyDays(currentDueAt>renewedAt?currentDueAt:renewedAt,loanPeriodDays);
