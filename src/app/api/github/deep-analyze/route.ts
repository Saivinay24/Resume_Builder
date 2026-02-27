import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deepAnalyzeAllRepos } from "@/lib/enhanced-ai-service";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/github/deep-analyze
 * 
 * Performs comprehensive AI analysis of all GitHub repositories
 * This is a one-time operation that stores results in the database
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                accounts: {
                    where: { provider: "github" }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const body = await req.json();
        const { githubUsername, forceRefresh = false } = body;

        if (!githubUsername) {
            return NextResponse.json({ error: "GitHub username required" }, { status: 400 });
        }

        // Get GitHub access token if available
        const githubAccount = user.accounts.find(a => a.provider === "github");
        const githubToken = githubAccount?.access_token;

        // Check if we need to refresh
        if (!forceRefresh) {
            const existingProfiles = await prisma.projectProfile.findMany({
                where: { userId: user.id }
            });

            const recentlyAnalyzed = existingProfiles.filter(p => {
                const daysSinceAnalysis = (Date.now() - p.lastAnalyzed.getTime()) / (1000 * 60 * 60 * 24);
                return daysSinceAnalysis < 7;
            });

            if (recentlyAnalyzed.length > 0) {
                return NextResponse.json({
                    message: "Projects already analyzed recently",
                    profiles: existingProfiles,
                    skipped: true
                });
            }
        }

        // Perform deep analysis
        // Note: This is a long-running operation
        // In production, consider using a job queue
        const profiles = await deepAnalyzeAllRepos(
            githubUsername,
            user.id,
            githubToken || undefined
        );

        return NextResponse.json({
            message: "Analysis complete — project details updated automatically",
            count: profiles.length,
            profiles
        });

    } catch (error) {
        console.error("Error in deep-analyze:", error);
        return NextResponse.json(
            { error: "Failed to analyze repositories" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/github/deep-analyze
 * 
 * Get analysis status and existing profiles
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const profiles = await prisma.projectProfile.findMany({
            where: { userId: user.id },
            orderBy: { lastAnalyzed: "desc" }
        });

        const lastAnalyzed = profiles.length > 0
            ? profiles[0].lastAnalyzed
            : null;

        return NextResponse.json({
            count: profiles.length,
            lastAnalyzed,
            profiles: profiles.map(p => ({
                id: p.id,
                repoName: p.repoName,
                category: p.category,
                lastAnalyzed: p.lastAnalyzed,
                metrics: JSON.parse(p.metrics)
            }))
        });

    } catch (error) {
        console.error("Error getting profiles:", error);
        return NextResponse.json(
            { error: "Failed to get profiles" },
            { status: 500 }
        );
    }
}
