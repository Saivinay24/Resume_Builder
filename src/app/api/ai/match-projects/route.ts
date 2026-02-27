import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { matchProjectsToJob } from "@/lib/ai-service";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { jobDescription, projectIds } = body;

        if (!jobDescription || !projectIds || !Array.isArray(projectIds)) {
            return NextResponse.json(
                { error: "Job description and project IDs required" },
                { status: 400 }
            );
        }

        // Fetch user's projects
        const projects = await prisma.project.findMany({
            where: {
                id: { in: projectIds },
                userId: session.user.id,
            },
            select: {
                id: true,
                title: true,
                description: true,
                techStack: true,
                outcomes: true,
            },
        });

        if (projects.length === 0) {
            return NextResponse.json(
                { error: "No projects found" },
                { status: 404 }
            );
        }

        // Use AI to match and rank projects
        const matches = await matchProjectsToJob(jobDescription, projects);

        return NextResponse.json({ matches });
    } catch (error) {
        console.error("AI matching error:", error);
        return NextResponse.json(
            { error: "Failed to match projects" },
            { status: 500 }
        );
    }
}
