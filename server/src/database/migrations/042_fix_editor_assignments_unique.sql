-- Drop the old blanket unique constraint (only one row per paper, period)
ALTER TABLE editor_assignments DROP CONSTRAINT IF EXISTS editor_assignments_paper_id_key;

-- Add a partial unique index: only one ACTIVE assignment per paper
-- Rows with status 'reassigned' or 'rejected' are excluded, allowing history rows to coexist
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_editor_assignment
  ON editor_assignments (paper_id)
  WHERE status NOT IN ('reassigned', 'rejected');
