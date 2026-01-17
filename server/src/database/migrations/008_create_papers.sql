CREATE TABLE IF NOT EXISTS papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  abstract TEXT,
  category TEXT,
  keywords TEXT[],
  author_id UUID NOT NULL REFERENCES users(id),
  status paper_status NOT NULL DEFAULT 'submitted',
  current_version UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paper_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  version_label TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(paper_id, version_label)
);

ALTER TABLE papers
    ADD CONSTRAINT fk_current_version
    FOREIGN KEY (current_version) REFERENCES paper_versions(id);

ALTER TABLE papers
ADD COLUMN IF NOT EXISTS journal_id UUID REFERENCES journals(id);

