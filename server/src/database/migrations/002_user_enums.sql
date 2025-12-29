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
END
$$;