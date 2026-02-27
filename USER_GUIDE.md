# User Guide

> Complete guide to using the AI-Powered Resume Builder.

---

## Getting Started

### 1. Create an Account

**Option A: GitHub Sign-In (Recommended)**
1. Go to `http://localhost:3000/auth/signin`
2. Click **"Sign in with GitHub"**
3. Authorize the application
4. You're ready to import projects

**Option B: Email/Password**
1. Go to `http://localhost:3000/auth/signup`
2. Enter your name, email, and password
3. Sign in at `/auth/signin`

> **Tip:** Sign in with GitHub to unlock project import and AI analysis features.

### 2. Complete Your Profile

Navigate to **Settings** (`/dashboard/settings`) and fill in:
- Full name, email, phone, location
- LinkedIn URL and personal website
- Professional summary
- Education details
- Skills (comma-separated)

This information appears in your resume header and skills section.

---

## Projects

### Adding Projects Manually

1. Go to **Projects** → **+ Add Project**
2. Fill in: title, description, tech stack, role, dates, link, outcomes
3. Check **"Include in resume by default"** for projects you want in every resume
4. Click **Save**

### Importing from GitHub

1. Go to **Projects** → **Import from GitHub**
2. Browse your repositories (searchable)
3. Select the repos you want to import
4. *(Optional)* Check **"Enable AI analysis"** for intelligent descriptions
5. Click **Import Selected**

**What gets imported:**
- Project title (from repo name)
- Description (from README)
- Tech stack (from language breakdown)
- Outcomes (from README features/commit messages)
- Start/end dates (from repo creation/update dates)
- GitHub link

**Deduplication:** Re-importing the same repo updates the existing project instead of creating a duplicate.

### Generating an AI Project Report

This is the most powerful feature. For any project with a GitHub link:

1. Open the project (click it in the project list)
2. Scroll down past the edit form
3. Click **"✨ Generate AI Report"** (or **"🔄 Re-analyze with AI"** to refresh)
4. Wait 30–60 seconds

**What the AI analyzes:**
- Full README content
- Directory structure (every file and folder)
- Top 10 most important source files (ranked by relevance)
- Dependency/config files (package.json, requirements.txt, etc.)
- GitHub metadata (stars, forks, language, topics)

**What you get:**

| Section | Description |
|---|---|
| **📋 Description** | 2–3 sentence professional summary |
| **🎯 Problem Statement** | What specific problem the project solves |
| **💡 Solution Approach** | How it solves it — specific algorithms and architectures |
| **📈 Impact** | Value provided, scale, who benefits |
| **🔹 Resume Bullets** | 4–6 STAR-format bullets with action verbs and metrics |
| **🛠 Tech Stack** | Primary + secondary technologies with proficiency levels |
| **🏗 Architecture** | Design patterns and system architecture |
| **📊 Metrics** | Stars, forks, commits, contributors |
| **🏷 Topics** | GitHub topics |

**Shallow analysis warning:** If a project shows ⚠️ "This is a shallow analysis", click Re-analyze to generate a proper report.

> **Tip:** For projects without a GitHub link, add the URL in the **Link** field first, then click Generate AI Report.

---

## Work Experience

### Adding Experiences

1. Go to **Experience** → **+ Add Experience**
2. Fill in: company, position, location, dates
3. Add:
   - **Description** — brief role summary
   - **Responsibilities** — key duties (one per line)
   - **Achievements** — notable accomplishments (one per line)
   - **Tech Stack** — technologies used
4. Click **Save**

---

## Jobs

### Saving Job Descriptions

1. Go to **Jobs** → **+ Add Job**
2. Enter: title, company, location, description, requirements, preferred skills
3. Set status: Active, Applied, or Closed
4. Click **Save**

Saved jobs are used for project matching and resume tailoring.

---

## Building a Resume

### Step-by-Step

1. Go to **Build** → **Build New Resume**
2. **Paste a job description** — this drives the entire resume
3. Click **Match Projects** — the system ranks your projects by relevance
4. **Review matches:**
   - See relevance scores (0–100%)
   - AI-tailored bullet points for each project
   - Matched skills highlighted
5. **Select projects** to include (top matches pre-selected)
6. **Select experiences** to include
7. **Choose a template:**
   - Modern (professional, default)
   - Classic (traditional)
   - Technical (skills-focused)
   - Minimal (concise)
   - Student (education-first)
8. **Set page limit** (1 or 2 pages)
9. Click **Generate Resume** → **Download DOCX**

### ATS Scoring

After building a resume, check its ATS compatibility:

1. Go to **Build** → **ATS Score**
2. Paste your resume content
3. Paste the job description
4. Get scored on:
   - **Formatting** (30 points) — structure and readability
   - **Keywords** (40 points) — keyword match percentage
   - **Content** (30 points) — quality and specificity
5. Review actionable feedback to improve your score

---

## Dashboard

The dashboard (`/dashboard`) shows:
- Quick stats (projects, experiences, jobs, resumes generated)
- Recent activity
- Navigation to all sections

### GitHub Project Profiles

If you've signed in with GitHub, you'll see a **GitHub Project Profiles** section with a **Sync Now** button that runs deep analysis on all your repos at once.

---

## Tips & Best Practices

### For Better AI Reports
- **Keep your READMEs detailed** — the AI reads them for context
- **Use descriptive commit messages** — they inform the analysis
- **Include a requirements.txt / package.json** — helps identify tech stack
- Projects with more code and documentation produce richer reports

### For Better Resume Matching
- **Paste the full job description** — the more context, the better the matching
- **Add specific outcomes** to each project (metrics, numbers, percentages)
- **Use industry-standard terminology** in project descriptions
- **Tag projects** with relevant keywords

### For ATS Compatibility
- Use the Modern or Student template (most ATS-friendly)
- Limit to 1 page for entry-level, 2 pages for experienced
- Include exact keywords from the job description
- Avoid graphics, tables, or unusual formatting

---

## Troubleshooting

### "GitHub not connected"
You need to sign in with GitHub OAuth. Go to `/auth/signin` and click "Sign in with GitHub".

### AI Report shows shallow analysis
The AI analysis may have failed on the first attempt. Click **"🔄 Re-analyze with AI"** to regenerate.

### "No GitHub URL found" on Analyze
The project needs a GitHub URL in the **Link** field. Edit the project, add the GitHub URL, save, then click Generate AI Report.

### Duplicate projects after re-import
This is now fixed. Re-importing the same repo will update the existing project instead of creating a duplicate. If you have old duplicates, manually delete them from the project list.

### AI analysis takes too long
Each project analysis takes 30–60 seconds. If it times out, try again — the system retries automatically.
