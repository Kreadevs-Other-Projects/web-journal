DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM (
      'super_admin',
      'chief_editor',
      'sub_editor',
      'reviewer',
      'author',
      'publisher'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    CREATE TYPE user_status AS ENUM ('pending', 'active', 'rejected', 'banned');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'paper_status') THEN
    CREATE TYPE paper_status AS ENUM (
      'submitted',
      'assigned_to_editor',
      'under_review',
      'pending_revision',
      'resubmitted',
      'accepted',
      'published'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_decision') THEN
    CREATE TYPE review_decision AS ENUM ('accept', 'reject', 'minor_revision', 'major_revision');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_assignment_status') THEN
    CREATE TYPE review_assignment_status AS ENUM ('assigned', 'submitted', 'accepted', 'rejected', 'expired');
  END IF;
END $$;
