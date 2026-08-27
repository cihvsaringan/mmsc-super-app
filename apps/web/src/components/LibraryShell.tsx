import{BarChart3,BookOpen,BookUp,ClipboardCheck,ClockAlert,LayoutDashboard,Library,LogOut,Menu,Settings,UserRoundSearch,UsersRound,X}from'lucide-react';
import{useState}from'react';
import{NavLink,Outlet}from'react-router-dom';
import{useAuth}from'../auth/AuthContext';
import{ExperienceSwitcher}from'./ExperienceSwitcher';

const links=[
  {to:'/library/dashboard',label:'Dashboard',permission:'library.dashboard.view',icon:LayoutDashboard},
  {to:'/library/checkout',label:'Checkout',permission:'library.circulation.checkout',icon:BookUp},
  {to:'/library/check-in',label:'Check-in',permission:'library.circulation.checkin',icon:ClipboardCheck},
  {to:'/library/catalog',label:'Catalog',permission:'library.catalog.view',icon:BookOpen},
  {to:'/library/patrons',label:'Patrons',permission:'library.patrons.view',icon:UserRoundSearch},
  {to:'/library/visitors',label:'Visitors',permission:'library.visitors.view',icon:UsersRound},
  {to:'/library/overdue',label:'Overdue',permission:'library.overdue.view',icon:ClockAlert},
  {to:'/library/reports',label:'Reports',permission:'library.reports.view',icon:BarChart3},
  {to:'/library/settings',label:'Settings',permission:'library.settings.view',icon:Settings},
]as const;

export function LibraryShell(){
  const[open,setOpen]=useState(false);const{user,logout,has}=useAuth();const close=()=>setOpen(false);
  return <div className="library-shell"><a className="skip-link" href="#library-main">Skip to library workspace</a>
    <aside className={open?'library-sidebar library-sidebar--open':'library-sidebar'}>
      <NavLink className="library-brand" to="/library/dashboard" onClick={close}><img src="/mmsc-logo.jpg" alt="MMSC crest"/><span><strong>MMSC Library</strong><small>Learning resource center</small></span></NavLink>
      <button className="library-nav-close" onClick={close} aria-label="Close library navigation"><X/></button>
      <nav aria-label="Library portal">{links.filter(link=>has(link.permission)).map(link=>{const Icon=link.icon;return <NavLink key={link.to} to={link.to} onClick={close}><Icon/>{link.label}</NavLink>})}</nav>
      <div className="library-boundary"><Library/><span><strong>Shared identities</strong><small>Patrons resolve from authorized MMSC student and employee records.</small></span></div>
    </aside>
    {open&&<button className="library-backdrop" aria-label="Dismiss library navigation" onClick={close}/>} 
    <header><button className="library-menu" aria-label="Open library navigation" onClick={()=>setOpen(true)}><Menu/></button><div className="library-context"><strong>Library Portal</strong><small>My Messiah School of Cavite</small></div><ExperienceSwitcher/><span><strong>{user?.displayName}</strong><small>Library staff</small></span><button className="library-signout" aria-label="Sign out" onClick={()=>void logout()}><LogOut/></button></header>
    <main id="library-main" data-route-main tabIndex={-1}><Outlet/></main>
  </div>;
}
