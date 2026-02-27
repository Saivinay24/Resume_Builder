import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/github/sync-projects
 * Syncs ProjectProfile analysis data into Project records.
 * This ensures project detail pages show the rich AI-analyzed content.
 */
export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const userId = session.user.id;

        // Get all analyzed project profiles
        const profiles = await prisma.projectProfile.findMany({
            where: { userId }
        });

        if (profiles.length === 0) {
            return NextResponse.json({
                synced: 0,
                message: "No project profiles found. Run deep analysis first."
            });
        }

        let synced = 0;
        let created = 0;

        for (const profile of profiles) {
            const techStack = (() => {
                try { return JSON.parse(profile.techStack); } catch { return { primary: [], secondary: [] }; }
            })();
            const bulletPoints = (() => {
                try { return JSON.parse(profile.bulletPoints); } catch { return []; }
            })();

            const techStackStr = techStack.primary?.join(", ") || "";
            const outcomesStr = Array.isArray(bulletPoints) ? bulletPoints.join("\n") : "";
            const topics = (() => {
                try { return profile.topics ? JSON.parse(profile.topics) : []; } catch { return []; }
            })();

            const tagsStr = [
                profile.category,
                ...techStack.primary || [],
                ...topics
            ].filter(Boolean).join(", ");

            // Try to find existing project by multiple matching strategies
            const repoName = profile.repoName;
            const repoUrl = profile.repoUrl;
            const ownerRepo = repoUrl.replace("https://github.com/", "");

            const existingProject = await prisma.project.findFirst({
                where: {
                    userId,
                    OR: [
                        { githubRepo: repoUrl },
                        { githubRepo: ownerRepo },
                        { githubRepo: repoName },
                        { link: repoUrl },
                        { link: { contains: repoName } },
                    ]
                }
            });

            const projectData = {
                title: repoName.replace(/-/g, " ").replace(/_/g, " "),
                description: profile.masterDescription,
                techStack: techStackStr,
                outcomes: outcomesStr,
                tags: tagsStr,
                link: repoUrl,
                githubRepo: ownerRepo,
            };

            if (existingProject) {
                await prisma.project.update({
                    where: { id: existingProject.id },
                    data: projectData
                });
                synced++;
            } else {
                await prisma.project.create({
                    data: {
                        userId,
                        source: "github",
                        highlight: true,
                        ...projectData
                    }
                });
                created++;
            }
        }

        return NextResponse.json({
            synced,
            created,
            total: profiles.length,
            message: `Updated ${synced} projects, created ${created} new projects from ${profiles.length} profiles.`
        });
    } catch (error) {
        console.error("Sync error:", error);
        return NextResponse.json(
            { error: "Failed to sync projects" },
            { status: 500 }
        );
    }
}
