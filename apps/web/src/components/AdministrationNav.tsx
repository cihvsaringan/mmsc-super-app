import{BookCheck,BookMarked,BookOpen,BookOpenCheck,BriefcaseBusiness,Building2,CalendarCheck,CalendarDays,ChevronDown,ClipboardList,Clock3,GraduationCap,LayoutDashboard,MonitorSmartphone,ScanLine,Settings2,ShieldCheck,UsersRound,type LucideIcon}from'lucide-react';
import{useState}from'react';
import{HeartPulse}from'lucide-react';
import{NavLink,useLocation}from'react-router-dom';

type Item={label:string;to:string;end?:boolean;icon:LucideIcon;show:()=>boolean};
type Group={id:string;label:string;items:Item[]};

export function AdministrationNav({has,onNavigate}:{has:(permission:string)=>boolean;onNavigate:()=>void}){
  const location=useLocation();
  const security=()=>has('security.user.view')||has('security.role.view')||has('security.account.provision')||has('audit.view');
  const groups:Group[]=[
    {id:'overview',label:'Overview',items:[
      {label:'Dashboard',to:'/',end:true,icon:LayoutDashboard,show:()=>true},
      {label:'Calendar',to:'/calendar',icon:CalendarDays,show:()=>has('calendar.experience.access')},
    ]},
    {id:'school',label:'School management',items:[
      {label:'Admissions',to:'/admissions',icon:ClipboardList,show:()=>has('admission.view')},
      {label:'Students',to:'/students',icon:UsersRound,show:()=>has('student.profile.view')},
      {label:'Enrollments',to:'/enrollments',icon:BookOpenCheck,show:()=>has('enrollment.view')},
      {label:'Teachers',to:'/teachers',icon:GraduationCap,show:()=>has('teacher.profile.view')},
      {label:'Academics',to:'/academics',icon:BookOpen,show:()=>has('academic.config.view')||has('academic.calendar.view')},
      {label:'Assignments',to:'/assignments',icon:BookMarked,show:()=>has('academic.assignment.view')},
      {label:'Grade review',to:'/grade-review',icon:BookCheck,show:()=>has('grades.review')},
      {label:'Student attendance',to:'/student-attendance',icon:CalendarCheck,show:()=>has('student.attendance.view')},
    ]},
    {id:'workforce',label:'People & workforce',items:[
      {label:'Workforce',to:'/workforce',icon:BriefcaseBusiness,show:()=>has('employee.view')},
      {label:'Employee attendance',to:'/attendance',icon:Clock3,show:()=>has('employee.attendance.view')},
    ]},
    {id:'attendance',label:'Attendance operations',items:[
      {label:'Attendance workspace',to:'/attendance-operations',icon:ScanLine,show:()=>has('attendance.operations.view')},
      {label:'Terminal setup',to:'/attendance-terminals',icon:MonitorSmartphone,show:()=>has('attendance.terminal.manage')},
    ]},
    {id:'administration',label:'Administration',items:[
      {label:'Clinic Management',to:'/clinic-management',icon:HeartPulse,show:()=>has('clinic.config.view')},
      {label:'External Schools',to:'/reference-data/external-schools',icon:Building2,show:()=>has('reference.external_school.view')},
      {label:'System & reports',to:'/operations',icon:Settings2,show:()=>has('administration.operations.view')||has('report.view')||has('administration.settings.view')},
      {label:'Security & Access',to:'/security',icon:ShieldCheck,show:security},
    ]},
  ];
  const visible=groups.map(group=>({...group,items:group.items.filter(item=>item.show())})).filter(group=>group.items.length);
  const activeGroups=new Set(visible.filter(group=>group.items.some(item=>item.end?location.pathname===item.to:location.pathname===item.to||location.pathname.startsWith(`${item.to}/`))).map(group=>group.id));
  const[expanded,setExpanded]=useState<Record<string,boolean>>(()=>Object.fromEntries(visible.map(group=>[group.id,true])));
  return <nav className="admin-nav" aria-label="Administration modules">{visible.map(group=>{const open=expanded[group.id]??activeGroups.has(group.id);return <section className="admin-nav-group" key={group.id}><button type="button" className="admin-nav-heading" aria-expanded={open} aria-controls={`nav-${group.id}`} onClick={()=>setExpanded(current=>({...current,[group.id]:!open}))}><span>{group.label}</span><ChevronDown aria-hidden="true"/></button>{open&&<div id={`nav-${group.id}`}>{group.items.map(item=>{const Icon=item.icon;return <NavLink key={item.to} to={item.to} end={item.end} onClick={onNavigate}><Icon aria-hidden="true"/><span>{item.label}</span></NavLink>})}</div>}</section>})}</nav>;
}
