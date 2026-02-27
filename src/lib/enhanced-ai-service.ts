/**
 * Enhanced AI Service for Deep GitHub Analysis and Job-Specific Tailoring
 * 
 * V2 — Multi-pass deep analysis approach:
 * 1. Structural pass: directory tree + configs → project category & tech stack
 * 2. Deep code passes: all source files in chunks → detailed component analysis
 * 3. Synthesis pass: combine all analyses → comprehensive ProjectProfile + fullReport
 * 4. Job-specific tailoring using cached profiles (real-time)
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "./prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Dual model system:
// DEEP_MODEL — best model for first-time deep repo analysis (expensive but thorough)
// FAST_MODEL — cheaper model for cached ops like match/tailor/README parsing
const DEEP_MODEL_NAME = process.env.GEMINI_DEEP_MODEL || "gemini-2.5-flash";
const FAST_MODEL_NAME = process.env.GEMINI_FAST_MODEL || "gemini-2.0-flash";
const deepModel = genAI.getGenerativeModel({ model: DEEP_MODEL_NAME });
const fastModel = genAI.getGenerativeModel({ model: FAST_MODEL_NAME });
// Default model reference for backward compatibility
const model = fastModel;

// ============================================================================
// Types
// ============================================================================

export interface ProjectProfile {
    id: string;
    repoName: string;
    repoUrl: string;
    category?: string;
    masterDescription: string;
    bulletPoints: string[];
    techStack: TechStack;
    architectureNotes?: string;
    metrics: ProjectMetrics;
    problemStatement?: string;
    solutionApproach?: string;
    impact?: string;
    githubData?: any;
    primaryLanguage?: string;
    topics?: string[];
    fullReport?: string;
    lastAnalyzed: Date;
}

export interface TechStack {
    primary: string[];
    secondary: string[];
    proficiency: Record<string, "Expert" | "Advanced" | "Intermediate">;
}

export interface ProjectMetrics {
    stars: number;
    forks: number;
    commits: number;
    contributors: number;
    linesOfCode?: number;
    lastUpdated: string;
}

export interface TailoredProject {
    projectId: string;
    repoName: string;
    relevanceScore: number;
    tailoredBullets: string[];
    matchingSkills: string[];
    whyRelevant: string;
    category?: string;
}

export interface SkillsSection {
    technical: string[];
    tools: string[];
    domains: string[];
}

// ============================================================================
// Code file detection
// ============================================================================

const CODE_EXTENSIONS = new Set([
    '.py', '.ts', '.tsx', '.js', '.jsx', '.java', '.go', '.rs',
    '.cpp', '.c', '.h', '.hpp', '.rb', '.swift', '.kt', '.cs',
    '.scala', '.r', '.m', '.mm', '.lua', '.sh', '.bash', '.zsh',
    '.sql', '.graphql', '.proto', '.yaml', '.yml', '.toml', '.json',
    '.xml', '.html', '.css', '.scss', '.sass', '.less', '.vue', '.svelte',
    '.ipynb', '.md', '.rst', '.jl', '.pl', '.tf', '.dockerfile',
    '.cmake', '.gradle', '.pyx', '.pxd', '.cu', '.cuh',
    '.dart', '.ex', '.exs', '.hs', '.erl', '.clj', '.cfg', '.ini',
    '.env', '.txt', '.csv'
]);

const CONFIG_FILES = new Set([
    'package.json', 'requirements.txt', 'pyproject.toml', 'setup.py', 'setup.cfg',
    'cargo.toml', 'go.mod', 'go.sum', 'build.gradle', 'build.gradle.kts',
    'pom.xml', 'gemfile', 'dockerfile', 'docker-compose.yml', 'docker-compose.yaml',
    '.env.example', 'makefile', 'cmakelists.txt', 'tsconfig.json', 'next.config.js',
    'next.config.mjs', 'vite.config.ts', 'webpack.config.js', 'tailwind.config.ts',
    'tailwind.config.js', 'prisma/schema.prisma', 'angular.json', 'pubspec.yaml',
    'pipfile', 'poetry.lock', 'cargo.lock', 'gradle.properties',
]);

const SKIP_PATTERNS = [
    'node_modules/', 'vendor/', '.min.', 'dist/', 'build/', '__pycache__/',
    '.lock', 'migrations/', '.git/', '.next/', '.cache/', 'coverage/',
    '.egg-info/', 'target/', 'bin/', 'obj/', '.tox/', '.pytest_cache/',
    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', '.DS_Store'
];

// Priority patterns for identifying important source files
const PRIORITY_PATTERNS = [
    /^(main|app|index|server|cli)\./i,
    /^(model|schema|entity|types)s?\./i,
    /(route|endpoint|controller|handler|api)s?\./i,
    /(service|manager|engine|core|processor)s?\./i,
    /(config|settings|constants)\./i,
    /(util|helper|lib|common)s?\./i,
    /(train|predict|inference|pipeline)\./i,
    /(component|page|view|screen)s?\./i,
    /(test|spec)s?\./i,
];

// ============================================================================
// Deep GitHub Analysis (One-Time)
// ============================================================================

/**
 * Performs comprehensive multi-pass AI analysis of a single GitHub repository.
 * Pass 1: Structural analysis (tree + configs + README)
 * Pass 2: Deep code analysis (all source files in chunks)
 * Pass 3: Synthesis (combine everything into comprehensive report)
 */
export async function deepAnalyzeRepo(
    repoOwner: string,
    repoName: string,
    githubToken?: string
): Promise<Omit<ProjectProfile, "id" | "lastAnalyzed">> {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`[deepAnalyze] Starting DEEP analysis for ${repoOwner}/${repoName}`);
    console.log(`${"=".repeat(60)}`);

    // Step 1: Fetch GitHub metadata (required)
    let githubData: any;
    try {
        githubData = await fetchGitHubRepoData(repoOwner, repoName, githubToken);
        console.log(`[deepAnalyze] ✅ GitHub data: ${githubData.language}, ${githubData.stargazers_count} stars`);
    } catch (error) {
        console.error(`[deepAnalyze] ❌ Failed to fetch GitHub data:`, error);
        return await basicAnalysis(repoOwner, repoName, githubToken);
    }

    // Step 2: Fetch README (non-fatal)
    let readmeContent = "";
    try {
        readmeContent = await fetchReadme(repoOwner, repoName, githubToken);
        console.log(`[deepAnalyze] ✅ README: ${readmeContent.length} chars`);
    } catch (error) {
        console.warn(`[deepAnalyze] ⚠️ README fetch failed, continuing`);
    }

    // Step 3: Fetch the FULL repository tree and ALL code files
    let directoryTree = "";
    let configContents = "";
    let codeFileChunks: { path: string; content: string }[][] = [];
    let totalCodeFiles = 0;
    let totalCodeChars = 0;

    try {
        const ctx = await fetchFullRepoContext(
            repoOwner, repoName, githubData.default_branch || "main", githubToken
        );
        directoryTree = ctx.directoryTree;
        configContents = ctx.configContents;
        codeFileChunks = ctx.codeChunks;
        totalCodeFiles = ctx.totalCodeFiles;
        totalCodeChars = ctx.totalCodeChars;
        console.log(`[deepAnalyze] ✅ Full repo context: tree=${directoryTree.length}chars, ` +
            `${totalCodeFiles} code files (${totalCodeChars} chars total), ` +
            `${codeFileChunks.length} chunks, configs=${configContents.length}chars`);
    } catch (error) {
        console.warn(`[deepAnalyze] ⚠️ Repo context fetch failed:`, error);
    }

    // Step 4: Calculate metrics
    let commitCount = 0;
    let contributorCount = 1;
    try {
        [commitCount, contributorCount] = await Promise.all([
            getCommitCount(repoOwner, repoName, githubToken),
            getContributorCount(repoOwner, repoName, githubToken)
        ]);
    } catch { /* Non-fatal */ }

    const metrics: ProjectMetrics = {
        stars: githubData.stargazers_count || 0,
        forks: githubData.forks_count || 0,
        commits: commitCount,
        contributors: contributorCount,
        linesOfCode: totalCodeChars > 0 ? Math.round(totalCodeChars / 40) : githubData.size,
        lastUpdated: githubData.updated_at
    };

    // ==== MULTI-PASS AI ANALYSIS ====
    try {
        // ── PASS 1: Structural Analysis ──────────────────────────────
        console.log(`[deepAnalyze] 🧠 PASS 1: Structural analysis...`);
        const structuralAnalysis = await runStructuralAnalysis(
            repoOwner, repoName, githubData, readmeContent,
            directoryTree, configContents
        );
        console.log(`[deepAnalyze] ✅ Pass 1 complete: category=${structuralAnalysis.category}`);

        // ── PASS 2: Deep Code Analysis (per chunk) ───────────────────
        const codeAnalyses: string[] = [];
        if (codeFileChunks.length > 0) {
            console.log(`[deepAnalyze] 🧠 PASS 2: Deep code analysis (${codeFileChunks.length} chunks)...`);
            for (let i = 0; i < codeFileChunks.length; i++) {
                const chunk = codeFileChunks[i];
                console.log(`[deepAnalyze]   Chunk ${i + 1}/${codeFileChunks.length}: ${chunk.length} files`);
                try {
                    const analysis = await runCodeChunkAnalysis(
                        repoName, structuralAnalysis.category,
                        structuralAnalysis.overview, chunk
                    );
                    codeAnalyses.push(analysis);
                } catch (error) {
                    console.warn(`[deepAnalyze]   ⚠️ Chunk ${i + 1} analysis failed, skipping:`, error);
                }
                // Rate limit between chunks (3s to stay under RPM limit)
                if (i < codeFileChunks.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }
            console.log(`[deepAnalyze] ✅ Pass 2 complete: ${codeAnalyses.length}/${codeFileChunks.length} chunks analyzed`);
        }

        // ── PASS 3: Synthesis ────────────────────────────────────────
        console.log(`[deepAnalyze] 🧠 PASS 3: Synthesis...`);
        const finalProfile = await runSynthesis(
            repoOwner, repoName, githubData,
            structuralAnalysis, codeAnalyses, metrics
        );
        console.log(`[deepAnalyze] ✅ Pass 3 complete. Report length: ${finalProfile.fullReport?.length || 0} chars`);

        return {
            repoName,
            repoUrl: `https://github.com/${repoOwner}/${repoName}`,
            ...finalProfile,
            metrics,
            githubData,
            primaryLanguage: githubData.language,
            topics: githubData.topics
        };

    } catch (error: any) {
        console.error(`[deepAnalyze] ❌ Multi-pass analysis failed:`, error?.message || error);
        console.log(`[deepAnalyze] Falling back to single-pass analysis...`);

        // Fallback to single-pass (like v1, but with more context)
        return await singlePassFallback(
            repoOwner, repoName, githubData, readmeContent,
            directoryTree, configContents, codeFileChunks, metrics, githubToken
        );
    }
}

// ============================================================================
// Multi-Pass Analysis Functions
// ============================================================================

interface StructuralAnalysis {
    category: string;
    overview: string;
    techStack: TechStack;
    architectureNotes: string;
}

/**
 * Pass 1: Structural analysis using directory tree, configs, and README.
 * Determines project category, tech stack, and high-level architecture.
 */
async function runStructuralAnalysis(
    repoOwner: string,
    repoName: string,
    githubData: any,
    readme: string,
    directoryTree: string,
    configContents: string
): Promise<StructuralAnalysis> {
    const prompt = `You are an expert software engineer analyzing a GitHub repository's STRUCTURE to understand its architecture.

Repository: ${repoName} (${repoOwner}/${repoName})
Primary Language: ${githubData.language || "Unknown"}
Description: ${githubData.description || "No description"}
Topics: ${githubData.topics?.join(", ") || "None"}
Stars: ${githubData.stargazers_count || 0} | Forks: ${githubData.forks_count || 0}

--- README ---
${(readme || "(No README)").slice(0, 8000)}

--- DIRECTORY STRUCTURE ---
${(directoryTree || "(Not available)").slice(0, 6000)}

--- CONFIG / DEPENDENCY FILES ---
${(configContents || "(Not available)").slice(0, 8000)}

Based on the structure, configs, and README, provide:
1. **Category**: ONE of: "LLM Engineering", "Computer Vision", "Data Science", "Full-Stack", "Systems Programming", "Mobile Development", "DevOps", "Backend", "Frontend", "Machine Learning", "Other"
2. **Overview**: 3-4 sentence overview of what this project does, its architecture, and approach (be specific based on what you can see)
3. **Tech Stack**: All technologies visible from configs/deps
4. **Architecture Notes**: Design patterns, data flow, system architecture visible from the structure

Respond ONLY with valid JSON, no markdown code blocks:
{
  "category": "...",
  "overview": "...",
  "techStack": {
    "primary": ["..."],
    "secondary": ["..."],
    "proficiency": {"lang": "Expert|Advanced|Intermediate"}
  },
  "architectureNotes": "..."
}`;

    const result = await deepModel.generateContent(prompt);
    const responseText = result.response.text();
    const parsed = extractJSON(responseText);

    return {
        category: parsed.category || "Other",
        overview: parsed.overview || "",
        techStack: parsed.techStack || { primary: [], secondary: [], proficiency: {} },
        architectureNotes: parsed.architectureNotes || ""
    };
}

/**
 * Pass 2: Deep analysis of a chunk of source code files.
 * Extracts specific technical details, algorithms, patterns, and capabilities.
 */
async function runCodeChunkAnalysis(
    repoName: string,
    category: string,
    projectOverview: string,
    files: { path: string; content: string }[]
): Promise<string> {
    const codeBlock = files.map(f =>
        `\n--- ${f.path} ---\n${f.content}`
    ).join("\n");

    const prompt = `You are analyzing source code files from the "${repoName}" project (${category}).

Project context: ${projectOverview}

Here are the source files to analyze IN DETAIL:
${codeBlock}

For EACH file, identify:
- What it does (specific functionality, not generic)
- Key algorithms, data structures, or design patterns used
- External APIs/services integrated
- Important functions/classes and their purpose
- Performance optimizations or interesting engineering decisions
- Error handling and edge case management

Then provide an OVERALL summary of this code chunk:
- Key technical capabilities demonstrated
- How these files connect to each other (data flow, dependencies)
- Specific metrics you can infer (e.g., "handles N API endpoints", "processes X data types")

Be SPECIFIC. Reference exact function names, class names, and variable names from the code.
Write your analysis as a detailed technical paragraph (not JSON). 300-500 words.`;

    const result = await deepModel.generateContent(prompt);
    return result.response.text();
}

/**
 * Pass 3: Synthesize all analyses into a comprehensive ProjectProfile.
 * Combines structural analysis + code analyses into final report + resume bullets.
 */
async function runSynthesis(
    repoOwner: string,
    repoName: string,
    githubData: any,
    structural: StructuralAnalysis,
    codeAnalyses: string[],
    metrics: ProjectMetrics
): Promise<Omit<ProjectProfile, "id" | "lastAnalyzed" | "repoName" | "repoUrl" | "metrics" | "githubData" | "primaryLanguage" | "topics">> {
    const codeAnalysisBlock = codeAnalyses.length > 0
        ? codeAnalyses.map((a, i) => `=== Code Analysis Part ${i + 1} ===\n${a}`).join("\n\n")
        : "(No deep code analysis available)";

    const prompt = `You are an expert technical resume writer creating a COMPREHENSIVE project profile.

Repository: ${repoName}
URL: https://github.com/${repoOwner}/${repoName}
Category: ${structural.category}
Stars: ${metrics.stars} | Forks: ${metrics.forks} | Commits: ${metrics.commits} | Contributors: ${metrics.contributors}
Estimated Lines: ${metrics.linesOfCode || "Unknown"}

--- STRUCTURAL ANALYSIS ---
${structural.overview}

Tech Stack: ${JSON.stringify(structural.techStack)}
Architecture: ${structural.architectureNotes}

--- DEEP CODE ANALYSES ---
${codeAnalysisBlock.slice(0, 15000)}

Using ALL the above information, generate:

1. **masterDescription** (3-4 sentences): A comprehensive professional description that captures the SPECIFIC problem solved, ACTUAL technical approach/architecture, and impact. NOT generic — reference specific technologies and patterns from the code.

2. **bulletPoints** (5-7 bullets): HIGH-QUALITY STAR-format resume bullets:
   - Start with STRONG ACTION VERB (Engineered, Architected, Implemented, Developed, Optimized, Designed, Built, Deployed)
   - Include SPECIFIC technical details from the actual code (exact libraries, algorithms, patterns)
   - Add QUANTIFIABLE METRICS (estimate if needed: "processing 10K+ records", "reducing latency by ~40%")
   - Each bullet demonstrates a different skill
   - Format: "[Verb] [what] using [specific tech], [achieving] [impact]"

3. **problemStatement**: The specific problem this project addresses

4. **solutionApproach**: How it solves it — mention specific algorithms, architectures from the code

5. **impact**: Value provided, scale, who benefits

6. **fullReport**: A comprehensive 4-8 paragraph technical report covering:
   - Project purpose and motivation
   - Architecture and system design
   - Key technical components and how they work
   - Technologies and why they were chosen
   - Notable engineering decisions and patterns
   - Performance characteristics
   - What makes this project technically interesting

7. **techStack**: Refined based on ALL analyses

8. **architectureNotes**: Detailed architecture description

Respond ONLY with valid JSON, no markdown code blocks:
{
  "category": "...",
  "masterDescription": "...",
  "bulletPoints": ["...", "..."],
  "techStack": {"primary": [...], "secondary": [...], "proficiency": {...}},
  "architectureNotes": "...",
  "problemStatement": "...",
  "solutionApproach": "...",
  "impact": "...",
  "fullReport": "..."
}`;

    const result = await deepModel.generateContent(prompt);
    const responseText = result.response.text();
    const analysis = extractJSON(responseText);

    if (!analysis.masterDescription || !analysis.bulletPoints) {
        throw new Error("Synthesis failed: missing required fields");
    }

    return {
        category: analysis.category || structural.category,
        masterDescription: analysis.masterDescription,
        bulletPoints: analysis.bulletPoints,
        techStack: analysis.techStack || structural.techStack,
        architectureNotes: analysis.architectureNotes || structural.architectureNotes,
        problemStatement: analysis.problemStatement,
        solutionApproach: analysis.solutionApproach,
        impact: analysis.impact,
        fullReport: analysis.fullReport
    };
}

/**
 * Fallback: single-pass analysis if multi-pass fails.
 * Uses all available context in one AI call.
 */
async function singlePassFallback(
    repoOwner: string,
    repoName: string,
    githubData: any,
    readmeContent: string,
    directoryTree: string,
    configContents: string,
    codeChunks: { path: string; content: string }[][],
    metrics: ProjectMetrics,
    githubToken?: string
): Promise<Omit<ProjectProfile, "id" | "lastAnalyzed">> {
    // Concatenate first few chunks of code
    const codeContext = codeChunks.slice(0, 2)
        .flat()
        .map(f => `--- ${f.path} ---\n${f.content}`)
        .join("\n")
        .slice(0, 25000);

    const prompt = `You are an expert technical resume writer analyzing a GitHub repository.

Repository: ${repoName}
URL: https://github.com/${repoOwner}/${repoName}
Primary Language: ${githubData.language || "Unknown"}
Description: ${githubData.description || "No description"}
Topics: ${githubData.topics?.join(", ") || "None"}
Stars: ${githubData.stargazers_count || 0} | Forks: ${githubData.forks_count || 0}

--- README ---
${(readmeContent || "(No README)").slice(0, 5000)}

--- DIRECTORY STRUCTURE ---
${(directoryTree || "(Not available)").slice(0, 4000)}

--- CONFIG FILES ---
${(configContents || "(Not available)").slice(0, 4000)}

--- SOURCE CODE ---
${codeContext}

Analyze this project and respond ONLY with valid JSON, no markdown code blocks:
{
  "category": "LLM Engineering|Computer Vision|Data Science|Full-Stack|Backend|Frontend|Other",
  "masterDescription": "2-3 specific sentences about what the project does",
  "bulletPoints": ["STAR-format bullet 1", "bullet 2", "bullet 3", "bullet 4"],
  "techStack": {"primary": [...], "secondary": [...], "proficiency": {"lang": "Expert"}},
  "architectureNotes": "...",
  "problemStatement": "...",
  "solutionApproach": "...",
  "impact": "...",
  "fullReport": "Comprehensive 3-5 paragraph technical report"
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const analysis = extractJSON(responseText);

    if (!analysis.masterDescription || !analysis.bulletPoints) {
        // Last resort: basic analysis
        return await basicAnalysis(repoOwner, repoName, githubToken);
    }

    return {
        repoName,
        repoUrl: `https://github.com/${repoOwner}/${repoName}`,
        category: analysis.category,
        masterDescription: analysis.masterDescription,
        bulletPoints: analysis.bulletPoints,
        techStack: analysis.techStack || { primary: [], secondary: [], proficiency: {} },
        architectureNotes: analysis.architectureNotes,
        metrics,
        problemStatement: analysis.problemStatement,
        solutionApproach: analysis.solutionApproach,
        impact: analysis.impact,
        fullReport: analysis.fullReport,
        githubData,
        primaryLanguage: githubData.language,
        topics: githubData.topics
    };
}

// ============================================================================
// Deep Analyze All Repos
// ============================================================================

/**
 * Analyzes all repositories for a GitHub user.
 * Main entry point for initial sync.
 */
export async function deepAnalyzeAllRepos(
    githubUsername: string,
    userId: string,
    githubToken?: string,
    onProgress?: (current: number, total: number, repoName: string) => void
): Promise<ProjectProfile[]> {
    try {
        const repos = await fetchUserRepos(githubUsername, githubToken);
        console.log(`\n[deepAnalyzeAll] Found ${repos.length} repositories for ${githubUsername}`);

        const profiles: ProjectProfile[] = [];

        for (let i = 0; i < repos.length; i++) {
            const repo = repos[i];
            onProgress?.(i + 1, repos.length, repo.name);

            // Check if already analyzed recently (within 7 days) with v2
            const existing = await prisma.projectProfile.findUnique({
                where: {
                    userId_repoName: {
                        userId,
                        repoName: repo.name
                    }
                }
            });

            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            if (existing && existing.lastAnalyzed > sevenDaysAgo && existing.analysisVersion === "2.0") {
                console.log(`[deepAnalyzeAll] ⏭️ Skipping ${repo.name} (analyzed recently with v2)`);
                profiles.push(existing as any);
                continue;
            }

            const repoOwner = repo.owner?.login || repo.full_name?.split('/')[0] || githubUsername;

            try {
                console.log(`\n[deepAnalyzeAll] 📊 Analyzing ${i + 1}/${repos.length}: ${repo.name}`);
                const analysis = await deepAnalyzeRepo(repoOwner, repo.name, githubToken);

                // Store in database
                const profile = await prisma.projectProfile.upsert({
                    where: {
                        userId_repoName: {
                            userId,
                            repoName: repo.name
                        }
                    },
                    update: {
                        repoUrl: analysis.repoUrl,
                        category: analysis.category,
                        masterDescription: analysis.masterDescription,
                        bulletPoints: JSON.stringify(analysis.bulletPoints),
                        techStack: JSON.stringify(analysis.techStack),
                        architectureNotes: analysis.architectureNotes,
                        metrics: JSON.stringify(analysis.metrics),
                        problemStatement: analysis.problemStatement,
                        solutionApproach: analysis.solutionApproach,
                        impact: analysis.impact,
                        topics: JSON.stringify(analysis.topics),
                        githubData: JSON.stringify(analysis.githubData),
                        primaryLanguage: analysis.primaryLanguage,
                        fullReport: analysis.fullReport,
                        lastAnalyzed: new Date(),
                        analysisVersion: "2.0"
                    },
                    create: {
                        userId,
                        repoName: repo.name,
                        repoUrl: analysis.repoUrl,
                        category: analysis.category,
                        masterDescription: analysis.masterDescription,
                        bulletPoints: JSON.stringify(analysis.bulletPoints),
                        techStack: JSON.stringify(analysis.techStack),
                        architectureNotes: analysis.architectureNotes,
                        metrics: JSON.stringify(analysis.metrics),
                        problemStatement: analysis.problemStatement,
                        solutionApproach: analysis.solutionApproach,
                        impact: analysis.impact,
                        topics: JSON.stringify(analysis.topics),
                        githubData: JSON.stringify(analysis.githubData),
                        primaryLanguage: analysis.primaryLanguage,
                        fullReport: analysis.fullReport,
                        analysisVersion: "2.0"
                    }
                });

                // Also create/update a Project record with rich AI data
                const techStackStr = analysis.techStack.primary.join(", ");
                const outcomesStr = analysis.bulletPoints.join("\n");
                const tagsStr = [
                    analysis.category,
                    ...analysis.techStack.primary,
                    ...(analysis.topics || [])
                ].filter(Boolean).join(", ");

                // Match by multiple formats: full URL, owner/repo, or repo name
                const repoFullName = `${repoOwner}/${repo.name}`;
                const existingProject = await prisma.project.findFirst({
                    where: {
                        userId,
                        OR: [
                            { githubRepo: analysis.repoUrl },
                            { githubRepo: repoFullName },
                            { githubRepo: repo.name },
                            { link: analysis.repoUrl },
                            { link: { contains: repo.name } },
                        ]
                    }
                });

                const projectData = {
                    title: repo.name.replace(/-/g, " ").replace(/_/g, " "),
                    description: analysis.masterDescription,
                    techStack: techStackStr,
                    outcomes: outcomesStr,
                    tags: tagsStr,
                    link: analysis.repoUrl,
                    githubRepo: repoFullName,
                    startDate: repo.created_at ? new Date(repo.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : undefined,
                    endDate: repo.updated_at ? new Date(repo.updated_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : undefined,
                };

                if (existingProject) {
                    console.log(`[deepAnalyzeAll] 📝 Updating existing project: ${existingProject.id} (${existingProject.title})`);
                    await prisma.project.update({
                        where: { id: existingProject.id },
                        data: projectData
                    });
                } else {
                    console.log(`[deepAnalyzeAll] ➕ Creating new project for ${repo.name}`);
                    await prisma.project.create({
                        data: {
                            userId,
                            source: "github",
                            highlight: true,
                            ...projectData
                        }
                    });
                }

                profiles.push(profile as any);
            } catch (error) {
                console.error(`[deepAnalyzeAll] ❌ Failed to analyze ${repo.name}, skipping:`, error);
            }

            // Rate limiting between repos (4s to stay under free-tier limits)
            await new Promise(resolve => setTimeout(resolve, 4000));
        }

        return profiles;
    } catch (error) {
        console.error("Error in deepAnalyzeAllRepos:", error);
        throw error;
    }
}

// ============================================================================
// Job-Specific Tailoring (Real-Time)
// ============================================================================

/**
 * Selects and tailors projects for a specific job description.
 * Uses cached ProjectProfile data + lightweight AI call for tailoring.
 */
export async function selectAndTailorProjects(
    jobDescription: string,
    allProjects: ProjectProfile[],
    maxProjects: number = 4
): Promise<TailoredProject[]> {
    try {
        const prompt = `You are an expert resume consultant selecting and tailoring projects for a job application.

Job Description:
${jobDescription}

Available Projects (${allProjects.length} total):
${allProjects.map((p, i) => `
${i + 1}. ${p.repoName}
   Category: ${p.category || "Uncategorized"}
   Description: ${p.masterDescription}
   Tech Stack: ${JSON.stringify(p.techStack)}
   Key Points: ${p.bulletPoints.slice(0, 3).join("; ")}
   Problem: ${p.problemStatement || "N/A"}
   Impact: ${p.impact || "N/A"}
   Metrics: Stars=${p.metrics.stars}, Commits=${p.metrics.commits}
`).join("\n")}

Select the TOP ${maxProjects} most relevant projects. For each:
1. Tailor the bullet points to emphasize job-relevant aspects
2. Each tailored bullet should use STAR format with action verbs and metrics
3. Identify which job skills each project demonstrates

Respond ONLY with valid JSON:
{
  "selectedProjects": [
    {
      "repoName": "...",
      "relevanceScore": 95,
      "tailoredBullets": [
        "Engineered a high-performance RAG pipeline...",
        "Implemented vector search achieving 90% accuracy...",
        "Optimized for production with 2x speedup..."
      ],
      "matchingSkills": ["Python", "Machine Learning"],
      "whyRelevant": "One sentence on why this project is perfect for this role"
    }
  ]
}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const response = extractJSON(responseText);

        if (!response.selectedProjects || !Array.isArray(response.selectedProjects)) {
            throw new Error("Invalid response format");
        }

        return response.selectedProjects.map((sp: any) => ({
            projectId: allProjects.find(p => p.repoName === sp.repoName)?.id || "",
            repoName: sp.repoName,
            relevanceScore: sp.relevanceScore,
            tailoredBullets: sp.tailoredBullets,
            matchingSkills: sp.matchingSkills,
            whyRelevant: sp.whyRelevant,
            category: allProjects.find(p => p.repoName === sp.repoName)?.category
        }));

    } catch (error) {
        console.error("Error in selectAndTailorProjects:", error);

        // Fallback: return top projects by stars
        return allProjects
            .sort((a, b) => b.metrics.stars - a.metrics.stars)
            .slice(0, maxProjects)
            .map(p => ({
                projectId: p.id,
                repoName: p.repoName,
                relevanceScore: 50,
                tailoredBullets: p.bulletPoints,
                matchingSkills: p.techStack.primary,
                whyRelevant: "Selected based on project popularity",
                category: p.category
            }));
    }
}

/**
 * Extracts job-specific skills from projects and job description.
 */
export async function extractJobSpecificSkills(
    jobDescription: string,
    selectedProjects: TailoredProject[]
): Promise<SkillsSection> {
    try {
        const prompt = `Extract and organize skills for a resume based on this job and selected projects.

Job Description:
${jobDescription}

Selected Projects:
${selectedProjects.map(p => `- ${p.repoName}: ${p.matchingSkills.join(", ")}`).join("\n")}

Respond ONLY with valid JSON:
{
  "technical": ["Python", "Machine Learning", "PyTorch"],
  "tools": ["Git", "Docker", "AWS"],
  "domains": ["Computer Vision", "NLP"]
}

Rules:
- Only include skills the candidate actually has (from projects)
- Prioritize skills in the job description
- Use industry-standard terminology`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        return extractJSON(responseText);

    } catch (error) {
        console.error("Error in extractJobSpecificSkills:", error);
        const allSkills = selectedProjects.flatMap(p => p.matchingSkills);
        return {
            technical: Array.from(new Set(allSkills)),
            tools: [],
            domains: []
        };
    }
}

// ============================================================================
// GitHub API Helpers
// ============================================================================

async function fetchGitHubRepoData(owner: string, repo: string, token?: string) {
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (!response.ok) throw new Error(`GitHub API error: ${response.statusText}`);
    return response.json();
}

async function fetchReadme(owner: string, repo: string, token?: string): Promise<string> {
    try {
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers });
        if (!response.ok) return "";
        const data = await response.json();
        const content = Buffer.from(data.content, "base64").toString("utf-8");
        return content.slice(0, 10000); // Generous limit for README
    } catch {
        return "";
    }
}

interface FullRepoContext {
    directoryTree: string;
    configContents: string;
    codeChunks: { path: string; content: string }[][];
    totalCodeFiles: number;
    totalCodeChars: number;
}

/**
 * Fetches the COMPLETE repository context:
 * - Full directory tree
 * - All config/dependency files
 * - ALL code files, grouped into chunks for multi-pass analysis
 */
async function fetchFullRepoContext(
    owner: string,
    repo: string,
    branch: string = "main",
    token?: string
): Promise<FullRepoContext> {
    try {
        const headers: HeadersInit = {
            'Accept': 'application/vnd.github.v3+json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        };

        // 1. Fetch full repository tree recursively
        const treeResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
            { headers }
        );

        if (!treeResponse.ok) {
            if (branch === "main") {
                return fetchFullRepoContext(owner, repo, "master", token);
            }
            return { directoryTree: "", configContents: "", codeChunks: [], totalCodeFiles: 0, totalCodeChars: 0 };
        }

        const treeData = await treeResponse.json();
        const allFiles: Array<{ path: string; size: number; type: string; url: string }> =
            treeData.tree || [];

        // 2. Build directory tree
        const directoryTree = buildDirectoryTree(allFiles);

        // 3. Identify config files and fetch them
        const configFiles = allFiles.filter(f =>
            f.type === "blob" && CONFIG_FILES.has(f.path.split('/').pop()?.toLowerCase() || "")
        );
        const configContents = await fetchFileContentsAsString(
            configFiles.slice(0, 6), owner, repo, token, 4000
        );

        // 4. Identify ALL code files (excluding vendored/generated)
        const codeFiles = allFiles.filter(f => {
            if (f.type !== "blob") return false;
            const ext = '.' + (f.path.split('.').pop()?.toLowerCase() || "");
            if (!CODE_EXTENSIONS.has(ext)) return false;
            const lowerPath = f.path.toLowerCase();
            if (SKIP_PATTERNS.some(p => lowerPath.includes(p))) return false;
            return true;
        });

        // 5. Rank code files by importance
        const rankedFiles = rankCodeFiles(codeFiles);

        // 6. Fetch ALL code files (not just 10!)
        // Limit to 60 files max for very large repos, but that's still 6x more than before
        const filesToFetch = rankedFiles.slice(0, 60);
        console.log(`[fetchFullRepo] Fetching ${filesToFetch.length} code files (of ${codeFiles.length} total)...`);

        const fetchedFiles = await fetchFileContentsStructured(
            filesToFetch, owner, repo, token, 8000  // 8K chars per file (up from 3K)
        );

        // 7. Group files into chunks for multi-pass analysis
        // Each chunk should be ~20K-25K chars for Gemini's context
        const codeChunks = chunkCodeFiles(fetchedFiles, 25000);

        const totalCodeChars = fetchedFiles.reduce((sum, f) => sum + f.content.length, 0);

        return {
            directoryTree,
            configContents,
            codeChunks,
            totalCodeFiles: fetchedFiles.length,
            totalCodeChars
        };

    } catch (error) {
        console.error(`Error fetching repo context for ${owner}/${repo}:`, error);
        return { directoryTree: "", configContents: "", codeChunks: [], totalCodeFiles: 0, totalCodeChars: 0 };
    }
}

/**
 * Groups code files into chunks that fit within token limits.
 */
function chunkCodeFiles(
    files: { path: string; content: string }[],
    maxCharsPerChunk: number
): { path: string; content: string }[][] {
    const chunks: { path: string; content: string }[][] = [];
    let currentChunk: { path: string; content: string }[] = [];
    let currentSize = 0;

    for (const file of files) {
        const fileSize = file.path.length + file.content.length + 20; // overhead
        if (currentSize + fileSize > maxCharsPerChunk && currentChunk.length > 0) {
            chunks.push(currentChunk);
            currentChunk = [];
            currentSize = 0;
        }
        currentChunk.push(file);
        currentSize += fileSize;
    }

    if (currentChunk.length > 0) {
        chunks.push(currentChunk);
    }

    return chunks;
}

/**
 * Builds a visual directory tree string from the file list.
 */
function buildDirectoryTree(
    files: Array<{ path: string; type: string }>
): string {
    const lines: string[] = [];
    const dirs = new Set<string>();

    for (const f of files) {
        const parts = f.path.split('/');
        for (let i = 1; i < parts.length; i++) {
            dirs.add(parts.slice(0, i).join('/'));
        }
    }

    const allEntries = [
        ...Array.from(dirs).map(d => ({ path: d, isDir: true })),
        ...files.filter(f => f.type === 'blob').map(f => ({ path: f.path, isDir: false }))
    ].sort((a, b) => a.path.localeCompare(b.path));

    // Show up to 120 entries (up from 80)
    for (const entry of allEntries.slice(0, 120)) {
        const depth = entry.path.split('/').length - 1;
        const name = entry.path.split('/').pop();
        const prefix = '  '.repeat(depth);
        lines.push(`${prefix}${entry.isDir ? '📁 ' : '📄 '}${name}`);
    }

    if (allEntries.length > 120) {
        lines.push(`... and ${allEntries.length - 120} more files`);
    }

    return lines.join('\n');
}

/**
 * Ranks code files by importance for analysis.
 */
function rankCodeFiles(
    files: Array<{ path: string; size: number }>
): Array<{ path: string; size: number }> {
    return files
        .map(f => {
            const filename = f.path.split('/').pop() || "";
            let priority = 100;

            for (let i = 0; i < PRIORITY_PATTERNS.length; i++) {
                if (PRIORITY_PATTERNS[i].test(filename)) {
                    priority = i * 10;
                    break;
                }
            }

            const depth = f.path.split('/').length;
            priority += depth * 3;

            if (f.size < 50) priority += 80;
            if (f.size > 80000) priority += 40;

            return { ...f, priority };
        })
        .sort((a, b) => (a as any).priority - (b as any).priority);
}

/**
 * Fetches file contents as a concatenated string (for configs).
 */
async function fetchFileContentsAsString(
    files: Array<{ path: string }>,
    owner: string,
    repo: string,
    token?: string,
    maxCharsPerFile: number = 4000
): Promise<string> {
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    let result = "";

    for (const file of files) {
        try {
            const response = await fetch(
                `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${file.path}`,
                { headers }
            );
            if (!response.ok) continue;

            const content = await response.text();
            const truncated = content.slice(0, maxCharsPerFile);
            result += `\n--- ${file.path} ---\n`;
            result += truncated;
            if (content.length > maxCharsPerFile) {
                result += `\n... (truncated from ${content.length} chars)`;
            }
            result += '\n';
        } catch {
            // Skip files that can't be fetched
        }
    }

    return result;
}

/**
 * Fetches file contents as structured array (for code analysis).
 * Fetches in batches to avoid rate limits.
 */
async function fetchFileContentsStructured(
    files: Array<{ path: string }>,
    owner: string,
    repo: string,
    token?: string,
    maxCharsPerFile: number = 8000
): Promise<{ path: string; content: string }[]> {
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    const results: { path: string; content: string }[] = [];
    const batchSize = 10;

    for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);

        const batchResults = await Promise.all(
            batch.map(async (file) => {
                try {
                    const response = await fetch(
                        `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${file.path}`,
                        { headers }
                    );
                    if (!response.ok) return null;

                    const content = await response.text();
                    return {
                        path: file.path,
                        content: content.slice(0, maxCharsPerFile)
                    };
                } catch {
                    return null;
                }
            })
        );

        results.push(...batchResults.filter(Boolean) as { path: string; content: string }[]);

        // Small delay between batches
        if (i + batchSize < files.length) {
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }

    return results;
}

async function fetchUserRepos(username: string, token?: string) {
    try {
        const headers: HeadersInit = {
            'Accept': 'application/vnd.github.v3+json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const url = token
            ? `https://api.github.com/user/repos?per_page=100&affiliation=owner`
            : `https://api.github.com/users/${username}/repos?per_page=100`;

        console.log(`Fetching repos from: ${url.replace(token || '', 'TOKEN')}`);

        const response = await fetch(url, { headers });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`GitHub API error (${response.status}):`, errorBody);
            throw new Error(`GitHub API error: ${response.statusText} (${response.status})`);
        }

        const repos = await response.json();
        console.log(`Successfully fetched ${repos.length} repositories`);

        return repos;
    } catch (error) {
        console.error('Error in fetchUserRepos:', error);
        throw error;
    }
}

async function getCommitCount(owner: string, repo: string, token?: string): Promise<number> {
    try {
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`, { headers });
        const linkHeader = response.headers.get("Link");
        if (linkHeader) {
            const match = linkHeader.match(/page=(\d+)>; rel="last"/);
            return match ? parseInt(match[1]) : 1;
        }
        return 1;
    } catch {
        return 0;
    }
}

async function getContributorCount(owner: string, repo: string, token?: string): Promise<number> {
    try {
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=1`, { headers });
        const linkHeader = response.headers.get("Link");
        if (linkHeader) {
            const match = linkHeader.match(/page=(\d+)>; rel="last"/);
            return match ? parseInt(match[1]) : 1;
        }
        return 1;
    } catch {
        return 1;
    }
}

// ============================================================================
// Utility Helpers
// ============================================================================

/**
 * Extracts JSON from AI response text, handling various formats.
 */
function extractJSON(text: string): any {
    // Try code block format first
    const codeBlockMatch = text.match(/```(?:json)?\s*\n([\s\S]*?)\n\s*```/);
    if (codeBlockMatch) {
        try { return JSON.parse(codeBlockMatch[1]); } catch { }
    }

    // Try raw JSON
    const jsonMatch = text.match(/(\{[\s\S]*\})/);
    if (jsonMatch) {
        try { return JSON.parse(jsonMatch[1]); } catch { }
    }

    // Try to fix common issues (trailing commas, etc.)
    const cleaned = text
        .replace(/```json\s*\n?/g, '')
        .replace(/```\s*$/g, '')
        .replace(/,\s*([}\]])/g, '$1')
        .trim();

    try { return JSON.parse(cleaned); } catch { }

    throw new Error(`Failed to extract JSON from response (${text.length} chars). Preview: ${text.slice(0, 300)}`);
}

/**
 * Basic analysis fallback when everything else fails.
 */
async function basicAnalysis(owner: string, repo: string, token?: string): Promise<Omit<ProjectProfile, "id" | "lastAnalyzed">> {
    console.log(`[basicAnalysis] Generating fallback for ${owner}/${repo}`);
    let githubData: any;
    try {
        githubData = await fetchGitHubRepoData(owner, repo, token);
    } catch {
        githubData = { language: null, description: null, topics: [], stargazers_count: 0, forks_count: 0, updated_at: new Date().toISOString() };
    }
    const readme = await fetchReadme(owner, repo, token);

    const lang = githubData.language || "various technologies";
    const desc = githubData.description || "";
    const topics: string[] = githubData.topics || [];
    const stars = githubData.stargazers_count || 0;
    const forks = githubData.forks_count || 0;

    let readmeDescription = "";
    const readmeBullets: string[] = [];
    if (readme) {
        const lines = readme.split("\n");
        let foundTitle = false;
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("#")) { foundTitle = true; continue; }
            if (foundTitle && trimmed && !trimmed.startsWith("##") && !readmeDescription) {
                readmeDescription = trimmed.slice(0, 300);
            }
            if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                const bullet = trimmed.replace(/^[-*]\s*/, "").trim();
                if (bullet.length > 15 && readmeBullets.length < 4) {
                    readmeBullets.push(bullet);
                }
            }
        }
    }

    const masterDescription = desc || readmeDescription || `A ${lang} project hosted on GitHub`;

    const bulletPoints: string[] = [];
    if (readmeBullets.length > 0) {
        readmeBullets.forEach(b => bulletPoints.push(`Implemented ${b}`));
    }
    if (bulletPoints.length === 0) {
        bulletPoints.push(`Developed ${repo.replace(/-/g, " ").replace(/_/g, " ")} using ${lang}`);
    }
    if (topics.length > 0) {
        bulletPoints.push(`Applied ${topics.slice(0, 4).join(", ")} technologies`);
    }
    if (stars > 0 || forks > 0) {
        bulletPoints.push(`Achieved ${stars} stars and ${forks} forks on GitHub`);
    }

    return {
        repoName: repo,
        repoUrl: `https://github.com/${owner}/${repo}`,
        category: "Other",
        masterDescription,
        bulletPoints,
        techStack: {
            primary: lang !== "various technologies" ? [lang] : [],
            secondary: topics.filter(t => !t.includes("-")).slice(0, 5),
            proficiency: lang !== "various technologies" ? { [lang]: "Intermediate" } : {}
        },
        architectureNotes: undefined,
        metrics: {
            stars,
            forks,
            commits: 0,
            contributors: 1,
            lastUpdated: githubData.updated_at
        },
        problemStatement: desc ? `This project addresses: ${desc}` : undefined,
        solutionApproach: `Built using ${lang}${topics.length > 0 ? ` with focus on ${topics.slice(0, 3).join(", ")}` : ""}`,
        impact: stars > 0 ? `Open source project with ${stars} stars and ${forks} forks` : `Open source ${lang} project`,
        fullReport: undefined,
        githubData,
        primaryLanguage: githubData.language,
        topics: githubData.topics
    };
}

// ============================================================================
// README Auto-Fill (uses fast model)
// ============================================================================

/**
 * Analyze a README file and extract structured project data.
 * Uses the fast model since this is a lightweight single-pass operation.
 */
export async function analyzeReadme(readmeContent: string): Promise<{
    title: string;
    description: string;
    techStack: string;
    outcomes: string;
    tags: string;
    role: string;
}> {
    const prompt = `Analyze this README and extract structured project information for a resume.

README CONTENT:
${readmeContent.slice(0, 12000)}

Return a JSON object with these fields:
{
  "title": "Project name (cleaned up, human-readable, no dashes/underscores)",
  "description": "2-3 sentence technical description of what the project does, its purpose, and key innovation. Write for a resume — be specific about the problem solved and approach used.",
  "techStack": "Comma-separated list of technologies, frameworks, and languages used (e.g. Python, PyTorch, React, PostgreSQL)",
  "outcomes": "3-5 resume bullet points, one per line. Each should start with an ACTION VERB and include specific technical details. Format: one bullet per line, no bullet characters.",
  "tags": "Comma-separated tags for job matching (e.g. machine learning, web development, data engineering, computer vision)",
  "role": "Likely role for this project (e.g. Full-Stack Developer, ML Engineer, Data Scientist, Backend Developer)"
}

RULES for outcomes bullets:
- Start each with a strong action verb (Engineered, Developed, Architected, Implemented, Designed, Built, Optimized)
- Include specific technical terms, frameworks, algorithms
- Mention quantitative results if available from the README
- Write 3-5 bullets, one per line (NO bullet characters, NO numbering)

Return ONLY the JSON object, no markdown formatting.`;

    try {
        const result = await fastModel.generateContent(prompt);
        const responseText = result.response.text();
        const parsed = extractJSON(responseText);

        return {
            title: parsed.title || "Untitled Project",
            description: parsed.description || "",
            techStack: parsed.techStack || "",
            outcomes: parsed.outcomes || "",
            tags: parsed.tags || "",
            role: parsed.role || "",
        };
    } catch (error) {
        console.error("[analyzeReadme] Failed:", error);
        throw new Error("Failed to analyze README content");
    }
}

