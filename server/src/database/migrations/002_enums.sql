DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM (
            'user',
            'admin',
            'chief-editor',
            'sub-editor',
            'reviewer',
            'publisher'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM (
            'online',
            'offline',
            'banned'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignment_status') THEN
        CREATE TYPE assignment_status AS ENUM (
            'pending',
            'in-review',
            'completed'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_assignments_status') THEN
        CREATE TYPE review_assignments_status AS ENUM (
            'assigned',
            'in_review',
            'submitted',
            'needs_revision',
            'accepted',
            'rejected',
            'expired'
        );
    END IF;
END
$$;