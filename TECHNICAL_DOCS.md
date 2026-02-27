# Technical Documentation

> Architecture, API reference, and developer guide for the AI-Powered Resume Builder.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [API Reference](#api-reference)
4. [AI Services](#ai-services)
5. [GitHub Integration](#github-integration)
6. [Authentication](#authentication)
7. [Matching Algorithm](#matching-algorithm)
8. [Resume Generation](#resume-generation)
9. [Error Handling](#error-handling)

---

## Architecture Overview

The application uses a **Next.js 14 App Router** architecture with server-side API routes, Prisma ORM for database access, and Google Gemini AI for intelligent analysis.

```
┌─────────────────────────────────────────────────┐
│                    Frontend                      │
│  Next.js Pages • React Components • TanStack Q  │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│                  API Routes                      │
│  /api/auth/*           Authentication            │
│  /api/profile          User profile CRUD         │
│  /api/projects/*       Project CRUD + analyze    │
│  /api/experiences/*    Experience CRUD           │
│  /api/jobs/*           Job description CRUD      │
│  /api/github/*         GitHub import + analysis  │
│  /api/ai/*             AI matching + optimization│
│  /api/match            TF-IDF matching           │
│  /api/ats-score        ATS compatibility         │
│  /api/generate-docx    DOCX export               │
│  /api/resume-data      Resume data aggregation   │
│  /api/generated-docs/* Resume history            │
│  /api/analytics/*      Usage analytics           │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│                   Services                       │
│  enhanced-ai-service.ts  Deep repo analysis      │
│  ai-service.ts           Matching + caching      │
│  matching.ts             TF-IDF algorithm        │
│  github-integration.ts   GitHub API helpers       │
│  ats-scorer.ts           ATS scoring engine       │
│  resume-templates.ts     DOCX template engine     │
│  docx-resume.ts          DOCX file generation     │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│                   Database                       │
│  Prisma ORM → SQLite (dev) / PostgreSQL (prod)   │
│  9 models • 6 indexes • AICache for API savings  │
└─────────────────────────────────────────────────┘
```

---

## Database Schema

### Models

#### User
Core user record. Supports both credentials-based and GitHub OAuth login.

| Field | Type | Description |
|---|---|---|
| id | String | CUID primary key |
| email | String? | Unique email address |
| name | String? | Display name |
| passwordHash | String? | Bcrypt hash (null for GitHub-only users) |
| image | String? | Avatar URL |

**Relations:** accounts, sessions, profile, projects, projectProfiles, experiences, jobs, generatedDocs

#### UserProfile
User's personal information for resume header.

| Field | Type | Description |
|---|---|---|
| userId | String | Unique FK to User |
| fullName | String? | Full name |
| email | String? | Contact email |
| phone | String? | Phone number |
| location | String? | City/State |
| linkedinUrl | String? | LinkedIn profile URL |
| websiteUrl | String? | Personal website |
| summary | String? | Professional summary |
| education | String? | Education details (text) |
| otherExperience | String? | Additional experience |
| skills | String? | Comma-separated skills |

#### Project
A user's project — imported from GitHub or added manually.

| Field | Type | Description |
|---|---|---|
| id | String | CUID primary key |
| userId | String | FK to User |
| source | String | `"github"` or `"manual"` |
| title | String | Project name |
| description | String? | Description text |
| techStack | String? | Comma-separated technologies |
| role | String? | User's role on the project |
| startDate | String? | Start date string |
| endDate | String? | End date string |
| link | String? | GitHub URL or demo link |
| outcomes | String? | Newline-separated outcomes |
| tags | String? | Comma-separated tags |
| githubRepo | String? | **Repo name** (links to ProjectProfile) |
| highlight | Boolean | Include in resume by default |

#### ProjectProfile
AI-generated deep analysis of a GitHub repository. Linked to Project via `githubRepo` ↔ `repoName`.

| Field | Type | Description |
|---|---|---|
| userId | String | FK to User |
| repoName | String | GitHub repo name **(unique with userId)** |
| repoUrl | String | Full GitHub URL |
| category | String? | LLM Engineering, Data Science, etc. |
| masterDescription | String | AI-generated professional description |
| bulletPoints | String | JSON array of resume bullets |
| techStack | String | JSON: `{primary, secondary, proficiency}` |
| architectureNotes | String? | Architecture and design patterns |
| metrics | String | JSON: `{stars, forks, commits, contributors, linesOfCode, lastUpdated}` |
| problemStatement | String? | Problem the project solves |
| solutionApproach | String? | Technical solution |
| impact | String? | Impact and value |
| githubData | String? | Raw GitHub API data (JSON) |
| primaryLanguage | String? | Main programming language |
| topics | String? | JSON array of GitHub topics |
| lastAnalyzed | DateTime | When last analyzed |
| analysisVersion | String | Version of analysis logic |

#### Experience
Work experience entries.

| Field | Type | Description |
|---|---|---|
| company | String | Company name |
| position | String | Job title |
| location | String? | Work location |
| startDate | String | Start date |
| endDate | String? | End date (null = current) |
| description | String? | Role description |
| responsibilities | String? | Key responsibilities |
| achievements | String? | Notable achievements |
| techStack | String? | Technologies used |

#### Job
Saved job descriptions for matching.

| Field | Type | Description |
|---|---|---|
| title | String | Job title |
| company | String | Company name |
| description | String | Full job description |
| requirements | String? | Job requirements |
| preferredSkills | String? | Preferred skills |
| status | String | `"active"` / `"applied"` / `"closed"` |

#### GeneratedDoc
Record of generated resume documents.

#### AICache
Caches AI API responses to reduce costs. 30-day TTL. Keyed by SHA-256 hash of input.

---

## API Reference

### Authentication

#### `POST /api/auth/signup`
Create a new user account with email/password.

**Body:** `{ name, email, password }`

#### `[...nextauth] /api/auth/*`
NextAuth.js endpoints for sign-in, sign-out, session management. Supports GitHub OAuth and Credentials providers.

---

### Profile

#### `GET /api/profile`
Returns the current user's profile.

#### `PUT /api/profile`
Create or update user profile. Uses upsert.

**Body:** `{ fullName, email, phone, location, linkedinUrl, websiteUrl, summary, education, otherExperience, skills }`

---

### Projects

#### `GET /api/projects`
List all projects for the current user. Includes `hasProfile` boolean indicating if an AI analysis exists.

**Profile matching strategy (3-tier):**
1. Direct match on `githubRepo` field
2. Extract repo name from `link` URL (`github.com/owner/repo` → `repo`)
3. Slugified title match (`"My Project"` → `"my-project"`)

#### `POST /api/projects`
Create a new project manually.

#### `GET /api/projects/[id]`
Get a single project with its linked ProjectProfile (if any).

#### `PATCH /api/projects/[id]`
Update a project.

#### `DELETE /api/projects/[id]`
Delete a project.

#### `POST /api/projects/[id]/analyze`
**Trigger AI deep analysis for a single project.**

Extracts GitHub owner/repo from the project's `link` or `githubRepo` field, runs `deepAnalyzeRepo()`, and upserts the result into ProjectProfile. Also backfills the `githubRepo` field if empty.

**Response:** `{ success: true, profile: ProjectProfile }`

**Error cases:**
- 400: No GitHub URL found
- 500: AI analysis failed (after retries)

---

### Experiences

#### `GET /api/experiences`
List all experiences for the current user.

#### `POST /api/experiences`
Create a new experience.

#### `GET /api/experiences/[id]`
Get a single experience.

#### `PATCH /api/experiences/[id]`
Update an experience.

#### `DELETE /api/experiences/[id]`
Delete an experience.

---

### Jobs

#### `GET /api/jobs`
List all saved jobs.

#### `POST /api/jobs`
Save a new job description.

#### `GET /api/jobs/[id]`
Get a single job.

#### `PATCH /api/jobs/[id]`
Update a job.

#### `DELETE /api/jobs/[id]`
Delete a job.

---

### GitHub

#### `GET /api/github/repos`
Fetch the user's GitHub repositories using their OAuth token.

**Requires:** GitHub account linked via OAuth.

#### `POST /api/github/repos`
Import selected repositories as projects.

**Body:** `{ repoIds: number[], useAI: boolean }`

**Behavior:**
- Fetches repo data, README, languages, and commits for each repo
- If `useAI: true`, uses Gemini to generate professional descriptions
- **Deduplicates** — if a project with the same GitHub URL already exists, updates instead of creating
- Sets `githubRepo` field on every imported project for ProfileProfile linking

#### `POST /api/github/deep-analyze`
Bulk deep analysis of all GitHub repos. Long-running operation.

**Body:** `{ githubUsername: string, forceRefresh?: boolean }`

#### `GET /api/github/deep-analyze`
Get analysis status and existing profiles.

---

### AI

#### `POST /api/ai/analyze-repo`
AI analysis of a single repo (uses `ai-service.ts`, with caching).

#### `POST /api/ai/match-projects`
AI-powered project-to-job matching with tailored bullets.

#### `POST /api/ai/optimize-resume`
Generate optimized resume content for selected projects.

---

### Other

#### `POST /api/match`
TF-IDF project matching (non-AI, uses `matching.ts`).

#### `POST /api/ats-score`
ATS compatibility scoring for resume content.

#### `POST /api/generate-docx`
Generate a DOCX resume file.

#### `GET /api/resume-data`
Aggregate all user data needed for resume generation.

#### `GET /api/generated-docs`
List all generated documents.

#### `GET /api/generated-docs/[id]`
Get a specific generated document.

#### `GET /api/analytics/project-usage`
Analytics on project usage across generated resumes.

---

## AI Services

### enhanced-ai-service.ts

The primary AI service for deep repository analysis. Uses **Gemini 2.0 Flash** (`gemini-2.0-flash-exp`).

#### `deepAnalyzeRepo(owner, name, token?)`
Comprehensive per-repo analysis with 5-step pipeline:

1. **Fetch GitHub data** — repo metadata via GitHub API (required; fails fast)
2. **Fetch README** — raw README content, up to 5000 chars (non-fatal)
3. **Fetch repo context** — directory tree via Tree API, top 10 ranked source files, config/dependency files (non-fatal)
4. **AI analysis** — sends all context to Gemini with structured prompt, parses JSON response. **Retries up to 2 times** with exponential backoff on failure.
5. **Calculate metrics** — commit count, contributor count from GitHub API

**File ranking heuristics:**
- Entry points (`main`, `app`, `index`, `server`) ranked highest
- Business logic (`service`, `engine`, `core`) next
- Data models, API routes, config files follow
- Tests ranked lowest
- Vendored/generated files excluded

#### `deepAnalyzeAllRepos(username, userId, token?)`
Bulk analysis of all repos for a user. Processes sequentially with 1-second delay between repos. Skips repos analyzed within 7 days.

#### `selectAndTailorProjects(jobDescription, profiles, maxProjects)`
Job-specific project selection and bullet tailoring using cached profiles.

#### `extractJobSpecificSkills(jobDescription, projects)`
Extracts organized skill sections (technical, tools, domains) from projects.

### ai-service.ts

Secondary AI service for job matching and resume optimization. Uses **Gemini 1.5 Flash** with response caching (30-day TTL via AICache table).

#### Key functions:
- `analyzeGitHubRepo()` — lightweight repo analysis (used during import)
- `matchProjectsToJob()` — AI-powered project ranking with tailored descriptions
- `optimizeResumeContent()` — generates ATS-optimized resume content
- `cleanupExpiredCache()` — removes expired cache entries

---

## GitHub Integration

### OAuth Setup

The GitHub OAuth provider is configured in `src/lib/auth.ts` with scopes:
- `read:user` — read user profile
- `user:email` — access email addresses
- `repo` — **read repository contents** (required for AI code analysis)

### Import Flow

```
GitHubImportModal → POST /api/github/repos
    → fetchGitHubRepos(token)         # List user's repos
    → repoToProjectData(repo, token)  # For each selected repo:
        → fetchRepoReadme()           # Get README
        → fetchRepoLanguages()        # Get language breakdown
        → fetchRepoCommits()          # Get recent commits
        → [optional] analyzeGitHubRepo()  # AI analysis
    → prisma.project.upsert()         # Create or update Project
```

### Profile Matching

Projects link to ProjectProfiles via a 3-strategy lookup:
1. **Direct:** `project.githubRepo === profile.repoName`
2. **URL extraction:** extract repo name from `project.link` URL
3. **Fuzzy:** slugify `project.title` and compare to `profile.repoName`

---

## Authentication

### Providers
1. **GitHub OAuth** — primary auth method. Grants access to repo import and AI analysis.
2. **Email/Password** — alternative auth via bcrypt-hashed passwords.

### Session Strategy
JWT-based sessions with 30-day max age. User ID stored in `token.sub`.

### Account Linking
`allowDangerousEmailAccountLinking: true` — allows linking GitHub to existing email accounts.

---

## Matching Algorithm

The TF-IDF matching system in `matching.ts`:

1. **Tokenization** — text split into unigrams, bigrams, and trigrams with stop word removal
2. **Term frequency** — calculated for both job description and each project
3. **TF-IDF scoring** — weighted scoring with phrase boost (1.5x for multi-word matches)
4. **Coverage bonus** — additional 20 points for keyword coverage percentage
5. **Skill extraction** — 80+ skill database for identifying relevant technical skills

---

## Resume Generation

### Template System

5 templates defined in `resume-templates.ts`:
- **Modern** — professional with color accents
- **Classic** — traditional black-and-white
- **Technical** — emphasizes tech skills
- **Minimal** — concise, single-column
- **Student** — education-first layout

### DOCX Generation

Uses the `docx` library to programmatically build Word documents with:
- Proper heading hierarchy
- Bullet points with formatting
- Multiple sections (header, summary, experience, projects, education, skills)
- Automatic page management based on content
- ATS-friendly formatting (no tables, no graphics)

---

## Error Handling

### AI Service
- **Retry logic** — `deepAnalyzeRepo` retries up to 2 times with exponential backoff (2s, 4s)
- **Graceful fallback** — if all retries fail, returns `basicAnalysis` (generic but functional)
- **Step-level isolation** — README/context fetch failures don't prevent AI analysis
- **Response validation** — checks for required fields before accepting AI output

### API Routes
- All routes check `getServerSession()` for authentication
- Consistent error response format: `{ error: string }`
- HTTP status codes: 400 (bad request), 401 (unauthorized), 404 (not found), 500 (server error)

### GitHub API
- Token-based authentication when available
- Fallback to unauthenticated requests (lower rate limits)
- Branch fallback: tries `main` then `master`
- Non-fatal failures for optional data (README, languages, commits)
