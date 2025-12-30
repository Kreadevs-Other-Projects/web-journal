CREATE TABLE IF NOT EXISTS editor_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id UUID NOT NULL,
    editor_id UUID NOT NULL,
    assigned_by UUID NOT NULL,
    status assignment_status NOT NULL DEFAULT 'pending',
    assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT paper_id_fkey
        FOREIGN KEY (paper_id)
        REFERENCES papers(id)
        ON DELETE CASCADE,

    CONSTRAINT editor_id_fkey
        FOREIGN KEY (editor_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT assigned_by_fkey
        FOREIGN KEY (assigned_by)
        REFERENCES users(id)
        ON DELETE CASCADE
);