import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OperationalControlPlane } from './OperationalControlPlane';

describe('Phase 28 operational control plane', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({
    generatedAt: '2026-08-21T08:00:00.000Z', service: { api: 'available', database: 'available' },
    database: { migrationCount: 21, latestMigration: '0021.sql', latestMigrationAt: null, seedCount: 3, latestSeed: 'phase-28-operational-administration', latestSeedAt: null },
    accounts: { active: 5, inactive: 1, locked: 0, passwordChangeRequired: 1 }, sessions: { active: 2, stale: 0, revoked: 4 },
    workflows: { admissions: 1, gradebooks: 2, attendanceExceptions: 0, notificationDrafts: 1, unreadNotifications: 3 },
    terminals: { active: 1, inactive: 0, revoked: 0, activeSessions: 1, rejected24h: 0, staleActive: 0 }, storage: { assetCount: 2, storedBytes: 2048 }, recentFailures: [],
  }) })));

  it('renders authoritative posture, queues, and a safe disabled maintenance action', async () => {
    render(<OperationalControlPlane canManage />);
    expect(await screen.findByText('Platform control plane')).toBeInTheDocument();
    expect(screen.getByText('API available')).toBeInTheDocument();
    expect(screen.getByText('Admissions requiring review')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close 0 stale sessions/i })).toBeDisabled();
  });
});
