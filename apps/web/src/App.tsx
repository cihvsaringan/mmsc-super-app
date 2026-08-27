import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { lazy, Suspense, type ComponentType } from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { AppShell } from './components/AppShell';
import { StudentShell } from './components/StudentShell';
import { ParentShell } from './components/ParentShell';
import { TeacherShell } from './components/TeacherShell';
import { ClinicShell } from './components/ClinicShell';
import { ClinicPortal } from './pages/ClinicPortal';
import { ClinicManagement } from './pages/ClinicManagement';
import { LibraryShell } from './components/LibraryShell';
import { LibraryPortal } from './pages/LibraryPortal';
import { ComputerLabShell } from './components/ComputerLabShell';
import { ComputerLab } from './pages/ComputerLab';
import { ComputerLabSchedule } from './pages/ComputerLabSchedule';
import { ComputerLabSessions } from './pages/ComputerLabSessions';
import { ComputerLabMaintenance } from './pages/ComputerLabMaintenance';
import { ComputerLabEquipment } from './pages/ComputerLabEquipment';
import { ComputerLabSoftware } from './pages/ComputerLabSoftware';
import { ComputerLabDashboard } from './pages/ComputerLabDashboard';
import { ComputerLabReports } from './pages/ComputerLabReports';
import { ParentLibrary, StudentLibrary } from './pages/PortalLibrary';
import { PortalClinicNotices } from './pages/PortalClinicNotices';
import { Spinner } from './components/ui';
import { RouteFocus } from './components/RouteFocus';
import { availableExperiences, computerLabHomePath, hasAdministrationAccess, homePath } from './auth/experiences';

const page = <T extends Record<string, unknown>, K extends keyof T>(loader: () => Promise<T>, name: K) => lazy(async () => ({ default: (await loader())[name] as ComponentType }));
const Academics=page(()=>import('./pages/Academics'),'Academics'),Admissions=page(()=>import('./pages/Admissions'),'Admissions'),Account=page(()=>import('./pages/Account'),'Account'),Assignments=page(()=>import('./pages/Assignments'),'Assignments'),Attendance=page(()=>import('./pages/Attendance'),'Attendance'),AttendanceTerminals=page(()=>import('./pages/AttendanceTerminals'),'AttendanceTerminals'),Dashboard=page(()=>import('./pages/Dashboard'),'Dashboard'),Enrollments=page(()=>import('./pages/Enrollments'),'Enrollments'),ExternalSchools=page(()=>import('./pages/ExternalSchools'),'ExternalSchools'),GradesReview=page(()=>import('./pages/GradesReview'),'GradesReview'),Login=page(()=>import('./pages/Login'),'Login'),Operations=page(()=>import('./pages/Operations'),'Operations'),ParentPortal=page(()=>import('./pages/ParentPortal'),'ParentPortal'),Registration=page(()=>import('./pages/Registration'),'Registration'),Security=page(()=>import('./pages/Security'),'Security'),StudentAttendance=page(()=>import('./pages/StudentAttendance'),'StudentAttendance'),StudentPortal=page(()=>import('./pages/StudentPortal'),'StudentPortal'),Students=page(()=>import('./pages/Students'),'Students'),TeacherGrades=page(()=>import('./pages/TeacherGrades'),'TeacherGrades'),TeacherPortal=page(()=>import('./pages/TeacherPortal'),'TeacherPortal'),Teachers=page(()=>import('./pages/Teachers'),'Teachers'),Workforce=page(()=>import('./pages/Workforce'),'Workforce'),Notifications=page(()=>import('./pages/Notifications'),'Notifications'),AttendanceOperations=page(()=>import('./pages/AttendanceOperations'),'AttendanceOperations'),CalendarExperience=page(()=>import('./pages/CalendarExperience'),'CalendarExperience'),RequiredPasswordChange=page(()=>import('./pages/RequiredPasswordChange'),'RequiredPasswordChange');

function NoApplicationAccess(){const{user,logout}=useAuth();return <main className="password-gate"><section className="login-card"><img src="/mmsc-logo.jpg" alt="MMSC crest"/><h1>Portal access required</h1><p>{user?.displayName}, your account is active but does not have permission to access a portal on this site. Contact a school administrator if you believe this is incorrect.</p><button type="button" className="button" onClick={()=>void logout()}>Sign out</button></section></main>}

function ProtectedApp() {
  const { user, loading, has } = useAuth();
  const location = useLocation();
  if (location.pathname.startsWith('/register')) return <Registration />;
  if (loading) return <div className="splash"><Spinner label="Checking your session" /></div>;
  if (!user) return <Login />;
  if(user.mustChangePassword)return <RequiredPasswordChange/>;

  const home = homePath(user);
  const denied = <Navigate to={home} replace />;

  return <><RouteFocus /><Routes>
    <Route path="/attendance-operations" element={has('attendance.operations.view') ? <AttendanceOperations /> : denied} />
    <Route path="/clinic" element={availableExperiences(user).some(item=>item.key==='clinic') ? <ClinicShell /> : denied}>
      <Route index element={<Navigate to="/clinic/dashboard" replace/>}/>
      <Route path="dashboard" element={has('clinic.dashboard.view')?<ClinicPortal/>:denied}/><Route path="students" element={has('clinic.student.lookup')?<ClinicPortal/>:denied}/><Route path="queue" element={has('clinic.encounter.view')?<ClinicPortal/>:denied}/><Route path="visits" element={has('clinic.encounter.view')?<ClinicPortal/>:denied}/><Route path="health-records" element={has('clinic.health_records.view')?<ClinicPortal/>:denied}/><Route path="inventory" element={has('clinic.inventory.view')?<ClinicPortal/>:denied}/><Route path="appointments" element={has('clinic.appointment.view')?<ClinicPortal/>:denied}/><Route path="follow-ups" element={has('clinic.follow_up.view')?<ClinicPortal/>:denied}/><Route path="reports" element={has('clinic.report.view')?<ClinicPortal/>:denied}/><Route path="notifications" element={has('notification.inbox.access')?<Notifications/>:denied}/>
    </Route>
    <Route path="/library" element={availableExperiences(user).some(item=>item.key==='library') ? <LibraryShell /> : denied}>
      <Route index element={<Navigate to="/library/dashboard" replace/>}/>
      <Route path="dashboard" element={has('library.dashboard.view')?<LibraryPortal/>:denied}/>
      <Route path="checkout" element={has('library.circulation.checkout')?<LibraryPortal/>:denied}/>
      <Route path="check-in" element={has('library.circulation.checkin')?<LibraryPortal/>:denied}/>
      <Route path="catalog" element={has('library.catalog.view')?<LibraryPortal/>:denied}/>
      <Route path="patrons" element={has('library.patrons.view')?<LibraryPortal/>:denied}/>
      <Route path="visitors" element={has('library.visitors.view')?<LibraryPortal/>:denied}/>
      <Route path="overdue" element={has('library.overdue.view')?<LibraryPortal/>:denied}/>
      <Route path="reports" element={has('library.reports.view')?<LibraryPortal/>:denied}/>
      <Route path="settings" element={has('library.settings.view')?<LibraryPortal/>:denied}/>
      <Route path="*" element={denied}/>
    </Route>
    <Route path="/computer-lab" element={availableExperiences(user).some(item=>item.key==='computer-lab')?<ComputerLabShell/>:denied}>
      <Route index element={<Navigate to={computerLabHomePath(user)} replace/>}/>
      <Route path="dashboard" element={has('computer_lab.dashboard.view')?<ComputerLabDashboard/>:denied}/>
      <Route path="laboratories" element={has('computer_lab.labs.view')?<ComputerLab/>:denied}/>
      <Route path="workstations" element={has('computer_lab.workstations.view')?<ComputerLab/>:denied}/>
      <Route path="schedule" element={has('computer_lab.schedule.view')?<ComputerLabSchedule/>:denied}/>
      <Route path="sessions" element={has('computer_lab.sessions.view')?<ComputerLabSessions/>:denied}/>
      <Route path="issues" element={has('computer_lab.issues.view')?<ComputerLabMaintenance/>:denied}/>
      <Route path="equipment" element={has('computer_lab.equipment.view')?<ComputerLabEquipment/>:denied}/>
      <Route path="software" element={has('computer_lab.software.view')?<ComputerLabSoftware/>:denied}/>
      <Route path="reports" element={has('computer_lab.reports.view')?<ComputerLabReports/>:denied}/>
      <Route path="*" element={denied}/>
    </Route>
    <Route path="/teacher" element={user.roles.includes('teacher') && has('teacher.portal.access') ? <TeacherShell /> : denied}>
      <Route index element={<TeacherPortal />} />
      <Route path="grades" element={has('grades.encode') ? <TeacherGrades /> : <Navigate to="/teacher" replace />} />
      <Route path="account" element={<Account />} />
      <Route path="notifications" element={has('notification.inbox.access') ? <Notifications /> : <Navigate to="/teacher" replace />} />
      <Route path="calendar" element={has('calendar.experience.access') ? <CalendarExperience /> : <Navigate to="/teacher" replace />} />
    </Route>
    <Route path="/student" element={user.roles.includes('student') && has('student.portal.access') ? <StudentShell /> : denied}>
      <Route index element={<StudentPortal />} />
      <Route path="account" element={<Account />} />
      <Route path="notifications" element={has('notification.inbox.access') ? <Notifications /> : <Navigate to="/student" replace />} />
      <Route path="calendar" element={has('calendar.experience.access') ? <CalendarExperience /> : <Navigate to="/student" replace />} />
      <Route path="clinic" element={<PortalClinicNotices portal="student" />} />
      <Route path="library" element={<StudentLibrary/>}/>
    </Route>
    <Route path="/parent" element={user.roles.includes('parent_guardian') && has('parent.portal.access') ? <ParentShell /> : denied}><Route index element={<ParentPortal/>}/><Route path="account" element={<Account/>}/><Route path="notifications" element={has('notification.inbox.access')?<Notifications/>:denied}/><Route path="calendar" element={has('calendar.experience.access')?<CalendarExperience/>:denied}/><Route path="clinic" element={<PortalClinicNotices portal="parent"/>}/><Route path="library" element={<ParentLibrary/>}/></Route>
    <Route path="/access-denied" element={home==='/access-denied'?<NoApplicationAccess/>:<Navigate to={home} replace/>}/>
    <Route path="/" element={home === '/' ? <AppShell><Dashboard/></AppShell> : <Navigate to={home} replace />} />
    <Route element={hasAdministrationAccess(user)?<AppShell />:denied}>
      <Route path="/account" element={<Account />} />
      <Route path="/notifications" element={has('notification.inbox.access') ? <Notifications /> : denied} />
      <Route path="/calendar" element={has('calendar.experience.access') ? <CalendarExperience /> : denied} />
      <Route path="/grade-review" element={has('grades.review') ? <GradesReview /> : denied} />
      <Route path="/academics" element={(has('academic.config.view') || has('academic.calendar.view')) ? <Academics /> : denied} />
      <Route path="/assignments" element={has('academic.assignment.view') ? <Assignments /> : denied} />
      <Route path="/attendance" element={has('employee.attendance.view') ? <Attendance /> : denied} />
      <Route path="/student-attendance" element={has('student.attendance.view') ? <StudentAttendance /> : denied} />
      <Route path="/operations" element={(has('administration.operations.view') || has('report.view') || has('administration.settings.view')) ? <Operations /> : denied} />
      <Route path="/attendance-terminals" element={has('attendance.terminal.manage') ? <AttendanceTerminals /> : denied} />
      <Route path="/workforce" element={has('employee.view') ? <Workforce /> : denied} />
      <Route path="/teachers" element={has('teacher.profile.view') ? <Teachers /> : denied} />
      <Route path="/students" element={has('student.profile.view') ? <Students /> : denied} />
      <Route path="/enrollments" element={has('enrollment.view') ? <Enrollments /> : denied} />
      <Route path="/admissions" element={has('admission.view') ? <Admissions /> : denied} />
      <Route path="/security" element={(has('security.user.view') || has('security.role.view') || has('security.account.provision') || has('audit.view')) ? <Security /> : denied} />
      <Route path="/reference-data/external-schools" element={has('reference.external_school.view')?<ExternalSchools/>:denied}/>
      <Route path="/clinic-management" element={has('clinic.config.view')?<ClinicManagement/>:denied}/>
      <Route path="*" element={denied} />
    </Route>
  </Routes></>;
}

export function App() {
  return <AuthProvider><Suspense fallback={<div className="splash"><Spinner label="Loading MMSC workspace" /></div>}><ProtectedApp /></Suspense></AuthProvider>;
}
