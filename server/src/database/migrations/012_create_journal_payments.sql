CREATE TABLE IF NOT EXISTS journal_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id),
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'PKR',
  status TEXT CHECK (status IN ('pending', 'success', 'failed')),
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
