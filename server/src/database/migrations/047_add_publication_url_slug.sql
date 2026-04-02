-- Add sequential paper index within each issue
ALTER TABLE publications ADD COLUMN IF NOT EXISTS paper_index INT;

-- Add pre-computed URL slug for clean public URLs
ALTER TABLE publications ADD COLUMN IF NOT EXISTS url_slug TEXT UNIQUE;

-- Populate paper_index for existing publications (sequential per issue, ordered by publish date)
UPDATE publications pub
SET paper_index = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY issue_id ORDER BY published_at ASC) AS rn
  FROM publications
  WHERE issue_id IS NOT NULL
) sub
WHERE pub.id = sub.id;

-- Populate url_slug for existing publications
-- Format: {doi-prefix-dots-as-hyphens}-{acronym}-{year}-{issue_index}-{paper_index}
-- Uses journal_issues.article_index as issue_index (already populated sequentially per journal)
UPDATE publications pub
SET url_slug =
  REPLACE(COALESCE(SPLIT_PART(pub.doi, '/', 1), '10-00000'), '.', '-') || '-' ||
  LOWER(REGEXP_REPLACE(j.acronym, '[^a-zA-Z0-9]', '', 'g')) || '-' ||
  EXTRACT(YEAR FROM pub.published_at)::TEXT || '-' ||
  ji.article_index::TEXT || '-' ||
  pub.paper_index::TEXT
FROM papers p
JOIN journals j ON j.id = p.journal_id
JOIN journal_issues ji ON ji.id = pub.issue_id
WHERE pub.paper_id = p.id
  AND pub.paper_index IS NOT NULL
  AND ji.article_index IS NOT NULL;
