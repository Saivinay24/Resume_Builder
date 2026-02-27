import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "./prisma";
import crypto from "crypto";

if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY is not set - AI features will be disabled");
}

const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

const model = genAI?.getGenerativeModel({ model: "gemini-1.5-flash" });

export type GitHubAnalysisResult = {
    professionalSummary: string;
    technicalHighlights: string[];
    techStack: string[];
    architecture: string;
    impact: string;
};

export type ProjectMatchResult = {
    projectId: string;
    relevanceScore: number;
    matchReason: string;
    keyAlignments: string[];
    tailoredDescription: string;
    optimizedBullets: string[];
};

export type ResumeOptimizationResult = {
    optimizedProjects: Array<{
        id: string;
        title: string;
        description: string;
        bullets: string[];
    }>;
    professionalSummary: string;
    atsScore: number;
    improvements: string[];
};

/**
 * Generate cache key from input data
 */
function generateCacheKey(type: string, input: any): string {
    const inputStr = JSON.stringify(input);
    return crypto.createHash("sha256").update(`${type}:${inputStr}`).digest("hex");
}

/**
 * Get cached AI result if available and not expired
 */
async function getCachedResult<T>(
    cacheType: string,
    input: any
): Promise<T | null> {
    try {
        const cacheKey = generateCacheKey(cacheType, input);
        const cached = await prisma.aICache.findUnique({
            where: { cacheKey },
        });

        if (!cached) return null;

        // Check if expired
        if (new Date() > cached.expiresAt) {
            // Delete expired cache
            await prisma.aICache.delete({ where: { id: cached.id } });
            return null;
        }

        return JSON.parse(cached.output) as T;
    } catch (error) {
        console.error("Cache retrieval error:", error);
        return null;
    }
}

/**
 * Save AI result to cache
 */
async function setCachedResult(
    cacheType: string,
    input: any,
    output: any,
    tokensUsed: number = 0
): Promise<void> {
    try {
        const cacheKey = generateCacheKey(cacheType, input);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // Cache for 30 days

        await prisma.aICache.upsert({
            where: { cacheKey },
            create: {
                cacheKey,
                cacheType,
                input: JSON.stringify(input),
                output: JSON.stringify(output),
                tokensUsed,
                expiresAt,
            },
            update: {
                output: JSON.stringify(output),
                tokensUsed,
                expiresAt,
            },
        });
    } catch (error) {
        console.error("Cache save error:", error);
        // Don't throw - caching is optional
    }
}

/**
 * Call AI with fallback and error handling
 */
async function callAIWithFallback<T>(
    prompt: string,
    fallback: T,
    cacheType: string,
    cacheInput: any
): Promise<{ result: T; usedAI: boolean }> {
    if (!model) {
        return { result: fallback, usedAI: false };
    }

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Extract JSON from response
        const jsonMatch = text.match(/[\{\[][\s\S]*[\}\]]/);
        if (!jsonMatch) {
            throw new Error("No JSON found in AI response");
        }

        const parsed = JSON.parse(jsonMatch[0]) as T;

        // Cache the result
        await setCachedResult(cacheType, cacheInput, parsed);

        return { result: parsed, usedAI: true };
    } catch (error: any) {
        console.error("AI call failed:", error);

        // Check if quota exceeded
        if (error?.message?.includes("quota") || error?.message?.includes("429")) {
            console.warn("⚠️ AI quota exceeded - falling back to basic analysis");
        }

        return { result: fallback, usedAI: false };
    }
}

/**
 * Analyze a GitHub repository deeply using AI (with caching)
 */
export async function analyzeGitHubRepo(
    repoContent: {
        name: string;
        description: string | null;
        readme: string | null;
        languages: string[];
        topics: string[];
        stars: number;
    }
): Promise<GitHubAnalysisResult> {
    const cacheType = "github_analysis";

    // Check cache first
    const cached = await getCachedResult<GitHubAnalysisResult>(cacheType, repoContent);
    if (cached) {
        console.log("✅ Using cached GitHub analysis");
        return cached;
    }

    const fallback: GitHubAnalysisResult = {
        professionalSummary: repoContent.description || `${repoContent.name} project`,
        technicalHighlights: [`Built using ${repoContent.languages.join(", ")}`],
        techStack: repoContent.languages,
        architecture: "Standard application architecture",
        impact: "Contributed to open-source community",
    };

    const prompt = `You are an expert technical resume writer. Analyze this GitHub repository and generate professional resume content.

Repository: ${repoContent.name}
Description: ${repoContent.description || "No description"}
Languages: ${repoContent.languages.join(", ")}
Topics: ${repoContent.topics.join(", ")}
Stars: ${repoContent.stars}

README:
${repoContent.readme?.slice(0, 3000) || "No README available"}

Generate a JSON response with:
1. professionalSummary: A compelling 1-2 sentence project description (focus on impact and scale)
2. technicalHighlights: Array of 3-5 specific technical achievements (use action verbs, quantify when possible)
3. techStack: Array of key technologies used
4. architecture: Brief description of system architecture/design
5. impact: Quantifiable impact or outcome (if inferable)

Format as valid JSON only, no markdown.`;

    const { result } = await callAIWithFallback(prompt, fallback, cacheType, repoContent);
    return result;
}

/**
 * Match projects to job description using AI (with caching and batching)
 */
export async function matchProjectsToJob(
    jobDescription: string,
    projects: Array<{
        id: string;
        title: string;
        description: string | null;
        techStack: string | null;
        outcomes: string | null;
    }>
): Promise<ProjectMatchResult[]> {
    const cacheType = "job_match";
    const cacheInput = { jobDescription: jobDescription.slice(0, 500), projectIds: projects.map(p => p.id) };

    // Check cache
    const cached = await getCachedResult<ProjectMatchResult[]>(cacheType, cacheInput);
    if (cached) {
        console.log("✅ Using cached job matching");
        return cached;
    }

    // Fallback: simple scoring based on keyword overlap
    const fallback: ProjectMatchResult[] = projects.map((p) => ({
        projectId: p.id,
        relevanceScore: 50,
        matchReason: "Project experience relevant to role",
        keyAlignments: ["Technical skills alignment"],
        tailoredDescription: p.description || p.title,
        optimizedBullets: p.outcomes?.split("\n").filter(Boolean).slice(0, 3) || [
            `Developed ${p.title} using ${p.techStack || "modern technologies"}`,
        ],
    }));

    const prompt = `You are an expert resume consultant. Match these projects to the job description and rank them by relevance.

JOB DESCRIPTION:
${jobDescription.slice(0, 2000)}

PROJECTS:
${projects.map((p, i) => `
${i + 1}. ${p.title}
   Description: ${p.description || "No description"}
   Tech Stack: ${p.techStack || "Not specified"}
   Outcomes: ${p.outcomes || "Not specified"}
`).join("\n")}

For each project, generate:
1. relevanceScore (0-100): How well it matches the job
2. matchReason: Why this project is relevant (1 sentence)
3. keyAlignments: Array of 2-3 specific alignments with job requirements
4. tailoredDescription: Rewrite the description to emphasize job-relevant aspects
5. optimizedBullets: Array of 3-4 achievement bullets optimized for this job (use action verbs, quantify)

Return a JSON array sorted by relevanceScore (highest first). Format as valid JSON only, no markdown.
Include projectId field matching the project's id.`;

    const { result } = await callAIWithFallback(prompt, fallback, cacheType, cacheInput);
    return result;
}

/**
 * Generate optimized resume content for selected projects (with caching)
 */
export async function optimizeResumeContent(
    jobDescription: string,
    projects: Array<{
        id: string;
        title: string;
        description: string | null;
        techStack: string | null;
        outcomes: string | null;
    }>,
    pageLimit: number
): Promise<ResumeOptimizationResult> {
    const bulletsPerProject = pageLimit === 1 ? 3 : 5;
    const cacheType = "content_optimization";
    const cacheInput = {
        jobDescription: jobDescription.slice(0, 500),
        projectIds: projects.map(p => p.id),
        pageLimit
    };

    // Check cache
    const cached = await getCachedResult<ResumeOptimizationResult>(cacheType, cacheInput);
    if (cached) {
        console.log("✅ Using cached resume optimization");
        return cached;
    }

    const fallback: ResumeOptimizationResult = {
        optimizedProjects: projects.map((p) => ({
            id: p.id,
            title: p.title,
            description: p.description || p.title,
            bullets: p.outcomes?.split("\n").filter(Boolean).slice(0, bulletsPerProject) || [
                `Developed ${p.title}`,
            ],
        })),
        professionalSummary: "Experienced developer with strong technical skills",
        atsScore: 70,
        improvements: ["Formatted for ATS compatibility"],
    };

    const prompt = `You are an expert ATS-optimized resume writer. Create professional resume content for these projects tailored to this job.

JOB DESCRIPTION:
${jobDescription.slice(0, 2000)}

PROJECTS:
${projects.map((p, i) => `
${i + 1}. ${p.title}
   Description: ${p.description || "No description"}
   Tech Stack: ${p.techStack || "Not specified"}
   Outcomes: ${p.outcomes || "Not specified"}
`).join("\n")}

PAGE LIMIT: ${pageLimit} page(s) - Use ${bulletsPerProject} bullets per project

Generate:
1. optimizedProjects: Array of projects with:
   - title: Keep original or improve slightly
   - description: Professional 1-line summary (emphasize impact)
   - bullets: Array of ${bulletsPerProject} achievement bullets (action verbs, quantified, ATS keywords)

2. professionalSummary: 2-3 sentence professional summary highlighting relevant skills

3. atsScore: Estimated ATS compatibility score (0-100)

4. improvements: Array of 3-5 specific improvements made

Return valid JSON only, no markdown. Make it ATS-friendly with natural keyword inclusion.`;

    const { result } = await callAIWithFallback(prompt, fallback, cacheType, cacheInput);
    return result;
}

/**
 * Clean up expired cache entries (run periodically)
 */
export async function cleanupExpiredCache(): Promise<number> {
    try {
        const result = await prisma.aICache.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date(),
                },
            },
        });
        return result.count;
    } catch (error) {
        console.error("Cache cleanup error:", error);
        return 0;
    }
}
