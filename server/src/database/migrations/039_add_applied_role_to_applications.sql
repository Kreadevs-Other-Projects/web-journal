ALTER TABLE reviewer_applications
  ADD COLUMN IF NOT EXISTS applied_role TEXT NOT NULL DEFAULT 'reviewer'
    CHECK (applied_role IN ('reviewer', 'associate_editor'));
