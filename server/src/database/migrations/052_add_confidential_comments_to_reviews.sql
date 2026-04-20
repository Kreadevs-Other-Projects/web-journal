ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS confidential_comments TEXT;
