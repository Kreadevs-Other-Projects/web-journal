-- Migration 022: Add other_journal_submission field to papers
ALTER TABLE papers
  ADD COLUMN IF NOT EXISTS other_journal_submission TEXT DEFAULT 'no'
    CHECK (other_journal_submission IN ('no', 'under_review_elsewhere', 'previously_submitted'));
