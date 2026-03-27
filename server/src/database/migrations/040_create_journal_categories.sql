CREATE TABLE IF NOT EXISTS journal_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO journal_categories (name, slug) VALUES
  ('Medical Sciences', 'medical-sciences'),
  ('Engineering & Technology', 'engineering-technology'),
  ('Natural Sciences', 'natural-sciences'),
  ('Social Sciences', 'social-sciences'),
  ('Arts & Humanities', 'arts-humanities'),
  ('Business & Economics', 'business-economics'),
  ('Law & Political Science', 'law-political-science'),
  ('Education', 'education'),
  ('Environmental Sciences', 'environmental-sciences'),
  ('Agriculture & Food Sciences', 'agriculture-food')
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE journals ADD COLUMN IF NOT EXISTS journal_category_id UUID REFERENCES journal_categories(id) ON DELETE SET NULL;
