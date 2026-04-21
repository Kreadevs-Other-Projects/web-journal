# FEATURES.md

Feature inventory of the web-journal codebase. Scan date: 2026-04-15.
Each item reflects code that **exists** in the repository.

---

## Authentication & Authorization

- [ ] User signup with OTP email verification
- [ ] User login with OTP email verification
- [ ] Login OTP verification (`/auth/verifyLoginOTP`)
- [ ] OTP request / resend
- [ ] JWT access token + httpOnly refresh token flow
- [ ] Token refresh (`/auth/token`)
- [ ] Logout with token invalidation
- [ ] Role switching for multi-role users (`/auth/switch-role`)
- [ ] Staff creation by chief_editor / publisher / journal_manager / sub_editor (`/auth/create-staff`)
- [ ] Duplicate-role guard on signup (blocks OTP send if role already held)
- [ ] Blocked roles on public signup: `owner`, `chief_editor`, `sub_editor`, `journal_manager`
- [ ] Addable roles via public signup: `author`, `reviewer`, `publisher`

---

## Profile Management

- [ ] Get profile
- [ ] Complete profile (onboarding, with profile picture upload)
- [ ] Edit / update profile (with profile picture upload)
- [ ] Delete account
- [ ] Change password
- [ ] Upload certifications (reviewers & editors)
- [ ] Get certifications
- [ ] Delete certification
- [ ] `keywords` field on profile (max 5, enforced backend + frontend)
- [ ] `degrees` field on profile (array of strings)
- [ ] `profile_pic_url` field on profile (file upload)
- [ ] Profile-completion guard middleware (`requireProfileCompleted`)

---

## Paper Submission & Management

- [ ] Create paper / manuscript submission (file upload)
- [ ] Get all papers (paginated)
- [ ] Get papers by author
- [ ] Update paper status
- [ ] Get paper versions list
- [ ] Upload paper revision
- [ ] Track paper status (`getPaperTrackingController`)
- [ ] Get paper HTML (formatted view)
- [ ] Get paper version HTML
- [ ] Extract metadata from PDF / DOC on upload
- [ ] Edit paper metadata (title, authors, keywords, abstract, references)
- [ ] Metadata validation check before publication
- [ ] Get keyword suggestions (personalised)
- [ ] Get public keyword suggestions (global)
- [ ] Get journal top keywords (trending per journal)
- [ ] Suggest DOI (publisher)
- [ ] Get paper status log (`/papers/:id/status-log`)
- [ ] Assign paper to issue (journal_manager / chief_editor)
- [ ] `submitted_at`, `accepted_at`, `published_at` timestamps stored and displayed
- [ ] `paper_status_log` table — row inserted on every status change

---

## Journal Management

- [ ] Create journal (publisher / owner)
- [ ] Get journals (public list)
- [ ] Get journal (public detail)
- [ ] Get owner journal (owner-specific view)
- [ ] Update journal
- [ ] Delete journal
- [ ] Update journal APC (Article Processing Charges)
- [ ] Get editorial board (public)
- [ ] Get author guidelines (public)
- [ ] Upload journal logo
- [ ] Publisher journal creation flow — creates chief_editor + journal_manager users inline
- [ ] Takedown journal / restore journal (publisher)
- [ ] Replace chief editor on journal (publisher)
- [ ] Replace journal manager on journal (publisher)

---

## Journal Issues

- [ ] Add journal issue
- [ ] Get journal issues
- [ ] Update journal issue
- [ ] Delete journal issue
- [ ] Request new issue (journal_manager → publisher workflow)
- [ ] Get my issues (journal_manager)
- [ ] Get my issue requests (journal_manager)
- [ ] Get pending issue requests (publisher)
- [ ] Review issue request — approve / reject (publisher)
- [ ] Update issue status (`open` / `closed`)
- [ ] "Open for Call to Paper" / "Close Submissions" action (chief_editor)
- [ ] Get papers by issue
- [ ] Get next issue preview
- [ ] Get manager papers (papers under journal_manager's issue)
- [ ] Manual issue reset (publisher-triggered close of all open issues)
- [ ] Takedown issue / restore issue (publisher)

---

## Review & Reviewer Management

- [ ] Get reviewer papers (assigned for review)
- [ ] Submit review (reviewer)
- [ ] Get reviews for paper (sub_editor)
- [ ] Get submitted reviews (journal_manager / publisher)
- [ ] Assign reviewer to paper (sub_editor / chief_editor)
- [ ] Invite reviewer via email (sub_editor)
- [ ] Fetch reviewers list (chief_editor / sub_editor)
- [ ] Fetch sub editors list
- [ ] Fetch chief editors list
- [ ] Handle assignment status — accept / decline (sub_editor)
- [ ] Apply as reviewer (public endpoint)
- [ ] Suggest reviewer (sub_editor → chief_editor approval workflow)
- [ ] Get pending reviewer requests (chief_editor)
- [ ] Approve / reject reviewer request (chief_editor)
- [ ] Remind reviewer (single, with 24-hour cooldown)
- [ ] Remind reviewer bulk
- [ ] Get sub editor assignments

---

## Editor Assignment & Decisions

- [ ] Assign sub editor to paper (chief_editor)
- [ ] Replace sub editor on paper (chief_editor)
- [ ] Sub editor decision — approve / revision (with password confirmation)
- [ ] Block duplicate decision on same paper version
- [ ] Chief editor decision — accept / reject / revise
- [ ] Chief editor status override (`ce_override` flag)
- [ ] Get paper decision history
- [ ] Remind associate editor (chief_editor, single + bulk)
- [ ] Get CE stats (dashboard statistics)
- [ ] Invite sub editor

---

## Publication

- [ ] Publish paper (publisher)
- [ ] Publish issue (make papers public)
- [ ] Get submitted reviews (for publication decision)
- [ ] Takedown paper / restore paper (publisher)
- [ ] Public paper detail page (by ID)
- [ ] Public paper by slug (`/article/:acronym/:slug`)
- [ ] Get paper slug (lookup by paper ID for redirects)

---

## Browse & Public Pages

- [ ] Browse journals (public)
- [ ] Get home journals (featured)
- [ ] Get home publications (featured)
- [ ] Get open journals (journals with `status = 'open'` issues)
- [ ] Archive — all published papers with filters
- [ ] Journal public page with tabs: Home / Editorial Board / OA Policy / Peer Review Policy / Articles
- [ ] Routing: `/journals/:acronym?tab=home|editorial|oa-policy|peer-review|articles`

---

## Paper Payment System

- [ ] Upload receipt (author submits payment proof)
- [ ] Approve or reject payment (publisher)
- [ ] Get payment for paper (author / publisher)
- [ ] Get pending payments (publisher)
- [ ] Get all payments (publisher)
- [ ] Get rejected payments (publisher)
- [ ] Send payment reminder (publisher)
- [ ] Resend invoice (publisher)
- [ ] Send invoice / payment email
- [ ] Owner: upload payment image for journal renewal
- [ ] Owner: get pending journal payment status

---

## Categories

- [ ] Get categories (global list)
- [ ] Create category (publisher)
- [ ] Delete category (publisher)
- [ ] Get journal categories
- [ ] Create journal category
- [ ] Update journal category
- [ ] Delete journal category

---

## Invitations

- [ ] Send invitation (publisher / chief_editor / sub_editor)
- [ ] Verify invitation token (public)
- [ ] Accept invitation — create account via token
- [ ] Cancel invitation
- [ ] Get journal invitations (all for journal)
- [ ] Get my invitations (CE's own)
- [ ] Resend invitation

---

## Conferences

- [ ] Get conferences (public list)
- [ ] Create conference (publisher)
- [ ] Delete conference (publisher)

---

## Contact

- [ ] Send contact message (public contact form)

---

## Homepage Content (Admin)

- [ ] Manage homepage sections — About Publisher, Open for Submissions banners, Upcoming Conferences (CRUD at `/admin/homepage-content`)

---

## Owner

- [ ] Create chief editor
- [ ] Get chief editors list
- [ ] Get publishers list
- [ ] Send journal expiry notice (renewal reminder email)

---

## Cron Jobs

- [ ] **invitationExpiryCron** — expires pending invitations past expiry date — `0 * * * *` (hourly) — **ACTIVE**
- [ ] **issueResetCron** — closes all open issues on new year — `1 0 1 1 *` (Jan 1 00:01) — **ACTIVE**
- [ ] **journalSuspensionCron** — auto-suspends journals past expiry without renewal payment — `* * * * *` (every minute) — **COMMENTED OUT**
- [ ] **yearlyEmailCron** — sends renewal invoices on journal expiry date — `0 0 * * *` (daily midnight) — **COMMENTED OUT**

---

## Middleware

- [ ] `authMiddleware` — JWT Bearer verification, decodes payload into `req.user`
- [ ] `authorize(...roles)` — RBAC, returns 403 if role not in allowed list
- [ ] `requireProfileCompleted` — blocks actions until onboarding profile is complete
- [ ] `validate(schema)` — Zod schema validation for body / params / query
- [ ] `errorHandler` — global error handler
- [ ] `notFound` — 404 handler for unmatched routes
- [ ] `upload` — general files (JPG, PNG, GIF, PDF, DOC, DOCX) — 10 MB
- [ ] `manuscriptUpload` — manuscript files (DOCX, PDF, TEX, LaTeX) — 10 MB
- [ ] `receiptUpload` — payment receipts (JPG, PNG, PDF) — 5 MB
- [ ] `logoUpload` — journal logos (JPEG, PNG, WebP, GIF) — 2 MB
- [ ] `certificationUpload` — certificates (PDF, JPG, PNG) — 5 MB

---

## Frontend Pages

### Public
- [ ] Landing page
- [ ] About Us
- [ ] Contact Us
- [ ] FAQ
- [ ] Browse journals
- [ ] Research paper detail
- [ ] Article page
- [ ] Article redirect (SEO slug)
- [ ] Archive (published papers)
- [ ] 404 Not Found
- [ ] Unauthorized

### Auth
- [ ] Login
- [ ] Signup
- [ ] Accept invitation
- [ ] Complete profile (onboarding)

### Author
- [ ] Author dashboard (recent submissions + published articles, two-panel layout)
- [ ] My submissions
- [ ] Submit paper
- [ ] Track paper
- [ ] Paper versions (revision history)

### Reviewer
- [ ] Reviewer dashboard
- [ ] Review detail
- [ ] Completed reviews history

### Chief Editor
- [ ] Chief editor dashboard
- [ ] Manage papers
- [ ] Paper detail view
- [ ] Assign reviewers
- [ ] Assign associate editors
- [ ] Reviewed papers
- [ ] Journal detail
- [ ] Manage journals
- [ ] CE statistics
- [ ] Team management (editors & reviewers)
- [ ] Reviewer applications
- [ ] Staff detail / profile

### Sub Editor / Associate Editor
- [ ] Sub editor dashboard
- [ ] Revision paper (handle revisions)

### Publisher
- [ ] Publisher dashboard
- [ ] Create journal
- [ ] Edit journal
- [ ] Journal detail
- [ ] Manage journals
- [ ] Issue detail
- [ ] Publish papers
- [ ] Manage payments
- [ ] Categories
- [ ] Journal categories
- [ ] Homepage content management

### Journal Manager
- [ ] Journal manager dashboard (left sidebar: Total Issues / Archive Issues / Issue / Editorial Board / Publication Ethics)

### Owner
- [ ] Owner dashboard
- [ ] Manage journals

---

## Frontend Components (Notable)

- [ ] `KeywordInput` — multi-keyword chip input with autocomplete, max 5
- [ ] `OtpInput` / `OtpVerification` — OTP entry & verification flow
- [ ] `RichTextEditor` — WYSIWYG editor
- [ ] `SignatureModal` — digital signature capture for reviews
- [ ] `PaperTimeline` — vertical status timeline (Submitted → Under Review → Accepted/Rejected → Published)
- [ ] `ReviewerMatrix` — table for reviewer assignments
- [ ] `PaymentModal` / `InitialCheckout` — payment flow UI
- [ ] `MetadataValidationModal` — PDF metadata check UI
- [ ] `StatusBadge` — paper / review status badge
- [ ] `SkeletonLoader` — content loading placeholder
- [ ] `ProfileGuard` — profile-completion gate wrapper
- [ ] `DashboardLayout` — shared dashboard shell
- [ ] `ThemeToggle` — dark / light mode switcher
- [ ] Role switcher dropdown in header (visible when user holds > 1 role)
