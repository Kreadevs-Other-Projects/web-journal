-- Add missing paper_status enum values for the full review workflow
ALTER TYPE paper_status ADD VALUE IF NOT EXISTS 'reviewed';
ALTER TYPE paper_status ADD VALUE IF NOT EXISTS 'sub_editor_approved';
