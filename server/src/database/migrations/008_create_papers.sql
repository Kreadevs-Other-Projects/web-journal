CREATE TABLE IF NOT EXISTS papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  journal_id UUID NOT NULL
    REFERENCES journals(id)
    ON DELETE CASCADE,

  issue_id UUID
    REFERENCES journal_issues(id)
    ON DELETE SET NULL,

  author_id UUID NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,

  title TEXT NOT NULL,
  category TEXT,
  abstract TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',

  status paper_status NOT NULL DEFAULT 'submitted',

  current_version_id UUID,

  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMP,
  published_at TIMESTAMP,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paper_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  paper_id UUID NOT NULL
    REFERENCES papers(id)
    ON DELETE CASCADE,

  version_number INT NOT NULL,
  version_label TEXT,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,

  uploaded_by UUID NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,

  editor_comment TEXT,
  author_note TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE (paper_id, version_number)
);

ALTER TABLE papers
  ADD CONSTRAINT fk_current_version
  FOREIGN KEY (current_version_id)
  REFERENCES paper_versions(id)
  ON DELETE SET NULL;
