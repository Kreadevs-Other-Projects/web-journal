-- Add pending_ca_approval and ca_rejected to paper_status enum
ALTER TYPE paper_status ADD VALUE IF NOT EXISTS 'pending_ca_approval';
ALTER TYPE paper_status ADD VALUE IF NOT EXISTS 'ca_rejected';

-- Create paper_approvals table for corresponding author approval flow
CREATE TABLE IF NOT EXISTS paper_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  corr_author_email TEXT NOT NULL,
  corr_author_name TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  responded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_paper_approvals_token ON paper_approvals(token);
CREATE INDEX IF NOT EXISTS idx_paper_approvals_paper_id ON paper_approvals(paper_id);
