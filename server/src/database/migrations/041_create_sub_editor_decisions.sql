-- Sub editor decisions table: records each decision an associate editor makes on a paper
CREATE TABLE IF NOT EXISTS sub_editor_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  sub_editor_id UUID NOT NULL REFERENCES users(id),
  decision TEXT NOT NULL CHECK (decision IN ('approve', 'revision', 'reject')),
  comments TEXT,
  paper_version_id UUID REFERENCES paper_versions(id),
  decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sub_editor_decisions_paper_id_idx ON sub_editor_decisions(paper_id);
CREATE INDEX IF NOT EXISTS sub_editor_decisions_sub_editor_id_idx ON sub_editor_decisions(sub_editor_id);
