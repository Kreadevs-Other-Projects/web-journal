CREATE TABLE IF NOT EXISTS publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id UUID UNIQUE NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  published_by UUID REFERENCES users(id),
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  year_label TEXT DEFAULT 'Conference 2026'
);

ALTER TABLE publications
ADD COLUMN IF NOT EXISTS issue_id UUID REFERENCES journal_issues(id);
