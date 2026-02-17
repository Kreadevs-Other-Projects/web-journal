DO $$ BEGIN

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM (
      'owner',
      'publisher',
      'publisher_manager',
      'chief_editor',
      'sub_editor',
      'reviewer',
      'author'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    CREATE TYPE user_status AS ENUM (
      'pending',
      'active',
      'rejected',
      'banned'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'journal_status') THEN
    CREATE TYPE journal_status AS ENUM (
      'pending_payment',
      'draft',
      'active',
      'suspended',
      'archived'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'paper_status') THEN
    CREATE TYPE paper_status AS ENUM (
      'awaiting_payment',
      'submitted',
      'assigned_to_sub_editor',
      'under_review',
      'pending_revision',
      'resubmitted',
      'accepted',
      'ready_for_publication',
      'rejected',
      'published'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_decision') THEN
    CREATE TYPE review_decision AS ENUM (
      'accepted',
      'minor_revision',
      'major_revision',
      'rejected'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'editor_assignment_status') THEN
    CREATE TYPE editor_assignment_status AS ENUM (
      'pending',
      'accepted',
      'rejected',
      'completed',
      'reassigned'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_assignment_status') THEN
    CREATE TYPE review_assignment_status AS ENUM (
      'assigned',
      'submitted',
      'accepted',
      'rejected',
      'expired',
      'reassigned'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chief_editor_decision') THEN
    CREATE TYPE chief_editor_decision AS ENUM (
      'accepted',
      'rejected',
      'revision'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'issue_status') THEN
    CREATE TYPE issue_status AS ENUM (
      'draft',
      'open',
      'closed',
      'published'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'journal_payment_type') THEN
    CREATE TYPE journal_payment_type AS ENUM (
      'first_time',
      'issue',
      'renewal'
    );
  END IF;

END $$;
