ALTER TABLE papers
  ADD COLUMN IF NOT EXISTS article_type TEXT,
  ADD COLUMN IF NOT EXISTS conflict_of_interest TEXT,
  ADD COLUMN IF NOT EXISTS funding_info TEXT,
  ADD COLUMN IF NOT EXISTS data_availability TEXT,
  ADD COLUMN IF NOT EXISTS ethical_approval TEXT,
  ADD COLUMN IF NOT EXISTS author_contributions TEXT;
