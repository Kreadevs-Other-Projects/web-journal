CREATE TABLE IF NOT EXISTS reviewer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    qualifications TEXT[] NOT NULL,
    certification TEXT NOT NULL,
    review_count INTEGER NOT NULL DEFAULT 0,
    acceptance_rate NUMERIC(5,2) NOT NULL DEFAULT 0.0,

    CONSTRAINT reviewer_profiles_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
