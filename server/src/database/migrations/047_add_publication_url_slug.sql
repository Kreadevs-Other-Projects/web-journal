-- Add sequential paper index within each issue
ALTER TABLE publications ADD COLUMN IF NOT EXISTS paper_index INT;

-- Add pre-computed URL slug for clean public URLs (unique constraint added after data population)
ALTER TABLE publications ADD COLUMN IF NOT EXISTS url_slug TEXT;

-- Populate paper_index for existing publications (sequential per issue, ordered by publish date)
UPDATE publications
SET paper_index = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY issue_id ORDER BY published_at ASC) AS rn
  FROM publications
  WHERE issue_id IS NOT NULL
) sub
WHERE publications.id = sub.id;

-- Populate url_slug for existing publications
-- Format: {doi-prefix-dots-as-hyphens}-{acronym}-{year}-{article_index}-{paper_index}
-- Uses journal_issues.article_index as issue_index (already populated sequentially per journal)
UPDATE publications
SET url_slug =
  REPLACE(
    COALESCE(NULLIF(SPLIT_PART(COALESCE(publications.doi, ''), '/', 1), ''), '10-00000'),
    '.', '-'
  ) || '-' ||
  LOWER(REGEXP_REPLACE(j.acronym, '[^a-zA-Z0-9]', '', 'g')) || '-' ||
  EXTRACT(YEAR FROM publications.published_at)::TEXT || '-' ||
  ji.article_index::TEXT || '-' ||
  publications.paper_index::TEXT
FROM papers p
JOIN journals j ON j.id = p.journal_id
JOIN journal_issues ji ON ji.id = publications.issue_id
WHERE publications.paper_id = p.id
  AND publications.paper_index IS NOT NULL
  AND ji.article_index IS NOT NULL;

-- Add unique constraint after data is populated
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_publications_url_slug'
  ) THEN
    ALTER TABLE publications ADD CONSTRAINT uq_publications_url_slug UNIQUE (url_slug);
  END IF;
END $$;
