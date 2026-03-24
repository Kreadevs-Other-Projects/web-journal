-- Migration: add policies_accepted columns to papers table
ALTER TABLE papers
  ADD COLUMN IF NOT EXISTS policies_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS policies_accepted_at TIMESTAMPTZ;
