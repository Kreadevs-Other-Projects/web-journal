# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**web-journal** is a full-stack academic journal management platform. It handles the lifecycle of research paper submissions, peer reviews, editorial decisions, and publication. The project is a monorepo with two independent packages:

- `client/` — React + Vite + TypeScript SPA
- `server/` — Express 5 + TypeScript REST API

## Commands

### Client (`client/`)

```bash
bun dev          # Start dev server (Vite, default port 5173)
bun build        # Production build
bun lint         # ESLint
```

### Server (`server/`)

```bash
npm run dev      # Start with nodemon (ts-node, watches src/, port 5000)
npm run migrate  # Run DB migrations
npm run create   # Create the PostgreSQL database ("giki")
npm run drop     # Drop the PostgreSQL database

# Code scaffolding (generates boilerplate files)
npm run controller  # Create a new controller
npm run route       # Create a new route
npm run service     # Create a new service
npm run repo        # Create a new repository
```

## Architecture

### Backend — Layered API Pattern

Each feature module lives in `server/src/Api/<feature>/` and follows a strict 4-layer structure:

```
<feature>.route.ts       → Express router, applies auth/validation middleware
<feature>.controller.ts  → Thin handlers, calls service, sends response
<feature>.service.ts     → Business logic
<feature>.repository.ts  → Raw SQL queries via pg pool
<feature>.schema.ts      → Zod validation schemas
```

All API modules are registered in `server/src/app.ts` under `/api/<name>`.

Key infrastructure:

- **Database**: PostgreSQL pool in `server/src/configs/db.ts`, database name is `giki`
- **Validation middleware**: `server/src/middlewares/validate.middleware.ts` wraps Zod schemas for request validation
- **Auth middleware**: `server/src/middlewares/auth.middleware.ts` — attaches `req.user` from JWT; use `AuthUser` extended Request type in controllers
- **File uploads**: Multer middleware saves to `server/uploads/`, served statically at `/api/uploads/`
- **Email**: Nodemailer configured in `server/src/configs/email.ts`; email utilities in `server/src/utils/emails/`
- **Cron jobs**: `server/src/cron/` — currently commented out in `server.ts`
- **Async handler**: `server/src/utils/asyncHandler.ts` wraps route handlers for consistent error propagation

### Frontend — Role-Based SPA

**Auth flow**: JWT access token stored in `localStorage` (`accessToken`), refresh token in httpOnly cookie. `AuthContext` (`client/src/context/AuthContext.tsx`) decodes the JWT and exposes `user`, `userData`, `token`, `isAuthenticated`.

**Routing**: `client/src/App.tsx` wraps routes with:

- `<PublicRoute>` — accessible without login
- `<ProtectedRoute allowedRoles={[...]}>` — enforces role-based access

**User roles** (defined in `client/src/lib/roles.ts`):
| Role | Route | Description |
|---|---|---|
| `author` | `/author` | Submit and track papers |
| `reviewer` | `/reviewer` | Peer review assignments |
| `sub_editor` | `/sub-editor` | Manage revisions |
| `chief_editor` | `/chief-editor` | Oversee submissions |
| `publisher` | `/publisher` | Publish accepted papers |
| `publisher_manager` | `/publisher-manager` | Manage publisher ops |
| `owner` | `/owner` | System-level management |

**API base URL**: hardcoded in `client/src/url.ts` as `http://localhost:5000/api` for local development.

**UI**: Shadcn/ui components (Radix UI primitives + Tailwind) in `client/src/components/ui/`. Custom business components are directly in `client/src/components/`.

**Data fetching**: TanStack React Query for server state. Direct `fetch()` calls with `Authorization: Bearer <token>` header.

## Environment Variables (Server)

Required in `server/.env`:

```
PORT=
DATABASE_URL=          # PostgreSQL connection string pointing to "giki" DB
SALT_ROUND=
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_SHORT_EXPIRY=      # e.g. "15m"
JWT_LONG_EXPIRY=       # e.g. "7d"
CORS_ORIGIN=
EMAIL_USER=
EMAIL_PASSWORD=
```

## Development Notes

- **OTP is bypassed in dev mode**: `auth.controller.ts` skips OTP verification and returns tokens directly. The production OTP flow is commented out.
- **Cron jobs are disabled**: `yearlyEmailCron` and `journalSuspensionCron` are commented out in `server.ts`.
- The server uses **Express 5** (note: error handling and async behavior differ from Express 4).
- The client uses **bun** as its package manager; the server uses **npm**.

# IAP Publishing Platform — Full-Stack Change Prompt

# Target Deadline: 19 March

# Scope: Backend (API/DB) + Frontend (UI/UX) changes only as specified below.

# DO NOT refactor unrelated code, rename existing working modules, or change DB columns not mentioned.

---

## CONTEXT

This is a multi-journal academic publishing platform. Stack:

- Backend: Node.js/Laravel/Django (adapt to whichever is in use) with PostgreSQL
- Frontend: React or Vue.js
- Auth: JWT with refresh tokens, role-based access control (RBAC)

Existing roles in DB enum `user_role`:
`owner, publisher, publisher_manager, chief_editor, sub_editor, reviewer, author`

---

## CHANGE 1 — RENAME ROLE (DB + CODE)

**Rename** `publisher_manager` → `journal_manager` everywhere:

1. Run DB migration:

```sql
ALTER TYPE user_role RENAME VALUE 'publisher_manager' TO 'journal_manager';
```

2. Find and replace every string/constant `publisher_manager` → `journal_manager` across:
   - All backend route guards / middleware
   - All frontend role checks / conditionals
   - Seed files, constants files, permission maps
3. DO NOT change any other role values.

---

## CHANGE 2 — MULTI-LOGIN (HIERARCHY-BASED ROLE SWITCHING)

**Goal:** A single user account can hold multiple roles. The active session role can be switched. Access is hierarchical — higher roles can act downward but not upward.

**Hierarchy (top → bottom):**

```
publisher → journal_manager → chief_editor → author → sub_editor → reviewer
```

### 2a. Database

Add a new table:

```sql
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  journal_id UUID REFERENCES journals(id) ON DELETE CASCADE, -- NULL = platform-level role
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (user_id, role, journal_id)
);
```

Keep the `role` column on the `users` table as the **primary/default role** only. Do NOT remove it.

### 2b. Auth — JWT Token

When a user logs in, the JWT payload must include:

```json
{
  "sub": "<user_id>",
  "active_role": "<currently selected role>",
  "active_journal_id": "<journal_id or null>",
  "roles": ["<role1>", "<role2>"]
}
```

Add a new endpoint:

```
POST /auth/switch-role
Body: { "role": "chief_editor", "journal_id": "<uuid>" }
Response: new JWT with updated active_role + active_journal_id
```

The server must validate:

- The user actually has the requested role in `user_roles` table
- The role switch does not violate hierarchy (cannot switch UP to a role not assigned)

### 2c. Frontend — Role Switcher UI

In the top navigation bar (header), add a **role switcher dropdown** visible when the logged-in user has more than one role. It should:

- Show the current active role as the label
- List all other roles the user holds
- On selection, call `POST /auth/switch-role` and refresh the JWT + re-render the sidebar/nav for the new role's permissions
- If switching to a journal-specific role, also show journal context in the header (e.g., "Chief Editor — Journal of AI")

**DO NOT rebuild the entire auth system.** Only layer multi-role on top.

---

## CHANGE 3 — PAYMENT FLOW (COMMENT OUT / DISABLE)

**Disable** the journal owner payment flow entirely (do NOT delete code):

1. In the backend, wrap all journal payment creation/verification endpoints with a guard:

```js
// PAYMENT_DISABLED: Temporarily disabled per client instruction (Mar 2026)
// return res.status(503).json({ message: 'Payment flow is currently disabled.' });
```

2. In the frontend, comment out all payment step UI components in the journal creation wizard and paper submission flow. Replace with a placeholder:

```
<!-- PAYMENT_DISABLED: Payment step hidden per client instruction -->
```

3. The `journal_payments` and `paper_payments` tables remain untouched in the DB.
4. Paper status `awaiting_payment` and journal status `pending_payment` remain in enums — just skip them in workflow logic.

---

## CHANGE 4 — PUBLISHER: JOURNAL CREATION FORM

When a Publisher creates a new journal, the form must collect **exactly** these fields (no more, no less):

| Field                      | Type      | Notes                                  |
| -------------------------- | --------- | -------------------------------------- |
| Journal Name               | Text      | Required                               |
| ISSN                       | Text      | Optional                               |
| DOI                        | Text      | Leave empty/null for now, non-required |
| Publisher Name             | Text      | Required                               |
| Type                       | Dropdown  | e.g. Open Access, Subscription         |
| Peer Review Policy         | Long Text | Required                               |
| OA Policy                  | Long Text | Required                               |
| Author Guidelines          | Long Text | Required                               |
| Publication Fee (per page) | Numeric   | Set at journal level                   |
| Currency                   | Dropdown  | USD / PKR                              |

After journal creation, Publisher must also create:

- **Chief Editor** (Name, Email, Password) — creates a new user with role `chief_editor` linked to this journal in `user_roles`
- **Journal Manager** (Name, Email, Password) — creates a new user with role `journal_manager` linked to this journal in `user_roles`

Both are created inline in the journal creation flow (steps or tabs). Send welcome emails to both on creation.

---

## CHANGE 5 — USER PROFILES FOR EDITORIAL ROLES

For users with roles `chief_editor`, `sub_editor`, `reviewer`, extend their profile to store:

**Add to `user_profiles` table:**

```sql
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS degrees TEXT[],
  ADD COLUMN IF NOT EXISTS profile_pic_url TEXT,
  ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}';
```

**Rules:**

- `keywords`: max 5 items — enforce on backend (return 400 if >5) and frontend (disable "Add" button at 5)
- `profile_pic_url`: file upload, store in object storage, save URL
- `degrees`: array of degree strings (e.g. ["PhD Computer Science", "MSc AI"])

Update the profile edit form for these roles to show/collect these fields.

---

## CHANGE 6 — CHIEF EDITOR: OPEN FOR CALL TO PAPER

Chief Editor must be able to open/close a journal issue for paper submissions.

**Existing `journal_issues` table already has `status` enum with `open`/`closed`.**

Add a dedicated action button on the Chief Editor's Issue Management page:

- Button label: **"Open for Call to Paper"** (when status is not `open`)
- Button label: **"Close Submissions"** (when status is `open`)

Backend endpoint (if not already existing):

```
PATCH /journals/:journalId/issues/:issueId/status
Body: { "status": "open" | "closed" }
Auth: chief_editor of this journal only
```

The issue card/row must display a status badge: `Open for Submissions` / `Closed`.

---

## CHANGE 7 — DATE STAMPS ON PAPERS

Ensure these three timestamps are stored and displayed:

**DB** — these columns already exist on `papers` table:

- `submitted_at` — set automatically on submission (already default NOW())
- `accepted_at` — set when `editor_decisions` record is created with `decision = 'accepted'`
- `published_at` — set when paper is inserted into `publications` table

**Frontend** — display all three timestamps on:

- Author's paper detail view
- Chief Editor's manuscript management view
- Published article page (public-facing)

Format: `DD MMM YYYY` (e.g., `03 Mar 2026`)

---

## CHANGE 8 — REVIEW CYCLE TRACEABILITY (AUDIT TRAIL UI)

On every paper's detail page (visible to Author, Chief Editor, Sub-Editor), show a vertical **status timeline** component showing each stage the paper has passed through:

Stages to track and display (in order):

1. Submitted
2. Under Review
3. Accepted / Rejected
4. Published

Each stage node shows:

- Stage name
- Date/time it was reached
- Who performed the action (role + name)

**Backend:** Create a new table:

```sql
CREATE TABLE IF NOT EXISTS paper_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  status paper_status NOT NULL,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT
);
```

Whenever `papers.status` is updated anywhere in the codebase, also INSERT a row into `paper_status_log`. Add this as a DB trigger OR enforce in the service layer — pick whichever the existing codebase pattern uses.

**API:**

```
GET /papers/:paperId/status-log
Auth: author (own papers), sub_editor (assigned), chief_editor (journal)
```

---

## CHANGE 9 — PAPER SUBMISSION FORM (refer to Image 2 wireframe)

The submission form must have exactly these fields in this order:

1. **Select Journal** — Dropdown (required, shows only journals with `status = 'open'` issues)
2. **Title** — Text input, max 200 characters (show counter)
3. **Author Name(s)** — Repeatable field, "+ Add another author" button
4. **Corresponding Author(s)** — Repeatable field, max 5, "+ Add corresponding author" button
5. **Keywords** — Tag/chip input, max 5 keywords, show suggestions from existing article keywords in DB; user can add custom ones
6. **References** — Repeatable field, max 5 for now, "+ Add" button with a Link field alongside each reference
7. **Upload Manuscript** — File upload, accepts `.docx` and `.latex`/`.tex` only, max 10MB
8. **Submit button** — On click, open a **review modal** showing all entered data for author to confirm before final submission

On successful submission:

- Set `papers.status = 'submitted'`
- Insert row into `paper_status_log` with status `submitted`
- Send submission confirmation email to author

---

## CHANGE 10 — AUTHOR DASHBOARD (refer to Image 3 wireframe)

The Author Dashboard must show two panels side by side:

**Left panel — "Recent Submissions":**

- List of author's submitted papers
- Each item shows: Article Name, Status badge, Last Updated date
- "Submit Paper" button (CTA) linking to submission form

**Right panel — "Publisher" (Published Articles):**

- List of author's published articles
- Each item: Article Name, Author Names, Status badge, Last Updated

Both panels are scrollable independently. On mobile, stack vertically.

---

## CHANGE 11 — JOURNAL MANAGER PAGE (refer to Image 1 wireframe)

The Journal Manager dashboard has a **left sidebar** and a **main content area**:

**Left Sidebar navigation items:**

- Total Issues
- Archive Issues
- Issue (current)
- Editorial Board
- Publication Ethics

**Main content area — Current Issue view:**

- Header: Journal Name | Issue No. | Status badge: `Open for Call / Closed`
- List of articles in current issue, each showing:
  - Article Name
  - Author Names
  - Status badge
  - Last Updated
- Multiple articles listed (scrollable)
- Bottom: **"Request Another Issue"** button — sends a request notification to Publisher Admin

---

## CHANGE 12 — JOURNAL LEVEL TABS (Public-Facing Journal Page)

Each journal's public page must have these tabs:

| Tab                    | Content                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------- |
| **Journal Home**       | Cover image/banner, Aims & Scope text, ISSN display, "Submit an Article" CTA button |
| **Editorial Board**    | List of editorial board members with name, role, affiliation, profile pic           |
| **OA Policy**          | Rich text content (set by Publisher)                                                |
| **Peer Review Policy** | Rich text content (set by Publisher)                                                |
| **Articles**           | Paginated list of published articles with search/filter                             |

Routing: `/journals/:acronym` with `?tab=home|editorial|oa-policy|peer-review|articles`

---

## CHANGE 13 — PLATFORM HOME PAGE

The public home page must include these sections:

### Section 1 — Top Journals

- Grid of journal cards
- Each card: Journal cover, title, ISSN, article count
- **Filters:** keyword, year, subject/discipline
- "View All Journals" link

### Section 2 — Top Articles

- Grid/list of most-viewed/recent articles
- Each: Title, Author(s), Journal name, Published date
- **Filters:** keyword, year, subject/discipline

### Section 3 — About Publisher

- Static text block (editable by Publisher Admin from CMS/settings)

### Section 4 — Open for Submissions

- Cards for journals currently with `status = 'open'` issues
- Each card: Journal name, Issue label, Deadline (if set), "Submit Now" CTA

### Section 5 — Upcoming Conferences

- Static list (manually managed by Publisher Admin)
- Each entry: Conference name, date, location, link

Add a Publisher Admin UI page at `/admin/homepage-content` to manage sections 3, 4 banners, and 5 entries (CRUD).

---

## IMPLEMENTATION RULES (MUST FOLLOW)

1. **No breaking changes** to existing working endpoints unless explicitly stated above.
2. **No renaming** of existing DB tables or columns not mentioned above.
3. All new DB changes must be in a **migration file** — do not edit schema directly.
4. All new API endpoints must follow the existing project's route structure and naming conventions.
5. All frontend changes must use the existing component library/design system already in the project.
6. Payment code is **commented out, not deleted.**
7. Role `owner` remains untouched — it is a superadmin above `publisher` in the system hierarchy.
8. The `user_roles` table is **additive** — existing single-role users still work. The `role` field on `users` stays as the default/primary role.
9. Multi-role switcher only appears in the UI if the user has >1 role in `user_roles`.
10. Every new endpoint must have input validation and return proper HTTP status codes.
11. All file uploads go to the existing object storage integration already in the project.
12. Emails use the existing email service/SMTP integration already in the project.

---

## TESTING CHECKLIST (verify before commit)

- [ ] `publisher_manager` string does not appear anywhere in codebase after rename
- [ ] A user can log in and switch between 2 roles without re-entering credentials
- [ ] Journal creation form saves all 9 fields + creates chief_editor + journal_manager users
- [ ] Paper submission enforces max 5 keywords, max 5 references, max 5 corresponding authors
- [ ] `paper_status_log` gets a new row on every paper status change
- [ ] Author dashboard shows both panels correctly
- [ ] Journal public page has all 5 tabs rendering correct content
- [ ] Home page has all 5 sections
- [ ] Payment endpoints return 503 with disabled message
- [ ] No existing tests broken
