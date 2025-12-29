CREATE TABLE IF NOT EXISTS review_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id UUID NOT NULL,
    version_id UUID NOT NULL,
    status review_assignments_status NOT NULL DEFAULT 'assigned',
    due_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT paper_id_fkey
        FOREIGN KEY (paper_id)
        REFERENCES research_papers(id)
        ON DELETE CASCADE,

    CONSTRAINT version_id
        FOREIGN KEY (version_id)
        REFERENCES paper_versions(id)
        ON DELETE CASCADE
)