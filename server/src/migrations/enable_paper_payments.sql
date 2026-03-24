-- Enable paper payment flow
-- Run: psql $DATABASE_URL -f src/migrations/enable_paper_payments.sql

ALTER TABLE paper_payments
  ADD COLUMN IF NOT EXISTS invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS receipt_url TEXT,
  ADD COLUMN IF NOT EXISTS receipt_uploaded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TYPE paper_status ADD VALUE IF NOT EXISTS 'awaiting_payment';
ALTER TYPE paper_status ADD VALUE IF NOT EXISTS 'payment_review';
