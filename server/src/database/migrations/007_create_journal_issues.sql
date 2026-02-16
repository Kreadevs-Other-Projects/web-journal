CREATE TABLE IF NOT EXISTS journal_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  year INT NOT NULL,
  volume INT,
  issue INT,
  label TEXT NOT NULL,
  status issue_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE (journal_id, label)
);

CREATE UNIQUE INDEX one_open_issue_per_journal
ON journal_issues (journal_id)
WHERE status = 'open';

