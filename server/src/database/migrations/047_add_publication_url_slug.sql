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
SET url_slug = sub.new_slug
FROM (
  SELECT
    pub.id,
    LOWER(REGEXP_REPLACE(j.acronym, '[^a-zA-Z0-9]', '', 'g')) || '-' ||
    REPLACE(
      COALESCE(NULLIF(SPLIT_PART(COALESCE(pub.doi, ''), '/', 1), ''), '10-00000'),
      '.', '-'
    ) || '-' ||
    EXTRACT(YEAR FROM pub.published_at)::TEXT || '-' ||
    ji.article_index::TEXT || '-' ||
    pub.paper_index::TEXT AS new_slug
  FROM publications pub
  JOIN papers p ON p.id = pub.paper_id
  JOIN journals j ON j.id = p.journal_id
  JOIN journal_issues ji ON ji.id = pub.issue_id
  WHERE ji.article_index IS NOT NULL
    AND pub.paper_index IS NOT NULL
) sub
WHERE publications.id = sub.id;

-- Add unique constraint after data is populated
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_publications_url_slug'
  ) THEN
    ALTER TABLE publications ADD CONSTRAINT uq_publications_url_slug UNIQUE (url_slug);
  END IF;
END $$;
