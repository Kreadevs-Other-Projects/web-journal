-- Unique partial indexes: only enforce uniqueness when value is not null/empty
CREATE UNIQUE INDEX IF NOT EXISTS journals_issn_unique ON journals (issn) WHERE issn IS NOT NULL AND issn <> '';
CREATE UNIQUE INDEX IF NOT EXISTS journals_doi_unique ON journals (doi) WHERE doi IS NOT NULL AND doi <> '';
