-- Remove journal_manager role from users whose primary role is publisher.
-- Publishers manage journals via their publisher role; the journal_manager
-- role should only belong to dedicated journal manager accounts.
DELETE FROM user_roles
WHERE role = 'journal_manager'
AND user_id IN (
  SELECT id FROM users WHERE role = 'publisher'
);
