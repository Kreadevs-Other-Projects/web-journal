CREATE TABLE IF NOT EXISTS paper_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  sent_to UUID NOT NULL REFERENCES users(id),
  sent_by UUID NOT NULL REFERENCES users(id),
  role VARCHAR(50) NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS paper_reminders_paper_sent_to ON paper_reminders(paper_id, sent_to);
