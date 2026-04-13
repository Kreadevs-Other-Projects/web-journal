-- Migration 036: Make label/volume/issue_no optional on issue_requests (auto-calculated now)
ALTER TABLE issue_requests
  ALTER COLUMN label DROP NOT NULL,
  ALTER COLUMN volume DROP NOT NULL,
  ALTER COLUMN issue_no DROP NOT NULL;
