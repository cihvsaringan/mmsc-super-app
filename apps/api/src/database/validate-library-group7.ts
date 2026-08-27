import '../config/env.js';
import { pool } from './pool.js';
import { libraryReportRepository } from '../library/report-repository.js';

const reports=['current_loans','overdue','borrowing_history','inventory','exceptions','visitor_logs','visitor_analytics','circulation_summary']as const;
try{
  const indexes=(await pool.query(`SELECT indexname FROM pg_indexes WHERE schemaname='public' AND indexname IN('library_copies_accession_unique','library_copies_barcode_unique','library_loans_one_active_copy','library_loans_due_active','library_visits_open_student','library_visits_open_employee','library_visits_reporting','library_notification_dispatches_loan','library_loans_returned_reporting','library_copies_status_reporting')`)).rows.map(x=>x.indexname);
  if(indexes.length!==10)throw new Error(`Expected 10 Library integrity/reporting indexes, found ${indexes.length}`);
  for(const report of reports){console.log(`Validating ${report}`);await libraryReportRepository.run({report,from:'2026-08-01',to:'2026-08-31',limit:5,offset:0,format:'json'})}
  const dashboardTrend=await pool.query(`SELECT series_date::date "day",COALESCE(x.checkouts,0)::int checkouts,COALESCE(r.returns,0)::int returns FROM generate_series(current_date-interval '6 days',current_date,interval '1 day')series_date LEFT JOIN(SELECT checkout_at::date d,count(*)checkouts FROM library_loans WHERE checkout_at>=current_date-interval '6 days' GROUP BY 1)x ON x.d=series_date::date LEFT JOIN(SELECT returned_at::date d,count(*)returns FROM library_loans WHERE returned_at>=current_date-interval '6 days' GROUP BY 1)r ON r.d=series_date::date ORDER BY series_date`);if(dashboardTrend.rowCount!==7)throw new Error('Dashboard trend must return seven bounded days');
  const finance=(await pool.query(`SELECT to_regclass('public.library_fines') fines,to_regclass('public.library_payments')payments`)).rows[0];if(finance.fines||finance.payments)throw new Error('Deferred Library finance tables must not exist');
  console.log('Phase 20 Group 7 database acceptance passed: reports execute, integrity/reporting indexes exist, and deferred finance remains absent.');
}finally{await pool.end()}
