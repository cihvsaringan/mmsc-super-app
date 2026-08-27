import { pool } from '../database/pool.js';
import { securityRepository } from '../security/repository.js';

type Context = { actorId: string; requestId: string; ip?: string | undefined };

export const libraryNotificationRepository = {
  async run(context: Context) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const candidates = await client.query(`
        SELECT l.id AS loan_id, l.due_at, b.title, s.user_id AS student_user_id,
          array_remove(array_agg(DISTINCT g.user_id), NULL) AS guardian_user_ids,
          CASE
            WHEN l.due_at::date = current_date + 3 THEN 'due_3_days'
            WHEN l.due_at::date = current_date + 1 THEN 'due_1_day'
            WHEN l.due_at::date = current_date THEN 'due_today'
            WHEN (l.due_at + ((CASE WHEN bp.enabled THEN bp.grace_period_days ELSE ls.grace_period_days END) * interval '1 day'))::date = current_date - 3 THEN 'overdue_3_days'
            WHEN (l.due_at + ((CASE WHEN bp.enabled THEN bp.grace_period_days ELSE ls.grace_period_days END) * interval '1 day'))::date = current_date - 7 THEN 'overdue_7_days'
          END AS trigger_key
        FROM library_loans l
        JOIN library_book_copies bc ON bc.id = l.copy_id
        JOIN library_books b ON b.id = bc.book_id
        JOIN library_settings ls ON ls.school_id = b.school_id
        LEFT JOIN library_borrowing_policies bp ON bp.school_id = b.school_id AND bp.patron_type = 'student'
        JOIN students s ON s.id = l.student_id
        LEFT JOIN student_guardians sg ON sg.student_id = s.id AND sg.archived_at IS NULL AND sg.receives_communications
        LEFT JOIN guardians g ON g.id = sg.guardian_id AND g.archived_at IS NULL
        WHERE l.returned_at IS NULL AND l.student_id IS NOT NULL AND (
          l.due_at::date IN (current_date + 3, current_date + 1, current_date)
          OR (l.due_at + ((CASE WHEN bp.enabled THEN bp.grace_period_days ELSE ls.grace_period_days END) * interval '1 day'))::date IN (current_date - 3, current_date - 7)
        )
        GROUP BY l.id, b.title, s.user_id, bp.enabled, bp.grace_period_days, ls.grace_period_days
      `);
      let created = 0;
      for (const row of candidates.rows) {
        if (!row.trigger_key) continue;
        const recipients = new Set<string>([row.student_user_id, ...row.guardian_user_ids].filter(Boolean));
        if (!recipients.size) continue;
        const existing = await client.query(
          'SELECT 1 FROM library_notification_dispatches WHERE loan_id=$1 AND trigger_key=$2',
          [row.loan_id, row.trigger_key],
        );
        if (existing.rowCount) continue;
        const overdue = String(row.trigger_key).startsWith('overdue');
        const notification = (await client.query(
          `INSERT INTO notifications(title,body,category,priority,status,published_at,published_by,created_by)
           VALUES($1,$2,'general',$3,'published',now(),$4,$4) RETURNING id`,
          [overdue ? 'Library book overdue' : 'Library book due soon', overdue ? `${row.title} is overdue. Please return it to the Library.` : `${row.title} is due ${new Date(row.due_at).toLocaleDateString('en-PH')}.`, overdue ? 'important' : 'normal', context.actorId],
        )).rows[0];
        for (const userId of recipients) {
          await client.query('INSERT INTO notification_recipients(notification_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [notification.id, userId]);
        }
        await client.query(
          `INSERT INTO notification_events(notification_id,actor_user_id,action,metadata)
           VALUES($1,$2,'published',jsonb_build_object('source','library','loanId',$3::text,'trigger',$4::text,'recipientCount',$5::int))`,
          [notification.id, context.actorId, row.loan_id, row.trigger_key, recipients.size],
        );
        await client.query('INSERT INTO library_notification_dispatches(loan_id,trigger_key,notification_id) VALUES($1,$2,$3)', [row.loan_id, row.trigger_key, notification.id]);
        await securityRepository.audit({ actorUserId: context.actorId, action: 'library.notification.created', targetType: 'library_loan', targetId: row.loan_id, outcome: 'success', requestId: context.requestId, ipAddress: context.ip, metadata: { trigger: row.trigger_key, recipientCount: recipients.size } }, client);
        created += 1;
      }
      await client.query('COMMIT');
      return { candidates: candidates.rowCount ?? 0, created };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
};
