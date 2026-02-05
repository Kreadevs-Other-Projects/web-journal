CREATE TABLE IF NOT EXISTS editor_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  sub_editor_id UUID NOT NULL REFERENCES users(id),
  status editor_assignment_status NOT NULL DEFAULT 'pending',
  assigned_by UUID NOT NULL REFERENCES users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  declined_reason TEXT,
  UNIQUE (paper_id)
);

CREATE TABLE IF NOT EXISTS review_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id),
  assigned_by UUID NOT NULL REFERENCES users(id),
  status review_assignment_status NOT NULL DEFAULT 'assigned',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  UNIQUE (paper_id, reviewer_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_assignment_id UUID UNIQUE NOT NULL REFERENCES review_assignments(id) ON DELETE CASCADE,
  decision review_decision NOT NULL,
  comments TEXT,
  signature_url TEXT,
  signed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS editor_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  paper_id UUID NOT NULL
    REFERENCES papers(id)
    ON DELETE CASCADE,

  decided_by UUID NOT NULL
    REFERENCES users(id),

  decision chief_editor_decision NOT NULL,
  decision_note TEXT,

  decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (paper_id)
);

