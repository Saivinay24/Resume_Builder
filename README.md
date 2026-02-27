# 🚀 AI-Powered Resume Builder

> **Build professional, job-specific resumes in seconds using AI-powered GitHub analysis and intelligent project matching.**

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748)](https://www.prisma.io/)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285F4)](https://ai.google.dev/)

---

## ✨ Features

### 🤖 AI-Powered Project Analysis
- **Per-project deep analysis** — click "Generate AI Report" on any GitHub project to get a comprehensive, README-level technical report
- **Code-aware analysis** — AI reads your actual source files, README, directory structure, and dependency files
- **Rich reports** — each report includes: description, problem/solution/impact, resume bullet points, exhaustive tech stack, architecture notes, and metrics
- **Retry logic** — automatic retries with exponential backoff on transient failures
- **Re-analyze** — update reports any time with "Re-analyze with AI"

### 📊 Smart Project Matching
- **TF-IDF matching** — semantic job description analysis with 80+ skill database
- **Relevance scoring** — 0–100% score for each project against a job description
- **AI-tailored bullets** — rewrites bullet points to emphasize job-relevant skills
- **Skill alignment** — visualizes matched vs missing keywords

### 🎨 Professional Templates
- **Modern** — clean, professional layout (default)
- **Classic** — traditional resume format
- **Technical** — emphasizes technical skills
- **Minimal** — concise single-page
- **Student** — education and projects emphasized

### 💾 Data Management
- **GitHub OAuth** — sign in with GitHub, import repos in one click
- **Deduplication** — re-importing updates existing projects, never creates duplicates
- **Work experience** — track internships, jobs, and volunteer work
- **Job library** — save and manage job descriptions
- **Resume history** — all generated resumes saved and downloadable
- **ATS scoring** — real-time feedback on resume compatibility

---

## 🎯 Quick Start

### Prerequisites
- Node.js 18+
- GitHub account (for OAuth and project import)
- Google Gemini API key ([get one free](https://aistudio.google.com/app/apikey))

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/resume_builder.git
cd resume_builder

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials (see Environment Variables below)

# Initialize database
npx prisma migrate dev
npx prisma generate

# Start development server
npm run dev
```

Visit `http://localhost:3000`

### Environment Variables

```bash
# Database (SQLite for dev, PostgreSQL for production)
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"    # Generate: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"

# GitHub OAuth (create at github.com/settings/applications/new)
GITHUB_ID="your-github-oauth-client-id"
GITHUB_SECRET="your-github-oauth-client-secret"

# Google Gemini AI
GEMINI_API_KEY="your-gemini-api-key"
```

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────┐
│              Frontend (Next.js 14)           │
│  Dashboard • Projects • Jobs • Resume Build  │
└─────────────────┬────────────────────────────┘
                  │
┌─────────────────▼────────────────────────────┐
│              API Layer (14 routes)            │
│  /api/projects/[id]/analyze  (per-project AI)│
│  /api/github/repos           (import)        │
│  /api/github/deep-analyze    (bulk analysis) │
│  /api/match                  (job matching)  │
│  /api/ats-score              (ATS scoring)   │
│  /api/generate-docx          (DOCX export)   │
└─────────────────┬────────────────────────────┘
                  │
┌─────────────────▼────────────────────────────┐
│           Services                           │
│  enhanced-ai-service.ts  (Gemini deep anal.) │
│  ai-service.ts           (matching + caching)│
│  matching.ts             (TF-IDF scoring)    │
│  github-integration.ts   (repo data fetch)   │
│  ats-scorer.ts           (ATS scoring)       │
│  resume-templates.ts     (5 DOCX templates)  │
└─────────────────┬────────────────────────────┘
                  │
┌─────────────────▼────────────────────────────┐
│           Database (Prisma + SQLite)         │
│  User • Project • ProjectProfile • Job       │
│  Experience • GeneratedDoc • AICache         │
└──────────────────────────────────────────────┘
```

---

## 💡 How It Works

### Per-Project AI Analysis

```
User clicks "Generate AI Report" on a project page
    → Extract GitHub owner/repo from link
    → Fetch: repo metadata, README, directory tree, top 10 source files, dependency files
    → Send to Gemini AI with comprehensive prompt
    → Parse JSON response with retry logic (2 attempts)
    → Store in ProjectProfile table
    → Display structured report on project page
```

**What the AI reads:**
| Data Source | Description |
|---|---|
| GitHub API | Stars, forks, language, topics, description |
| README | Full README content (up to 5000 chars) |
| Directory tree | Complete file/folder structure via Tree API |
| Source files | Top 10 ranked code files (entry points, models, services first) |
| Config files | package.json, requirements.txt, Dockerfile, etc. |

**What the AI generates:**
| Field | Description |
|---|---|
| Category | LLM Engineering, Data Science, Full-Stack, etc. |
| Master description | 2–3 sentence professional summary |
| Resume bullets | 4–6 STAR-format bullets with metrics |
| Tech stack | Primary + secondary + proficiency levels |
| Architecture notes | Design patterns and system architecture |
| Problem / Solution / Impact | Context for the project |

### Job-Specific Tailoring

```
User pastes job description → AI selects best matching projects
    → Rewrites bullets to emphasize job-relevant skills
    → Returns relevance scores and skill alignments
```

---

## 📁 Project Structure

```
resume_builder/
├── prisma/
│   └── schema.prisma          # 9 models: User, Project, ProjectProfile, Job, etc.
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/          # NextAuth + signup
│   │   │   ├── github/        # repos, import, deep-analyze
│   │   │   ├── projects/      # CRUD + per-project analyze
│   │   │   ├── jobs/          # Job description CRUD
│   │   │   ├── match/         # TF-IDF job matching
│   │   │   ├── ai/            # AI analyze-repo, match-projects, optimize-resume
│   │   │   ├── ats-score/     # ATS compatibility scoring
│   │   │   ├── generate-docx/ # DOCX resume generation
│   │   │   ├── profile/       # User profile CRUD
│   │   │   └── experiences/   # Work experience CRUD
│   │   ├── auth/              # Sign-in / Sign-up pages
│   │   └── dashboard/         # All dashboard pages
│   ├── components/
│   │   ├── GitHubImportModal.tsx    # Import repos from GitHub
│   │   ├── GitHubSyncButton.tsx     # Bulk sync + deep analyze
│   │   ├── ProjectForm.tsx          # Project create/edit form
│   │   ├── ExperienceForm.tsx       # Experience create/edit form
│   │   ├── ResumePreview.tsx        # Resume preview component
│   │   └── DashboardNav.tsx         # Dashboard navigation
│   └── lib/
│       ├── enhanced-ai-service.ts   # Deep repo analysis (Gemini)
│       ├── ai-service.ts            # Job matching + caching
│       ├── github-integration.ts    # GitHub API utilities
│       ├── matching.ts              # TF-IDF matching algorithm
│       ├── ats-scorer.ts            # ATS scoring engine
│       ├── resume-templates.ts      # 5 DOCX templates
│       ├── docx-resume.ts           # DOCX generation
│       ├── auth.ts                  # NextAuth config
│       └── prisma.ts                # Prisma client singleton
├── README.md
├── TECHNICAL_DOCS.md
├── USER_GUIDE.md
└── DEPLOYMENT.md
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Database | Prisma ORM + SQLite (dev) / PostgreSQL (prod) |
| AI | Google Gemini 2.0 Flash |
| Auth | NextAuth.js (GitHub OAuth + Credentials) |
| State | TanStack Query (React Query) |
| Styling | Tailwind CSS |
| Documents | docx library for DOCX generation |

---

## 📚 Documentation

- **[USER_GUIDE.md](./USER_GUIDE.md)** — Complete usage guide with workflows and tips
- **[TECHNICAL_DOCS.md](./TECHNICAL_DOCS.md)** — API reference, schema, and developer guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** — Production deployment instructions

---

## 🧪 Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Type checking
npx tsc --noEmit

# Reset database
npx prisma migrate reset
npx prisma generate
```

---

## 📝 License

MIT License — see [LICENSE](LICENSE) file for details.

---

**Built with ❤️ using Next.js, Prisma, and Gemini AI**
