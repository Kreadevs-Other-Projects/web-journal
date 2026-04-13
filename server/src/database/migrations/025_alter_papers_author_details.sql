ALTER TABLE papers
  ADD COLUMN IF NOT EXISTS author_details JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS corresponding_author_details JSONB DEFAULT '[]';
