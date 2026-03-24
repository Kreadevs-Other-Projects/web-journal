-- Migration: staff_invitations table + allow null chief_editor_id on journals
-- Run once against the giki database

-- Allow journals to exist before a chief editor accepts their invitation
ALTER TABLE journals ALTER COLUMN chief_editor_id DROP NOT NULL;

-- Invitation tracking table
CREATE TABLE IF NOT EXISTS staff_invitations (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  token       TEXT         UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  email       TEXT         NOT NULL,
  name        TEXT         NOT NULL,
  role        user_role    NOT NULL,
  journal_id  UUID         REFERENCES journals(id) ON DELETE CASCADE,
  paper_id    UUID         REFERENCES papers(id)   ON DELETE SET NULL,
  invited_by  UUID         NOT NULL REFERENCES users(id),
  status      TEXT         NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at  TIMESTAMPTZ  NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Prevent duplicate pending invitations for same email+role+journal
CREATE UNIQUE INDEX IF NOT EXISTS uq_pending_invitation
  ON staff_invitations (email, role, journal_id)
  WHERE status = 'pending';
