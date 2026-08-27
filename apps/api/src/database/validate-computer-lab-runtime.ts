import{computerLabEquipmentRepository as equipment}from'../computer-lab/equipment-repository.js';
import{computerLabMaintenanceRepository as maintenance}from'../computer-lab/maintenance-repository.js';
import{computerLabReportingRepository as reporting}from'../computer-lab/reporting-repository.js';
import{computerLabSoftwareRepository as software}from'../computer-lab/software-repository.js';
import{pool}from'./pool.js';

const page={archived:false,limit:25,offset:0};
const reports=['lab_utilization','workstation_utilization','session_mix','student_usage','section_usage','subject_usage','issues','maintenance','equipment','software']as const;
try{
  const relations=['computer_lab_schedules','computer_lab_sessions','computer_lab_issues','computer_lab_maintenance_records','computer_lab_equipment','computer_lab_equipment_transfers','computer_lab_software','computer_lab_workstation_software'];
  const schema=await pool.query<{relation:string}>(`SELECT relation FROM unnest($1::text[]) relation WHERE to_regclass(relation) IS NULL`,[relations]);
  if(schema.rowCount)throw new Error(`Missing Computer Laboratory relations: ${schema.rows.map(row=>row.relation).join(', ')}`);
  const [issueContext,issues,maintenanceRows,equipmentContext,equipmentRows,softwareContext,softwareRows,dashboard]=await Promise.all([
    maintenance.context(),maintenance.listIssues(page),maintenance.listMaintenance(page),equipment.context(),equipment.list(page),software.context(),software.list(page),reporting.dashboard(),
  ]);
  const reportRows=await Promise.all(reports.map(report=>reporting.report({report,from:'2026-01-01',to:'2026-12-31',limit:25,offset:0,format:'json'})));
  console.log(JSON.stringify({relations:'ok',issues:{context:issueContext.laboratories.length,items:issues.items.length,total:issues.total},maintenance:{items:maintenanceRows.items.length,total:maintenanceRows.total},equipment:{context:equipmentContext.laboratories.length,items:equipmentRows.items.length,total:equipmentRows.total},software:{context:softwareContext.laboratories.length,items:softwareRows.items.length,total:softwareRows.total},dashboard:{laboratories:dashboard.laboratories.length,alerts:dashboard.alerts.length},reports:Object.fromEntries(reports.map((name,index)=>[name,{items:reportRows[index]!.items.length,total:reportRows[index]!.total}]))},null,2));
}finally{await pool.end()}
