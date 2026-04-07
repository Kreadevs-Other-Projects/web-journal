-- Add profile_completed tracking to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMPTZ;

-- Existing users are considered complete so they are not affected
UPDATE users SET profile_completed = TRUE WHERE created_at < NOW();
