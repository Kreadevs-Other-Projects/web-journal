CREATE TABLE IF NOT EXISTS journal_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  year INT NOT NULL,
  volume INT,
  issue INT,
  label TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE (journal_id, label)
);
