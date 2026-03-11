-- Migration 016: Add publisher journal fields to journals table
ALTER TABLE journals
  ADD COLUMN IF NOT EXISTS doi TEXT,
  ADD COLUMN IF NOT EXISTS publisher_name TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS peer_review_policy TEXT,
  ADD COLUMN IF NOT EXISTS oa_policy TEXT,
  ADD COLUMN IF NOT EXISTS author_guidelines TEXT,
  ADD COLUMN IF NOT EXISTS publication_fee NUMERIC,
  ADD COLUMN IF NOT EXISTS currency TEXT;
