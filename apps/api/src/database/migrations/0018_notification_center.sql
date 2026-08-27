CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(180) NOT NULL CHECK (char_length(trim(title)) BETWEEN 1 AND 180),
  body text NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 5000),
  category varchar(30) NOT NULL DEFAULT 'announcement' CHECK (category IN ('announcement','academic','attendance','admissions','event','emergency','general')),
  priority varchar(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal','important','urgent')),
  action_url varchar(500) CHECK (action_url IS NULL OR (action_url LIKE '/%' AND action_url NOT LIKE '//%')),
  status varchar(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  expires_at timestamptz,
  published_at timestamptz,
  published_by uuid REFERENCES users(id),
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  CHECK ((status = 'draft' AND published_at IS NULL AND published_by IS NULL) OR (status <> 'draft' AND published_at IS NOT NULL AND published_by IS NOT NULL)),
  CHECK (expires_at IS NULL OR expires_at > created_at)
);
CREATE INDEX notifications_status_published_idx ON notifications (status, published_at DESC);

CREATE TABLE notification_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  audience_type varchar(30) NOT NULL CHECK (audience_type IN ('all_users','role','employees','teachers','students','guardians','grade_level','section','user')),
  target_key varchar(100) NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (notification_id, audience_type, target_key),
  CHECK ((audience_type IN ('all_users','employees','teachers','students','guardians') AND target_key = '') OR (audience_type NOT IN ('all_users','employees','teachers','students','guardians') AND char_length(target_key) > 0))
);
CREATE INDEX notification_targets_lookup_idx ON notification_targets (audience_type, target_key);

CREATE TABLE notification_recipients (
  notification_id uuid NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delivered_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  archived_at timestamptz,
  PRIMARY KEY (notification_id, user_id)
);
CREATE INDEX notification_recipients_user_inbox_idx ON notification_recipients (user_id, delivered_at DESC) WHERE archived_at IS NULL;
CREATE INDEX notification_recipients_user_unread_idx ON notification_recipients (user_id) WHERE read_at IS NULL AND archived_at IS NULL;

CREATE TABLE notification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES notifications(id),
  actor_user_id uuid NOT NULL REFERENCES users(id),
  action varchar(30) NOT NULL CHECK (action IN ('created','updated','published','archived')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notification_events_notification_idx ON notification_events (notification_id, created_at DESC);
CREATE TRIGGER notification_events_immutable BEFORE UPDATE OR DELETE ON notification_events FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();
