ALTER TABLE publications
  ADD COLUMN IF NOT EXISTS crossref_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS crossref_batch_id TEXT;
