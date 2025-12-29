CREATE TABLE IF NOT EXISTS papers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_id UUID NOT NULL,
    author_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    version_id INT,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    status paper_status NOT NULL DEFAULT 'draft',

    CONSTRAINT fk_research_journal
        FOREIGN KEY (journal_id)
        REFERENCES journal(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_research_author
        FOREIGN KEY (author_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);