CREATE TABLE IF NOT EXISTS paper_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default categories
INSERT INTO paper_categories (name, slug) VALUES
  ('Physics', 'physics'),
  ('Computer Science', 'computer-science'),
  ('Mathematics', 'mathematics'),
  ('Biology', 'biology'),
  ('Chemistry', 'chemistry'),
  ('Engineering', 'engineering'),
  ('Medicine', 'medicine'),
  ('Social Sciences', 'social-sciences'),
  ('Arts & Humanities', 'arts-humanities'),
  ('Business & Economics', 'business-economics'),
  ('Environmental Science', 'environmental-science')
ON CONFLICT (slug) DO NOTHING;

-- Add category_id to papers (optional FK, nullable)
ALTER TABLE papers ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES paper_categories(id);
