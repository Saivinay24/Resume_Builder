import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deepAnalyzeRepo } from "@/lib/enhanced-ai-service";

/**
 * POST /api/projects/[id]/analyze
 * 
 * Triggers AI deep analysis for a single project.
 * Works for GitHub projects (extracts owner/repo from link or githubRepo).
 */
export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Find the project
        const project = await prisma.project.findFirst({
            where: { id, userId: session.user.id },
        });
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Extract GitHub owner/repo from link or githubRepo
        const githubUrl = project.link || project.githubRepo || "";
        const urlMatch = githubUrl.match(/github\.com\/([^/]+)\/([^/\s?#]+)/i);

        let repoOwner: string;
        let repoName: string;

        if (urlMatch) {
            repoOwner = urlMatch[1];
            repoName = urlMatch[2];
        } else if (project.githubRepo) {
            // Try owner/repo format
            const parts = project.githubRepo.split("/");
            if (parts.length === 2) {
                repoOwner = parts[0];
                repoName = parts[1];
            } else {
                return NextResponse.json(
                    { error: "Cannot determine GitHub repository. Add a GitHub URL to the project link field." },
                    { status: 400 }
                );
            }
        } else {
            return NextResponse.json(
                { error: "No GitHub URL found. Add a GitHub URL to the project link field to enable AI analysis." },
                { status: 400 }
            );
        }

        // Get GitHub token if available
        const account = await prisma.account.findFirst({
            where: { userId: session.user.id, provider: "github" },
        });
        const githubToken = account?.access_token || undefined;

        console.log(`[analyze] Starting deep analysis for ${repoOwner}/${repoName}...`);

        // Run deep analysis
        const profile = await deepAnalyzeRepo(repoOwner, repoName, githubToken);

        // Upsert into ProjectProfile
        const saved = await prisma.projectProfile.upsert({
            where: {
                userId_repoName: {
                    userId: session.user.id,
                    repoName: repoName,
                },
            },
            create: {
                userId: session.user.id,
                repoName: profile.repoName,
                repoUrl: profile.repoUrl,
                category: profile.category ?? null,
                masterDescription: profile.masterDescription,
                bulletPoints: JSON.stringify(profile.bulletPoints),
                techStack: JSON.stringify(profile.techStack),
                architectureNotes: profile.architectureNotes ?? null,
                metrics: JSON.stringify(profile.metrics),
                problemStatement: profile.problemStatement ?? null,
                solutionApproach: profile.solutionApproach ?? null,
                impact: profile.impact ?? null,
                githubData: profile.githubData ? JSON.stringify(profile.githubData) : null,
                primaryLanguage: profile.primaryLanguage ?? null,
                topics: profile.topics ? JSON.stringify(profile.topics) : null,
            },
            update: {
                repoUrl: profile.repoUrl,
                category: profile.category ?? null,
                masterDescription: profile.masterDescription,
                bulletPoints: JSON.stringify(profile.bulletPoints),
                techStack: JSON.stringify(profile.techStack),
                architectureNotes: profile.architectureNotes ?? null,
                metrics: JSON.stringify(profile.metrics),
                problemStatement: profile.problemStatement ?? null,
                solutionApproach: profile.solutionApproach ?? null,
                impact: profile.impact ?? null,
                githubData: profile.githubData ? JSON.stringify(profile.githubData) : null,
                primaryLanguage: profile.primaryLanguage ?? null,
                topics: profile.topics ? JSON.stringify(profile.topics) : null,
                lastAnalyzed: new Date(),
            },
        });

        // Also update the project's githubRepo field if it's empty
        if (!project.githubRepo) {
            await prisma.project.update({
                where: { id },
                data: { githubRepo: repoName },
            });
        }

        return NextResponse.json({
            success: true,
            profile: saved,
        });
    } catch (error) {
        console.error("Error analyzing project:", error);
        return NextResponse.json(
            { error: `Analysis failed: ${error instanceof Error ? error.message : "Unknown error"}` },
            { status: 500 }
        );
    }
}
