-- Add new submission fields to papers table
ALTER TABLE papers
  ADD COLUMN IF NOT EXISTS author_names TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS corresponding_authors TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS paper_references JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS manuscript_url TEXT;

-- Create paper_status_log for Change 8 audit trail
CREATE TABLE IF NOT EXISTS paper_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  status paper_status NOT NULL,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT
);
