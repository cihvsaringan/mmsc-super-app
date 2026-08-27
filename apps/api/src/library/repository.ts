import { AppError } from '../lib/errors.js';
import { pool } from '../database/pool.js';
import { securityRepository } from '../security/repository.js';

type AuditContext={actorId:string;requestId:string;ip?:string};
type Override={patronType:'student'|'teacher'|'employee';enabled:boolean;maximumActiveLoans:number;loanPeriodDays:number;maximumRenewals:number;gracePeriodDays:number;allowBorrowingWithOverdue:boolean};
type SettingsInput={defaultLoanDays:number;maximumRenewals:number;maximumActiveLoans:number;gracePeriodDays:number;allowBorrowingWithOverdue:boolean;overrides:Override[]};

const settingsSelect=`SELECT school_id "schoolId",default_loan_days "defaultLoanDays",maximum_renewals "maximumRenewals",maximum_active_loans "maximumActiveLoans",grace_period_days "gracePeriodDays",allow_borrowing_with_overdue "allowBorrowingWithOverdue",updated_at "updatedAt" FROM library_settings`;
const overrideSelect=`SELECT patron_type "patronType",enabled,maximum_active_loans "maximumActiveLoans",loan_period_days "loanPeriodDays",maximum_renewals "maximumRenewals",grace_period_days "gracePeriodDays",allow_borrowing_with_overdue "allowBorrowingWithOverdue" FROM library_borrowing_policies`;

export const libraryRepository={
  async dashboard(context:AuditContext){
    await securityRepository.audit({actorUserId:context.actorId,action:'library.portal.access_used',targetType:'library_portal',outcome:'success',requestId:context.requestId,ipAddress:context.ip});
    const [counts,visits,circulation,topBooks,categories,alerts]=await Promise.all([
      pool.query(`SELECT count(*)::int "totalBookCopies",count(*)FILTER(WHERE c.status='available')::int available,count(*)FILTER(WHERE c.status='checked_out')::int "checkedOut",(SELECT count(*)::int FROM library_loans WHERE returned_at IS NULL AND due_at<now()) overdue,(SELECT count(*)::int FROM library_loans WHERE checkout_at::date=current_date) "borrowedToday",(SELECT count(*)::int FROM library_loans WHERE returned_at::date=current_date) "returnedToday" FROM library_book_copies c JOIN library_books b ON b.id=c.book_id WHERE b.archived_at IS NULL`),
      pool.query(`SELECT count(*)FILTER(WHERE entry_at::date=current_date)::int "visitorsToday",count(*)FILTER(WHERE exit_at IS NULL)::int "currentlyInside" FROM library_visits`),
      pool.query(`SELECT series_date::date "day",COALESCE(x.checkouts,0)::int checkouts,COALESCE(r.returns,0)::int returns,COALESCE(o.overdue,0)::int overdue FROM generate_series(current_date-interval '6 days',current_date,interval '1 day')series_date LEFT JOIN(SELECT checkout_at::date d,count(*)checkouts FROM library_loans WHERE checkout_at>=current_date-interval '6 days' GROUP BY 1)x ON x.d=series_date::date LEFT JOIN(SELECT returned_at::date d,count(*)returns FROM library_loans WHERE returned_at>=current_date-interval '6 days' GROUP BY 1)r ON r.d=series_date::date LEFT JOIN(SELECT due_at::date d,count(*)overdue FROM library_loans WHERE returned_at IS NULL AND due_at<now() AND due_at>=current_date-interval '30 days' GROUP BY 1)o ON o.d=series_date::date ORDER BY series_date`),
      pool.query(`SELECT b.title,count(*)::int loans FROM library_loans l JOIN library_book_copies c ON c.id=l.copy_id JOIN library_books b ON b.id=c.book_id WHERE l.checkout_at>=current_date-interval '30 days' GROUP BY b.id ORDER BY loans DESC,b.title LIMIT 5`),
      pool.query(`SELECT COALESCE(cat.name,'Uncategorized')label,count(*)::int loans FROM library_loans l JOIN library_book_copies c ON c.id=l.copy_id JOIN library_books b ON b.id=c.book_id LEFT JOIN library_classifications cat ON cat.id=b.category_id WHERE l.checkout_at>=current_date-interval '30 days' GROUP BY cat.name ORDER BY loans DESC,label LIMIT 5`),
      pool.query(`SELECT count(*)FILTER(WHERE status='lost')::int lost,count(*)FILTER(WHERE status='damaged')::int damaged,count(*)FILTER(WHERE status='under_repair')::int "underRepair",(SELECT count(*)::int FROM library_visits WHERE exit_at IS NULL AND entry_at<current_date)::int "staleVisitorSessions" FROM library_book_copies`),
    ]);return{metrics:{...(counts.rows[0]??{totalBookCopies:0,available:0,checkedOut:0,overdue:0,borrowedToday:0,returnedToday:0}),...(visits.rows[0]??{visitorsToday:0,currentlyInside:0})},circulation:circulation.rows,mostBorrowed:topBooks.rows,popularCategories:categories.rows,alerts:alerts.rows[0]??{lost:0,damaged:0,underRepair:0,staleVisitorSessions:0}};
  },
  async settings(){
    const result=await pool.query(`${settingsSelect} ORDER BY school_id LIMIT 1`);
    const row=result.rows[0];
    if(!row)throw new AppError(404,'LIBRARY_SETTINGS_NOT_FOUND','Library settings are not configured');
    const overrides=await pool.query(`${overrideSelect} WHERE school_id=$1 ORDER BY patron_type`,[row.schoolId]);return{...row,overrides:overrides.rows};
  },
  async updateSettings(input:SettingsInput,context:AuditContext){
    const client=await pool.connect();
    try{
      await client.query('BEGIN');
      const result=await client.query(`${settingsSelect.replace('FROM library_settings','FROM library_settings')} WHERE school_id=(SELECT id FROM schools ORDER BY created_at LIMIT 1) FOR UPDATE`);
      const current=result.rows[0];
      if(!current)throw new AppError(404,'LIBRARY_SETTINGS_NOT_FOUND','Library settings are not configured');
      const previousOverrides=(await client.query(`${overrideSelect} WHERE school_id=$1 ORDER BY patron_type FOR UPDATE`,[current.schoolId])).rows;
      const updated=await client.query(`UPDATE library_settings SET default_loan_days=$1,maximum_renewals=$2,maximum_active_loans=$3,grace_period_days=$4,allow_borrowing_with_overdue=$5,updated_by=$6,updated_at=now() WHERE school_id=$7 RETURNING school_id "schoolId",default_loan_days "defaultLoanDays",maximum_renewals "maximumRenewals",maximum_active_loans "maximumActiveLoans",grace_period_days "gracePeriodDays",allow_borrowing_with_overdue "allowBorrowingWithOverdue",updated_at "updatedAt"`,[input.defaultLoanDays,input.maximumRenewals,input.maximumActiveLoans,input.gracePeriodDays,input.allowBorrowingWithOverdue,context.actorId,current.schoolId]);
      for(const rule of input.overrides)await client.query(`UPDATE library_borrowing_policies SET enabled=$3,maximum_active_loans=$4,loan_period_days=$5,maximum_renewals=$6,grace_period_days=$7,allow_borrowing_with_overdue=$8,updated_by=$9,updated_at=now() WHERE school_id=$1 AND patron_type=$2`,[current.schoolId,rule.patronType,rule.enabled,rule.maximumActiveLoans,rule.loanPeriodDays,rule.maximumRenewals,rule.gracePeriodDays,rule.allowBorrowingWithOverdue,context.actorId]);
      const previous={...current,overrides:previousOverrides};await securityRepository.audit({actorUserId:context.actorId,action:'library.setting.changed',targetType:'library_settings',targetId:String(current.schoolId),outcome:'success',requestId:context.requestId,ipAddress:context.ip,metadata:{previous,next:input}},client);await securityRepository.audit({actorUserId:context.actorId,action:'library.borrowing_policy.changed',targetType:'library_borrowing_policy',targetId:String(current.schoolId),outcome:'success',requestId:context.requestId,ipAddress:context.ip,metadata:{previous:previousOverrides,next:input.overrides}},client);
      await client.query('COMMIT');return{...updated.rows[0],overrides:input.overrides};
    }catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}
  },
};
