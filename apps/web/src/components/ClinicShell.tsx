import{BarChart3,Boxes,CalendarClock,ClipboardList,ClipboardPlus,HeartPulse,LayoutDashboard,LogOut,Menu,Search,Stethoscope,X}from'lucide-react';
import{useState}from'react';
import{NavLink,Outlet}from'react-router-dom';
import{useAuth}from'../auth/AuthContext';
import{ExperienceSwitcher}from'./ExperienceSwitcher';
import{NotificationBell}from'./NotificationBell';

const links=[
  {to:'/clinic/dashboard',label:'Dashboard',permission:'clinic.dashboard.view',icon:LayoutDashboard},
  {to:'/clinic/students',label:'Student lookup',permission:'clinic.student.lookup',icon:Search},
  {to:'/clinic/queue',label:'Visit queue',permission:'clinic.encounter.view',icon:Stethoscope},
  {to:'/clinic/visits',label:'Clinic visits',permission:'clinic.encounter.view',icon:ClipboardPlus},
  {to:'/clinic/health-records',label:'Health records',permission:'clinic.health_records.view',icon:HeartPulse},
  {to:'/clinic/appointments',label:'Appointments',permission:'clinic.appointment.view',icon:CalendarClock},
  {to:'/clinic/follow-ups',label:'Follow-ups',permission:'clinic.follow_up.view',icon:ClipboardList},
  {to:'/clinic/inventory',label:'Medicine & supplies',permission:'clinic.inventory.view',icon:Boxes},
  {to:'/clinic/reports',label:'Reports',permission:'clinic.report.view',icon:BarChart3},
] as const;

export function ClinicShell(){
  const[open,setOpen]=useState(false);const{user,logout,has}=useAuth();const close=()=>setOpen(false);
  return <div className="clinic-shell"><a className="skip-link" href="#clinic-main">Skip to clinic workspace</a>
    <aside className={open?'clinic-sidebar clinic-sidebar--open':'clinic-sidebar'}>
      <NavLink className="clinic-brand" to="/clinic/dashboard" onClick={close}><img src="/mmsc-logo.jpg" alt="MMSC crest"/><span><strong>MMSC Clinic</strong><small>Health &amp; wellness</small></span></NavLink>
      <button className="clinic-nav-close" onClick={close} aria-label="Close clinic navigation"><X/></button>
      <nav aria-label="Clinic portal">{links.filter(link=>has(link.permission)).map(link=>{const Icon=link.icon;return <NavLink key={link.to} to={link.to} onClick={close}><Icon/>{link.label}</NavLink>})}</nav>
      <div className="clinic-confidential"><HeartPulse/><span><strong>Restricted workspace</strong><small>Clinical records are permission controlled and audited.</small></span></div>
    </aside>
    {open&&<button className="clinic-backdrop" aria-label="Dismiss clinic navigation" onClick={close}/>} 
    <header><button className="clinic-menu" aria-label="Open clinic navigation" onClick={()=>setOpen(true)}><Menu/></button><div className="clinic-context"><strong>Clinic Portal</strong><small>My Messiah School of Cavite</small></div><ExperienceSwitcher/>{has('notification.inbox.access')&&<NotificationBell to="/clinic/notifications"/>}<span><strong>{user?.displayName}</strong><small>Clinic staff</small></span><button className="clinic-signout" aria-label="Sign out" onClick={()=>void logout()}><LogOut/></button></header>
    <main id="clinic-main" data-route-main tabIndex={-1}><Outlet/></main>
  </div>;
}
