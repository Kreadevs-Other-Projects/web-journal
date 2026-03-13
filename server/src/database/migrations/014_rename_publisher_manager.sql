
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'user_role'
      AND e.enumlabel = 'publisher_manager'
  ) THEN
    ALTER TYPE user_role RENAME VALUE 'publisher_manager' TO 'journal_manager';
  END IF;
END $$;