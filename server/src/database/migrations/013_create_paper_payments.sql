CREATE TABLE IF NOT EXISTS paper_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id UUID UNIQUE NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  pages INTEGER NOT NULL,
  price_per_page NUMERIC(10,2) NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  transaction_ref TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
