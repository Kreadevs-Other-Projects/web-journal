-- =========================
-- 0) EXTENSIONS
-- =========================
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- =========================
-- 1) ENUMS
-- =========================
DO $$ BEGIN

  -- Updated user_role enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM (
      -- Publisher-Level Roles
      'publisher_admin',     -- Create journals, manage ISSN, DOI, indexing, global settings
      'technical_admin',     -- System maintenance, backups, integrations
      'finance_admin',       -- APC tracking, invoices (Phase 2)

      -- Journal-Level Roles
      'editor_in_chief',     -- Full control of journal workflow & decisions
      'associate_editor',    -- Assign reviewers, manage decisions
      'section_editor',      -- Handle subject-specific manuscripts
      'journal_manager',     -- Content, issues, editorial pages
      'reviewer',            -- Review assigned manuscripts
      'author'               -- Submit manuscripts, revisions
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    CREATE TYPE user_status AS ENUM ('pending', 'active', 'rejected', 'banned');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'paper_status') THEN
    CREATE TYPE paper_status AS ENUM (
      'draft',
      'submitted',
      'assigned_to_editor',
      'under_review',
      'pending_revision',
      'resubmitted',
      'accepted',
      'metadata_validation',
      'copyediting',
      'proofing',
      'final_approval',
      'doi_registered',
      'published',
      'indexed',
      'rejected'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_decision') THEN
    CREATE TYPE review_decision AS ENUM ('accept', 'reject', 'minor_revision', 'major_revision');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_assignment_status') THEN
    CREATE TYPE review_assignment_status AS ENUM ('invited', 'assigned', 'accepted', 'rejected', 'submitted', 'expired');
  END IF;

END $$;


-- =========================
-- 2) USERS
-- =========================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  username TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,

  status user_status NOT NULL DEFAULT 'active',

  profile_pic TEXT,

  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);


-- =========================
-- 3) USER PROFILES
-- =========================
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  qualifications TEXT,
  expertise TEXT[],
  certifications TEXT,

  affiliation TEXT,
  country TEXT,

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS gin_user_profiles_expertise ON user_profiles USING GIN (expertise);


-- =========================
-- 4) REFRESH TOKENS
-- =========================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,

  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);


-- =========================
-- 5) OTP
-- =========================
CREATE TABLE IF NOT EXISTS otp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  email TEXT NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  purpose TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expiry_at TIMESTAMPTZ NOT NULL,

  CONSTRAINT chk_otp_expiry CHECK (expiry_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_otp_email ON otp(email);
CREATE INDEX IF NOT EXISTS idx_otp_expiry ON otp(expiry_at);


-- =========================
-- 6) PUBLISHERS
-- =========================
CREATE TABLE IF NOT EXISTS publishers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,

  logo_url TEXT,
  website_url TEXT,

  contact_email TEXT,
  about TEXT,
  ethics_policies_url TEXT,

  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);


-- =========================
-- 7) PUBLISHER MEMBERS  ← NEW
-- Publisher-level roles (publisher_admin, technical_admin, finance_admin)
-- These roles are scoped to a publisher, not a specific journal
-- =========================
CREATE TABLE IF NOT EXISTS publisher_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  publisher_id UUID NOT NULL REFERENCES publishers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  role user_role NOT NULL,

  -- Enforce only publisher-level roles can be assigned here
  CONSTRAINT chk_publisher_role CHECK (
    role IN ('publisher_admin', 'technical_admin', 'finance_admin')
  ),

  added_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (publisher_id, user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_publisher_members_publisher ON publisher_members(publisher_id);
CREATE INDEX IF NOT EXISTS idx_publisher_members_user ON publisher_members(user_id);


-- =========================
-- 8) JOURNALS
-- =========================
CREATE TABLE IF NOT EXISTS journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  publisher_id UUID NOT NULL REFERENCES publishers(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,

  issn TEXT,
  website_url TEXT,

  logo_url TEXT,
  banner_url TEXT,

  aims_scope TEXT,

  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_journals_publisher ON journals(publisher_id);
CREATE INDEX IF NOT EXISTS idx_journals_active ON journals(is_active);


-- =========================
-- 9) JOURNAL STATIC PAGES
-- =========================
CREATE TABLE IF NOT EXISTS journal_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,

  page_key TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,

  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (journal_id, page_key)
);


-- =========================
-- 10) JOURNAL MEMBERS
-- Journal-level roles scoped to a specific journal
-- One user can hold multiple roles across multiple journals
-- =========================
CREATE TABLE IF NOT EXISTS journal_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  role user_role NOT NULL,

  -- Enforce only journal-level roles can be assigned here
  CONSTRAINT chk_journal_role CHECK (
    role IN (
      'editor_in_chief',
      'associate_editor',
      'section_editor',
      'journal_manager',
      'reviewer',
      'author'
    )
  ),

  added_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (journal_id, user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_journal_members_journal ON journal_members(journal_id);
CREATE INDEX IF NOT EXISTS idx_journal_members_user ON journal_members(user_id);


-- =========================
-- 11) JOURNAL ISSUES
-- =========================
CREATE TABLE IF NOT EXISTS journal_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,

  year INT NOT NULL,
  volume INT,
  issue INT,

  label TEXT NOT NULL,
  published_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,

  UNIQUE (journal_id, label)
);

CREATE INDEX IF NOT EXISTS idx_journal_issues_journal ON journal_issues(journal_id);
CREATE INDEX IF NOT EXISTS idx_journal_issues_year ON journal_issues(journal_id, year);


-- =========================
-- 12) ARTICLE TYPES
-- =========================
CREATE TABLE IF NOT EXISTS article_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  UNIQUE (journal_id, name)
);


-- =========================
-- 13) LICENSES
-- =========================
CREATE TABLE IF NOT EXISTS licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL UNIQUE,
  url TEXT,
  description TEXT,

  is_active BOOLEAN NOT NULL DEFAULT TRUE
);


-- =========================
-- 14) PAPERS
-- =========================
CREATE TABLE IF NOT EXISTS papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  article_type_id UUID REFERENCES article_types(id),

  title TEXT NOT NULL,
  abstract TEXT,
  keywords TEXT[],

  category TEXT,

  submitted_by UUID NOT NULL REFERENCES users(id),

  license_id UUID REFERENCES licenses(id),

  status paper_status NOT NULL DEFAULT 'draft',

  current_version_id UUID,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_papers_journal_status ON papers(journal_id, status);
CREATE INDEX IF NOT EXISTS gin_papers_keywords ON papers USING GIN (keywords);


-- =========================
-- 15) PAPER VERSIONS
-- =========================
CREATE TABLE IF NOT EXISTS paper_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,

  version_label TEXT NOT NULL,
  manuscript_file_url TEXT NOT NULL,
  cover_letter_url TEXT,

  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(paper_id, version_label)
);

ALTER TABLE papers
  ADD CONSTRAINT fk_papers_current_version
  FOREIGN KEY (current_version_id) REFERENCES paper_versions(id);

CREATE INDEX IF NOT EXISTS idx_paper_versions_paper ON paper_versions(paper_id);


-- =========================
-- 16) AFFILIATIONS + PAPER AUTHORS
-- =========================
CREATE TABLE IF NOT EXISTS affiliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  department TEXT,
  city TEXT,
  country TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paper_authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,

  user_id UUID REFERENCES users(id),

  full_name TEXT NOT NULL,
  email TEXT,
  is_corresponding BOOLEAN NOT NULL DEFAULT FALSE,

  affiliation_id UUID REFERENCES affiliations(id),

  author_order INT NOT NULL,

  UNIQUE (paper_id, author_order)
);

CREATE INDEX IF NOT EXISTS idx_paper_authors_paper ON paper_authors(paper_id);


-- =========================
-- 17) EDITOR ASSIGNMENT
-- =========================
CREATE TABLE IF NOT EXISTS editor_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  sub_editor_id UUID NOT NULL REFERENCES users(id),
  assigned_by UUID NOT NULL REFERENCES users(id),

  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(paper_id)
);


-- =========================
-- 18) REVIEW ASSIGNMENTS
-- =========================
CREATE TABLE IF NOT EXISTS review_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id),

  assigned_by UUID NOT NULL REFERENCES users(id),

  status review_assignment_status NOT NULL DEFAULT 'invited',

  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,

  submitted_at TIMESTAMPTZ,

  UNIQUE (paper_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_review_assignments_paper ON review_assignments(paper_id);
CREATE INDEX IF NOT EXISTS idx_review_assignments_reviewer ON review_assignments(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_review_assignments_due ON review_assignments(due_at);


-- =========================
-- 19) REVIEWS
-- =========================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  review_assignment_id UUID UNIQUE NOT NULL REFERENCES review_assignments(id) ON DELETE CASCADE,

  decision review_decision NOT NULL,

  confidential_comments_to_editor TEXT,
  comments_to_author TEXT,

  attachment_url TEXT,

  signature_url TEXT,
  signed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =========================
-- 20) EDITORIAL DECISIONS
-- =========================
CREATE TABLE IF NOT EXISTS editorial_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,

  decided_by UUID NOT NULL REFERENCES users(id),
  decision review_decision NOT NULL,

  letter_subject TEXT,
  letter_body TEXT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT editorial_decisions_paper_idx CHECK (char_length(letter_body) > 0)
);

CREATE INDEX IF NOT EXISTS idx_editorial_decisions_paper ON editorial_decisions(paper_id);


-- =========================
-- 21) PRODUCTION METADATA CHECKS
-- =========================
CREATE TABLE IF NOT EXISTS production_metadata_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  paper_id UUID NOT NULL UNIQUE REFERENCES papers(id) ON DELETE CASCADE,

  title_ok BOOLEAN NOT NULL DEFAULT FALSE,
  abstract_ok BOOLEAN NOT NULL DEFAULT FALSE,
  authors_ok BOOLEAN NOT NULL DEFAULT FALSE,
  affiliations_ok BOOLEAN NOT NULL DEFAULT FALSE,
  keywords_ok BOOLEAN NOT NULL DEFAULT FALSE,
  license_ok BOOLEAN NOT NULL DEFAULT FALSE,

  last_checked_by UUID REFERENCES users(id),
  last_checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =========================
-- 22) PROOFING ROUNDS
-- =========================
CREATE TABLE IF NOT EXISTS proofing_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,

  proof_pdf_url TEXT NOT NULL,
  author_approved BOOLEAN NOT NULL DEFAULT FALSE,
  author_corrections TEXT,

  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proofing_rounds_paper ON proofing_rounds(paper_id);


-- =========================
-- 23) PUBLICATIONS
-- =========================
CREATE TABLE IF NOT EXISTS publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  paper_id UUID UNIQUE NOT NULL REFERENCES papers(id) ON DELETE CASCADE,

  issue_id UUID REFERENCES journal_issues(id),

  doi TEXT UNIQUE,
  doi_url TEXT,
  pdf_url TEXT NOT NULL,

  citation_text TEXT,

  published_by UUID REFERENCES users(id),
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  year_label TEXT DEFAULT 'Conference 2026'
);

CREATE INDEX IF NOT EXISTS idx_publications_issue ON publications(issue_id);
CREATE INDEX IF NOT EXISTS idx_publications_published_at ON publications(published_at);


-- =========================
-- 24) REVIEWER CERTIFICATES
-- =========================
CREATE TABLE IF NOT EXISTS reviewer_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  review_assignment_id UUID UNIQUE NOT NULL REFERENCES review_assignments(id) ON DELETE CASCADE,

  certificate_url TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =========================
-- 25) PAPER SEARCH INDEX
-- =========================
CREATE TABLE IF NOT EXISTS paper_search_index (
  paper_id UUID PRIMARY KEY REFERENCES papers(id) ON DELETE CASCADE,
  document_tsv tsvector NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS gin_paper_search_index ON paper_search_index USING GIN (document_tsv);