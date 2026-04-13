CREATE TABLE IF NOT EXISTS reviewer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  sub_editor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  suggested_name TEXT NOT NULL,
  suggested_email TEXT NOT NULL,
  keywords TEXT[],
  degrees TEXT[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ
);
