-- Feature 1: Payment reminder tracking
ALTER TABLE paper_payments ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMPTZ;

-- Feature 3: Takedown system
ALTER TABLE journals ADD COLUMN IF NOT EXISTS is_taken_down BOOLEAN DEFAULT FALSE;
ALTER TABLE journals ADD COLUMN IF NOT EXISTS takedown_reason TEXT;
ALTER TABLE journals ADD COLUMN IF NOT EXISTS taken_down_at TIMESTAMPTZ;
ALTER TABLE journals ADD COLUMN IF NOT EXISTS taken_down_by UUID REFERENCES users(id);

ALTER TABLE journal_issues ADD COLUMN IF NOT EXISTS is_taken_down BOOLEAN DEFAULT FALSE;
ALTER TABLE journal_issues ADD COLUMN IF NOT EXISTS takedown_reason TEXT;
ALTER TABLE journal_issues ADD COLUMN IF NOT EXISTS taken_down_at TIMESTAMPTZ;

ALTER TABLE papers ADD COLUMN IF NOT EXISTS is_taken_down BOOLEAN DEFAULT FALSE;
ALTER TABLE papers ADD COLUMN IF NOT EXISTS takedown_reason TEXT;
ALTER TABLE papers ADD COLUMN IF NOT EXISTS taken_down_at TIMESTAMPTZ;
ALTER TABLE papers ADD COLUMN IF NOT EXISTS taken_down_by UUID REFERENCES users(id);
