-- Track whether a takedown was triggered manually, by an issue takedown, or by a journal takedown.
-- This lets restore operations only cascade back to items that were taken down as part of the same action.
ALTER TABLE journal_issues
  ADD COLUMN IF NOT EXISTS takedown_source TEXT CHECK (takedown_source IN ('manual', 'journal'));

ALTER TABLE papers
  ADD COLUMN IF NOT EXISTS takedown_source TEXT CHECK (takedown_source IN ('manual', 'issue', 'journal'));
