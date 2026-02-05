CREATE TABLE IF NOT EXISTS publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES journal_issues(id),
  paper_id UUID UNIQUE NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  article_index INT,
  published_by UUID REFERENCES users(id),
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  year_label TEXT DEFAULT 'Conference 2026'
  UNIQUE (issue_id, article_index)
);
