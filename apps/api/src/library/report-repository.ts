import { pool } from '../database/pool.js';

export type LibraryReportQuery = {
  report: 'current_loans'|'overdue'|'borrowing_history'|'inventory'|'exceptions'|'visitor_logs'|'visitor_analytics'|'circulation_summary';
  from: string; to: string; patronType?: string|undefined; grade?: string|undefined; section?: string|undefined;
  categoryId?: string|undefined; copyStatus?: string|undefined; limit: number; offset: number; format: 'json'|'csv';
};

const csvCell=(value:unknown)=>`"${String(value??'').replaceAll('"','""')}"`;
export function libraryCsv(rows:Record<string,unknown>[]){if(!rows.length)return'';const keys=Object.keys(rows[0]!);return`${keys.map(csvCell).join(',')}\r\n${rows.map(row=>keys.map(key=>csvCell(row[key])).join(',')).join('\r\n')}\r\n`}

const patronJoins=`LEFT JOIN students s ON s.id=l.student_id LEFT JOIN employees e ON e.id=l.employee_id LEFT JOIN teacher_profiles tp ON tp.employee_id=e.id AND tp.archived_at IS NULL AND tp.faculty_status<>'inactive' LEFT JOIN LATERAL(SELECT gl.name grade,sec.name section FROM enrollments en JOIN school_years sy ON sy.id=en.school_year_id AND sy.status='active' LEFT JOIN grade_levels gl ON gl.id=en.grade_level_id LEFT JOIN sections sec ON sec.id=en.section_id WHERE en.student_id=s.id AND en.status='enrolled' LIMIT 1) placement ON true`;
const patronType=`CASE WHEN l.student_id IS NOT NULL THEN 'student' WHEN tp.id IS NOT NULL THEN 'teacher' ELSE 'employee' END`;
const patronName=`CASE WHEN l.student_id IS NOT NULL THEN concat_ws(' ',s.first_name,s.middle_name,s.last_name) ELSE concat_ws(' ',e.first_name,e.middle_name,e.last_name) END`;

export const libraryReportRepository={async run(q:LibraryReportQuery){
  const values:unknown[]=[q.from,q.to],where:string[]=[];
  const add=(value:unknown,sql:(p:string)=>string)=>{if(value!==undefined&&value!==''){values.push(value);where.push(sql(`$${values.length}`))}};
  add(q.patronType,p=>`${patronType}=${p}`);add(q.grade,p=>`placement.grade=${p}`);add(q.section,p=>`placement.section=${p}`);add(q.categoryId,p=>`b.category_id=${p}::uuid`);add(q.copyStatus,p=>`c.status=${p}`);
  const filtered=where.length?` AND ${where.join(' AND ')}`:'';
  let sql='',countSql:string|undefined;
  if(q.report==='current_loans'||q.report==='overdue'||q.report==='borrowing_history'){
    const state=q.report==='current_loans'?`l.returned_at IS NULL`:q.report==='overdue'?`l.returned_at IS NULL AND now()>l.due_at+(COALESCE(bp.grace_period_days,ls.grace_period_days)*interval '1 day')`:`l.checkout_at::date BETWEEN $1::date AND $2::date`;
    const base=`FROM library_loans l JOIN library_book_copies c ON c.id=l.copy_id JOIN library_books b ON b.id=c.book_id JOIN library_settings ls ON ls.school_id=b.school_id ${patronJoins} LEFT JOIN library_borrowing_policies bp ON bp.school_id=b.school_id AND bp.patron_type=${patronType} WHERE ${state} AND $1::date IS NOT NULL AND $2::date IS NOT NULL${filtered}`;
    sql=`SELECT l.id,b.title,c.accession_number "accessionNumber",${patronName} patron,${patronType} "patronType",placement.grade "gradeLevel",placement.section,l.checkout_at "checkoutAt",l.due_at "dueAt",l.returned_at "returnedAt",CASE WHEN l.returned_at IS NULL AND now()>l.due_at+(COALESCE(bp.grace_period_days,ls.grace_period_days)*interval '1 day') THEN ceil(extract(epoch FROM(now()-(l.due_at+(COALESCE(bp.grace_period_days,ls.grace_period_days)*interval '1 day'))))/86400)::int ELSE 0 END "daysOverdue" ${base} ORDER BY COALESCE(l.returned_at,l.due_at) DESC,l.id`;
    countSql=`SELECT count(*)::int total ${base}`;
  }else if(q.report==='inventory'||q.report==='exceptions'){
    values.splice(2);const inventoryFilters:string[]=[];if(q.categoryId){values.push(q.categoryId);inventoryFilters.push(`b.category_id=$${values.length}::uuid`)}if(q.copyStatus){values.push(q.copyStatus);inventoryFilters.push(`c.status=$${values.length}`)}const state=q.report==='exceptions'?` AND c.status IN('lost','damaged','under_repair')`:'';const inventoryWhere=inventoryFilters.length?` AND ${inventoryFilters.join(' AND ')}`:'';
    sql=`SELECT b.title,b.author,COALESCE(cat.name,'Uncategorized') category,c.accession_number "accessionNumber",c.barcode,c.status,c.condition,c.acquisition_date "acquisitionDate" FROM library_book_copies c JOIN library_books b ON b.id=c.book_id LEFT JOIN library_classifications cat ON cat.id=b.category_id WHERE b.archived_at IS NULL AND $1::date IS NOT NULL AND $2::date IS NOT NULL${state}${inventoryWhere} ORDER BY b.title,c.copy_number`;
    countSql=`SELECT count(*)::int total FROM library_book_copies c JOIN library_books b ON b.id=c.book_id LEFT JOIN library_classifications cat ON cat.id=b.category_id WHERE b.archived_at IS NULL AND $1::date IS NOT NULL AND $2::date IS NOT NULL${state}${inventoryWhere}`;
  }else if(q.report==='visitor_logs'){
    sql=`SELECT v.id,CASE WHEN v.student_id IS NOT NULL THEN concat_ws(' ',s.first_name,s.middle_name,s.last_name) ELSE concat_ws(' ',e.first_name,e.middle_name,e.last_name) END patron,v.patron_category "patronType",v.grade_level_snapshot "gradeLevel",v.section_snapshot section,v.entry_at "entryAt",v.exit_at "exitAt",CASE WHEN v.exit_at IS NOT NULL THEN round(extract(epoch FROM(v.exit_at-v.entry_at))/60)::int END "durationMinutes" FROM library_visits v LEFT JOIN students s ON s.id=v.student_id LEFT JOIN employees e ON e.id=v.employee_id WHERE v.entry_at::date BETWEEN $1::date AND $2::date${q.patronType?` AND v.patron_category=$3`:''} ORDER BY v.entry_at DESC`;
    if(q.patronType)values.splice(2,values.length-2,q.patronType);else values.splice(2);
    countSql=`SELECT count(*)::int total FROM library_visits v WHERE v.entry_at::date BETWEEN $1::date AND $2::date${q.patronType?` AND v.patron_category=$3`:''}`;
  }else if(q.report==='visitor_analytics'){
    sql=`SELECT entry_at::date "date",count(*)::int visits,count(DISTINCT patron_type||':'||COALESCE(student_id,employee_id)::text)::int "uniqueVisitors",COALESCE(round(avg(extract(epoch FROM(exit_at-entry_at))/60)FILTER(WHERE exit_at IS NOT NULL))::int,0)"averageDurationMinutes" FROM library_visits WHERE entry_at::date BETWEEN $1::date AND $2::date GROUP BY 1 ORDER BY 1`;
    values.splice(2);
  }else{
    sql=`SELECT series_date::date "date",COALESCE(checkouts,0)::int checkouts,COALESCE(returns,0)::int returns FROM generate_series($1::date,$2::date,interval '1 day')series_date LEFT JOIN(SELECT checkout_at::date d,count(*)checkouts FROM library_loans WHERE checkout_at::date BETWEEN $1::date AND $2::date GROUP BY 1)x ON x.d=series_date::date LEFT JOIN(SELECT returned_at::date d,count(*)returns FROM library_loans WHERE returned_at::date BETWEEN $1::date AND $2::date GROUP BY 1)r ON r.d=series_date::date ORDER BY series_date`;
    values.splice(2);
  }
  const bounded=q.format==='csv'?5000:q.limit;const params=[...values,bounded,q.format==='csv'?0:q.offset];const items=(await pool.query(`${sql} LIMIT $${params.length-1} OFFSET $${params.length}`,params)).rows;const total=countSql?(await pool.query(countSql,values)).rows[0]?.total??0:items.length;return{items,total};
}};
