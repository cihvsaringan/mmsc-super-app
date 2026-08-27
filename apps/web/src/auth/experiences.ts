import type { CurrentUser } from './AuthContext';

export type ExperienceKey='administration'|'teacher'|'student'|'parent'|'clinic'|'library'|'computer-lab';
export type Experience={key:ExperienceKey;label:string;description:string;path:string};
type ExperienceDefinition=Omit<Experience,'path'>&{path:string|((user:CurrentUser)=>string);isAvailable:(user:CurrentUser)=>boolean};

const hasRole=(user:CurrentUser,role:string)=>user.roles.includes(role);
const hasPermission=(user:CurrentUser,permission:string)=>user.permissions.includes(permission);
export const hasAdministrationAccess=(user:CurrentUser)=>user.roles.some(role=>['super_administrator','school_administrator','principal','registrar','hr_administrator','hr_staff'].includes(role));
const computerLabLandings=[['computer_lab.dashboard.view','/computer-lab/dashboard'],['computer_lab.labs.view','/computer-lab/laboratories'],['computer_lab.workstations.view','/computer-lab/workstations'],['computer_lab.schedule.view','/computer-lab/schedule'],['computer_lab.sessions.view','/computer-lab/sessions'],['computer_lab.issues.view','/computer-lab/issues'],['computer_lab.maintenance.view','/computer-lab/issues'],['computer_lab.equipment.view','/computer-lab/equipment'],['computer_lab.software.view','/computer-lab/software'],['computer_lab.reports.view','/computer-lab/reports']]as const;
export const computerLabHomePath=(user:CurrentUser)=>computerLabLandings.find(([permission])=>hasPermission(user,permission))?.[1]??'/access-denied';

// Register future workspaces only after their route and centralized access grant exist.
// This prepares discovery for operational apps without exposing deferred phases.
const experienceRegistry:ExperienceDefinition[]=[
  {key:'administration',label:'Administration',description:'School management and oversight',path:'/',isAvailable:hasAdministrationAccess},
  {key:'teacher',label:'Teacher Portal',description:'Classes, grades, and teaching work',path:'/teacher',isAvailable:user=>hasRole(user,'teacher')&&hasPermission(user,'teacher.portal.access')},
  {key:'student',label:'Student Portal',description:'Subjects, grades, and attendance',path:'/student',isAvailable:user=>hasRole(user,'student')&&hasPermission(user,'student.portal.access')},
  {key:'parent',label:'Family Portal',description:'Linked children and school updates',path:'/parent',isAvailable:user=>hasRole(user,'parent_guardian')&&hasPermission(user,'parent.portal.access')},
  {key:'clinic',label:'Clinic',description:'Student care and clinic operations',path:'/clinic/dashboard',isAvailable:user=>hasPermission(user,'clinic.portal.access')},
  {key:'library',label:'Library',description:'Catalog, circulation, and library operations',path:'/library/dashboard',isAvailable:user=>hasPermission(user,'library.portal.access')},
  {key:'computer-lab',label:'Computer Laboratory',description:'Laboratories and workstation operations',path:computerLabHomePath,isAvailable:user=>hasPermission(user,'computer_lab.access')},
];

export function availableExperiences(user:CurrentUser):Experience[]{return experienceRegistry.filter(item=>item.isAvailable(user)).map(item=>({key:item.key,label:item.label,description:item.description,path:typeof item.path==='function'?item.path(user):item.path}));}
export function homePath(user:CurrentUser):string{const experiences=availableExperiences(user);return experiences.find(item=>item.key==='administration')?.path??experiences[0]?.path??'/access-denied';}
export function currentExperience(pathname:string,experiences:Experience[]):Experience|undefined{
  const routeExperience=experiences.find(item=>{
    if(item.key==='administration')return false;
    const namespace=`/${item.key}`;
    return pathname===namespace||pathname.startsWith(`${namespace}/`);
  });
  return routeExperience??experiences.find(item=>item.key==='administration')??experiences[0];
}
export function currentExperiencePath(pathname:string,experiences:Experience[]):string{return currentExperience(pathname,experiences)?.path??'/';}
