DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM (
            'author',
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

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'journal_status') THEN
        CREATE TYPE journal_status AS ENUM (
            'offline',
            'online'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM (
            'pending',
            'success',
            'failed'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'paper_status') THEN
        CREATE TYPE paper_status AS ENUM (
            'draft',
            'submitted',
            'approved',
            'rejected'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_decision') THEN
        CREATE TYPE review_decision AS ENUM (
            'pending',
            'accepted',
            'rejected',
            'major-revision',
            'minor-revision'
        );
    END IF;


    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approve') THEN
        CREATE TYPE approve AS ENUM (
            'pending',
            'accepted',
            'rejected'
        );
    END IF;

END
$$;