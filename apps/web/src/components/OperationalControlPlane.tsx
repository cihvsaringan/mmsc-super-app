import { AlertTriangle, CheckCircle2, Clock3, Database, HardDrive, MonitorSmartphone, RefreshCw, Server, ShieldCheck, UsersRound, Workflow } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { api, apiErrorMessage } from '../lib/api';
import { EmptyState, Modal, Spinner } from './ui';
import './operational-control-plane.css';

type Snapshot = {
  generatedAt: string;
  service: { api: 'available'; database: 'available' };
  database: { migrationCount: number; latestMigration: string | null; latestMigrationAt: string | null; seedCount: number; latestSeed: string | null; latestSeedAt: string | null };
  accounts: { active: number; inactive: number; locked: number; passwordChangeRequired: number };
  sessions: { active: number; stale: number; revoked: number };
  workflows: { admissions: number; gradebooks: number; attendanceExceptions: number; notificationDrafts: number; unreadNotifications: number };
  terminals: { active: number; inactive: number; revoked: number; activeSessions: number; rejected24h: number; staleActive: number };
  storage: { assetCount: number; storedBytes: number };
  recentFailures: { id: string; action: string; actorName: string | null; occurredAt: string }[];
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024, index = 0;
  while (value >= 1024 && index < units.length - 1) { value /= 1024; index += 1; }
  return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[index]}`;
};
const label = (value: string) => value.replaceAll('.', ' · ').replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());

export function OperationalControlPlane({ canManage }: { canManage: boolean }) {
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [loading, setLoading] = useState(true), [maintaining, setMaintaining] = useState(false), [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(''), [notice, setNotice] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    try { setSnapshot(await api<Snapshot>('/administration/operations')); setError(''); }
    catch (cause) { setError(apiErrorMessage(cause, 'Unable to load platform operations')); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const maintain = async () => {
    setMaintaining(true); setError(''); setNotice('');
    try {
      const response = await api<{ result: { affectedCount: number } }>('/administration/operations/session-maintenance', { method: 'POST', body: JSON.stringify({ confirmation: 'CLOSE_STALE_SESSIONS' }) });
      setNotice(`${response.result.affectedCount} stale ${response.result.affectedCount === 1 ? 'session was' : 'sessions were'} closed. The action was recorded in the audit trail.`);
      setConfirming(false); await load();
    } catch (cause) { setError(apiErrorMessage(cause, 'Unable to close stale sessions')); }
    finally { setMaintaining(false); }
  };
  if (loading && !snapshot) return <Spinner label="Checking platform operations" />;
  if (!snapshot) return <div className="form-error" role="alert">{error || 'Platform operations are unavailable.'}</div>;
  const attention = snapshot.sessions.stale + snapshot.accounts.locked + snapshot.workflows.attendanceExceptions + snapshot.terminals.rejected24h + snapshot.terminals.staleActive;
  return <div className="ops-control-plane">
    <header className="ops-commandbar">
      <div><span className="ops-live"><i /> Live operational read model</span><h2>Platform control plane</h2><p>Current service posture and actionable backlogs from authoritative MMSC domains.</p></div>
      <div><span>As of {new Date(snapshot.generatedAt).toLocaleString('en-PH')}</span><button className="text-button" disabled={loading} onClick={() => void load()}><RefreshCw />{loading ? 'Refreshing…' : 'Refresh'}</button></div>
    </header>
    {error && <div className="form-error" role="alert">{error}</div>}{notice && <div className="ops-notice" role="status"><CheckCircle2 />{notice}</div>}
    <section className="ops-posture" aria-label="Service posture">
      <div className="ops-posture-main"><Server /><span><strong>API available</strong><small>The application process is responding.</small></span><CheckCircle2 /></div>
      <div className="ops-posture-main"><Database /><span><strong>Database available</strong><small>{snapshot.database.migrationCount} migrations · latest {snapshot.database.latestMigration ?? 'not recorded'}</small></span><CheckCircle2 /></div>
      <div className={attention ? 'ops-attention needs-attention' : 'ops-attention'}><AlertTriangle /><span><strong>{attention ? `${attention} items need review` : 'No immediate operational flags'}</strong><small>Security, attendance, and terminal signals requiring staff attention.</small></span></div>
    </section>
    <div className="ops-ledger">
      <section><UsersRound /><span>Accounts</span><strong>{snapshot.accounts.active}</strong><small>{snapshot.accounts.locked} locked · {snapshot.accounts.passwordChangeRequired} awaiting password change</small></section>
      <section><ShieldCheck /><span>Sessions</span><strong>{snapshot.sessions.active}</strong><small>{snapshot.sessions.stale} stale · {snapshot.sessions.revoked} previously revoked</small></section>
      <section><Workflow /><span>Workflow queue</span><strong>{snapshot.workflows.admissions + snapshot.workflows.gradebooks + snapshot.workflows.attendanceExceptions}</strong><small>Admissions, grading, and attendance review</small></section>
      <section><MonitorSmartphone /><span>Terminals</span><strong>{snapshot.terminals.active}</strong><small>{snapshot.terminals.activeSessions} sessions · {snapshot.terminals.rejected24h} rejected scans today</small></section>
    </div>
    <div className="ops-detail-columns">
      <section className="ops-detail">
        <header><Workflow /><div><h3>Operational queues</h3><p>Work waiting in implemented MMSC domains.</p></div></header>
        <dl><div><dt>Admissions requiring review</dt><dd>{snapshot.workflows.admissions}</dd></div><div><dt>Gradebooks submitted or reviewed</dt><dd>{snapshot.workflows.gradebooks}</dd></div><div><dt>Open attendance exceptions</dt><dd>{snapshot.workflows.attendanceExceptions}</dd></div><div><dt>Notification drafts</dt><dd>{snapshot.workflows.notificationDrafts}</dd></div><div><dt>Unread notification deliveries</dt><dd>{snapshot.workflows.unreadNotifications}</dd></div></dl>
      </section>
      <section className="ops-detail">
        <header><MonitorSmartphone /><div><h3>Terminal estate</h3><p>Registered devices and recent capture posture.</p></div></header>
        <dl><div><dt>Active / inactive / revoked</dt><dd>{snapshot.terminals.active} / {snapshot.terminals.inactive} / {snapshot.terminals.revoked}</dd></div><div><dt>Active operator sessions</dt><dd>{snapshot.terminals.activeSessions}</dd></div><div><dt>Active terminals not seen in 24h</dt><dd>{snapshot.terminals.staleActive}</dd></div><div><dt>Rejected scans in 24h</dt><dd>{snapshot.terminals.rejected24h}</dd></div></dl>
      </section>
      <section className="ops-detail">
        <header><HardDrive /><div><h3>Release and storage</h3><p>Database release state and managed media footprint.</p></div></header>
        <dl><div><dt>Applied migrations</dt><dd>{snapshot.database.migrationCount}</dd></div><div><dt>Recorded seeds</dt><dd>{snapshot.database.seedCount}</dd></div><div><dt>Latest seed</dt><dd>{snapshot.database.latestSeed ?? 'Not recorded'}</dd></div><div><dt>Managed media</dt><dd>{snapshot.storage.assetCount} · {formatBytes(snapshot.storage.storedBytes)}</dd></div></dl>
      </section>
      <section className="ops-detail ops-failures">
        <header><Clock3 /><div><h3>Recent failed operations</h3><p>Audit failures recorded during the past 24 hours.</p></div></header>
        {snapshot.recentFailures.length ? <ol>{snapshot.recentFailures.map((failure) => <li key={failure.id}><span><strong>{label(failure.action)}</strong><small>{failure.actorName ?? 'System or anonymous'}</small></span><time>{new Date(failure.occurredAt).toLocaleTimeString('en-PH')}</time></li>)}</ol> : <EmptyState title="No recent failures" message="No failed audit events were recorded in the past 24 hours." />}
      </section>
    </div>
    <section className="ops-maintenance">
      <div><ShieldCheck /><span><h3>Session hygiene</h3><p>Close only sessions that are already expired or belong to an inactive or archived account. Active valid sessions are never touched.</p></span></div>
      {canManage ? <button className="button" disabled={!snapshot.sessions.stale} onClick={() => setConfirming(true)}>Close {snapshot.sessions.stale} stale {snapshot.sessions.stale === 1 ? 'session' : 'sessions'}</button> : <small>View-only access</small>}
    </section>
    <Modal open={confirming} title="Close stale sessions?" description="This revokes only sessions that can no longer authenticate because they are expired or their account is unavailable." busy={maintaining} error={error} onClose={() => setConfirming(false)} footer={<><button className="text-button" disabled={maintaining} onClick={() => setConfirming(false)}>Cancel</button><button className="button" disabled={maintaining} onClick={() => void maintain()}>{maintaining ? 'Closing…' : 'Confirm maintenance'}</button></>}><p>The affected count and operator will be written to the immutable audit trail. Valid active sessions remain open.</p></Modal>
  </div>;
}
