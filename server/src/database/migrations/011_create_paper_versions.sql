CREATE TABLE IF NOT EXISTS paper_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id UUID NOT NULL,
    version INT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_papers
        FOREIGN KEY (paper_id)
        REFERENCES papers(id)
        ON DELETE CASCADE
);