-- =========================
-- 0) EXTENSIONS
-- =========================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Optional but recommended (case-insensitive email uniqueness):
-- CREATE EXTENSION IF NOT EXISTS citext;


-- =========================
-- 1) ENUMS (Roles + Workflow)
-- =========================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM (
      'admin',
      'chief_editor',
      'sub_editor',
      'reviewer',
      'author',
      'owner',
      'publisher'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    CREATE TYPE user_status AS ENUM ('pending', 'active', 'rejected', 'banned');
  END IF;

  -- Updated to match TRD “System States Overview”
  -- Draft → Submitted → Under Review → Revision → Accepted → Metadata Validation → Copyediting
  -- → Proofing → Final Approval → DOI Registered → Published → Indexed :contentReference[oaicite:5]{index=5}
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
-- 2) USERS (Single login across all journals) :contentReference[oaicite:6]{index=6}
-- =========================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  username TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE, -- if using citext, set email CITEXT UNIQUE
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
-- 3) USER PROFILES (expertise database for reviewer search) :contentReference[oaicite:7]{index=7}
-- =========================
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  qualifications TEXT,
  expertise TEXT[],          -- used in reviewer search
  certifications TEXT,

  affiliation TEXT,
  country TEXT,

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS gin_user_profiles_expertise ON user_profiles USING GIN (expertise);


-- =========================
-- 4) REFRESH TOKENS (Auth)
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
-- 5) OTP (Registration / Forgot / Verify email)
-- =========================
CREATE TABLE IF NOT EXISTS otp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  email TEXT NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  purpose TEXT NOT NULL,           -- e.g. 'verify_email', 'reset_password'
  verified BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expiry_at TIMESTAMPTZ NOT NULL,

  CONSTRAINT chk_otp_expiry CHECK (expiry_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_otp_email ON otp(email);
CREATE INDEX IF NOT EXISTS idx_otp_expiry ON otp(expiry_at);


-- =========================
-- 6) PUBLISHERS (Publisher-level website) :contentReference[oaicite:8]{index=8}
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
-- 7) JOURNALS (Hosted under publisher) :contentReference[oaicite:9]{index=9}
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

  aims_scope TEXT,                -- shown on journal home page :contentReference[oaicite:10]{index=10}

  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_journals_publisher ON journals(publisher_id);
CREATE INDEX IF NOT EXISTS idx_journals_active ON journals(is_active);


-- =========================
-- 8) JOURNAL STATIC PAGES (About / Aims & Scope / Editorial Board / Guidelines) :contentReference[oaicite:11]{index=11}
-- =========================
CREATE TABLE IF NOT EXISTS journal_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,

  page_key TEXT NOT NULL,       -- e.g. 'about', 'aims_scope', 'editorial_board', 'author_guidelines'
  title TEXT NOT NULL,
  content TEXT NOT NULL,        -- HTML/Markdown
  is_published BOOLEAN NOT NULL DEFAULT TRUE,

  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (journal_id, page_key)
);


-- =========================
-- 9) JOURNAL MEMBERS (Role within each journal)
-- Note: one user can be author+reviewer+editor across journals. :contentReference[oaicite:12]{index=12}
-- =========================
CREATE TABLE IF NOT EXISTS journal_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  role user_role NOT NULL,
  added_by UUID REFERENCES users(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (journal_id, user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_journal_members_journal ON journal_members(journal_id);
CREATE INDEX IF NOT EXISTS idx_journal_members_user ON journal_members(user_id);


-- =========================
-- 10) JOURNAL ISSUES (Archive/Issues) :contentReference[oaicite:13]{index=13}
-- =========================
CREATE TABLE IF NOT EXISTS journal_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,

  year INT NOT NULL,
  volume INT,
  issue INT,

  label TEXT NOT NULL,        -- e.g. "Vol 2 Issue 1 (2026)"
  published_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,

  UNIQUE (journal_id, label)
);

CREATE INDEX IF NOT EXISTS idx_journal_issues_journal ON journal_issues(journal_id);
CREATE INDEX IF NOT EXISTS idx_journal_issues_year ON journal_issues(journal_id, year);


-- =========================
-- 11) ARTICLE TYPES (TRD: “Select Article Type”) :contentReference[oaicite:14]{index=14}
-- =========================
CREATE TABLE IF NOT EXISTS article_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,

  name TEXT NOT NULL,          -- e.g. Research Article, Review, Case Study
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  UNIQUE (journal_id, name)
);


-- =========================
-- 12) LICENSES (TRD: “Select license”) :contentReference[oaicite:15]{index=15}
-- =========================
CREATE TABLE IF NOT EXISTS licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL UNIQUE,     -- e.g. CC BY 4.0
  url TEXT,
  description TEXT,

  is_active BOOLEAN NOT NULL DEFAULT TRUE
);


-- =========================
-- 13) PAPERS (Core manuscript entity)
-- =========================
CREATE TABLE IF NOT EXISTS papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  article_type_id UUID REFERENCES article_types(id),

  title TEXT NOT NULL,
  abstract TEXT,
  keywords TEXT[],

  category TEXT, -- optional free-text category, but prefer controlled vocab if needed

  submitted_by UUID NOT NULL REFERENCES users(id), -- the account that submitted (corresponding author)

  license_id UUID REFERENCES licenses(id),

  status paper_status NOT NULL DEFAULT 'draft',

  current_version_id UUID, -- FK added after paper_versions is created

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_papers_journal_status ON papers(journal_id, status);
CREATE INDEX IF NOT EXISTS gin_papers_keywords ON papers USING GIN (keywords);


-- =========================
-- 14) PAPER VERSIONS (DOCX uploads + revisions)
-- =========================
CREATE TABLE IF NOT EXISTS paper_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,

  version_label TEXT NOT NULL,     -- e.g. v1, v2, r1
  manuscript_file_url TEXT NOT NULL,
  cover_letter_url TEXT,           -- TRD mentions cover letter option :contentReference[oaicite:16]{index=16}

  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(paper_id, version_label)
);

ALTER TABLE papers
  ADD CONSTRAINT fk_papers_current_version
  FOREIGN KEY (current_version_id) REFERENCES paper_versions(id);

CREATE INDEX IF NOT EXISTS idx_paper_versions_paper ON paper_versions(paper_id);


-- =========================
-- 15) AUTHORS + AFFILIATIONS (Published article page requires affiliations) :contentReference[oaicite:17]{index=17}
-- =========================
CREATE TABLE IF NOT EXISTS affiliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,             -- e.g. "GIKI, Topi"
  department TEXT,
  city TEXT,
  country TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paper_authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,

  -- If an author is a registered user, link it:
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
-- 16) EDITOR ASSIGNMENT (One active sub-editor assignment per paper)
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
-- 17) REVIEW ASSIGNMENTS (TRD: invite reviewer + set deadline + track response) :contentReference[oaicite:18]{index=18}
-- =========================
CREATE TABLE IF NOT EXISTS review_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id),

  assigned_by UUID NOT NULL REFERENCES users(id),

  status review_assignment_status NOT NULL DEFAULT 'invited',

  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,               -- deadline countdown :contentReference[oaicite:19]{index=19}

  submitted_at TIMESTAMPTZ,

  UNIQUE (paper_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_review_assignments_paper ON review_assignments(paper_id);
CREATE INDEX IF NOT EXISTS idx_review_assignments_reviewer ON review_assignments(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_review_assignments_due ON review_assignments(due_at);


-- =========================
-- 18) REVIEWS (TRD: recommendation + confidential comments + comments to author + upload) :contentReference[oaicite:20]{index=20}
-- =========================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  review_assignment_id UUID UNIQUE NOT NULL REFERENCES review_assignments(id) ON DELETE CASCADE,

  decision review_decision NOT NULL,

  confidential_comments_to_editor TEXT, -- TRD required :contentReference[oaicite:21]{index=21}
  comments_to_author TEXT,              -- TRD required :contentReference[oaicite:22]{index=22}

  attachment_url TEXT,                  -- optional review file upload :contentReference[oaicite:23]{index=23}

  signature_url TEXT,
  signed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =========================
-- 19) DECISIONS / DECISION LETTERS (TRD: “Send decision letter”) :contentReference[oaicite:24]{index=24}
-- =========================
CREATE TABLE IF NOT EXISTS editorial_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,

  decided_by UUID NOT NULL REFERENCES users(id),  -- usually chief editor
  decision review_decision NOT NULL,              -- accept/reject/minor/major

  letter_subject TEXT,
  letter_body TEXT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- allow multiple decisions across lifecycle (major revision, then accept, etc.)
  -- So no UNIQUE(paper_id)
  CONSTRAINT editorial_decisions_paper_idx CHECK (char_length(letter_body) > 0)
);

CREATE INDEX IF NOT EXISTS idx_editorial_decisions_paper ON editorial_decisions(paper_id);


-- =========================
-- 20) PRODUCTION CHECKLIST (metadata validation must block progression) :contentReference[oaicite:25]{index=25}
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
-- 21) PROOFING (author proof approval + correction submission) :contentReference[oaicite:26]{index=26}
-- =========================
CREATE TABLE IF NOT EXISTS proofing_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,

  proof_pdf_url TEXT NOT NULL,           -- generated proof for author review
  author_approved BOOLEAN NOT NULL DEFAULT FALSE,
  author_corrections TEXT,               -- correction submission

  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proofing_rounds_paper ON proofing_rounds(paper_id);


-- =========================
-- 22) PUBLICATIONS (Published record + DOI + issue assignment)
-- TRD published page must show DOI, PDF download, license info, citation format. :contentReference[oaicite:27]{index=27}
-- =========================
CREATE TABLE IF NOT EXISTS publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  paper_id UUID UNIQUE NOT NULL REFERENCES papers(id) ON DELETE CASCADE,

  issue_id UUID REFERENCES journal_issues(id),

  doi TEXT UNIQUE,                      -- DOI registered
  doi_url TEXT,                         -- clickable DOI
  pdf_url TEXT NOT NULL,                -- final PDF download

  citation_text TEXT,                   -- formatted citation string

  published_by UUID REFERENCES users(id),
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  year_label TEXT DEFAULT 'Conference 2026'
);

CREATE INDEX IF NOT EXISTS idx_publications_issue ON publications(issue_id);
CREATE INDEX IF NOT EXISTS idx_publications_published_at ON publications(published_at);


-- =========================
-- 23) REVIEWER CERTIFICATES (TRD: auto certificate after review) :contentReference[oaicite:28]{index=28}
-- =========================
CREATE TABLE IF NOT EXISTS reviewer_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  review_assignment_id UUID UNIQUE NOT NULL REFERENCES review_assignments(id) ON DELETE CASCADE,

  certificate_url TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =========================
-- 24) SEARCH (optional helper: materialized view later)
-- TRD requires platform search across journals. :contentReference[oaicite:29]{index=29}
-- Implement via Postgres full-text or external search; schema hooks:
CREATE TABLE IF NOT EXISTS paper_search_index (
  paper_id UUID PRIMARY KEY REFERENCES papers(id) ON DELETE CASCADE,
  document_tsv tsvector NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS gin_paper_search_index ON paper_search_index USING GIN (document_tsv);