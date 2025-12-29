CREATE TABLE IF NOT EXISTS editor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type TEXT NOT NULL,
    expertise TEXT[] NOT NULL,
    approved_by UUID NOT NULL,
    approved_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT editor_profiles_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT editor_profiles_approved_by_fkey
        FOREIGN KEY (approved_by)
        REFERENCES users(id)
        ON DELETE CASCADE
);
