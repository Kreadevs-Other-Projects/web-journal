CREATE TABLE IF NOT EXISTS journal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    status journal_status NOT NULL DEFAULT 'offline',
    conference_year int,
    description TEXT NOT NULL
);