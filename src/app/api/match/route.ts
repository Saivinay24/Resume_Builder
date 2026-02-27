import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { selectAndTailorProjects, ProjectProfile } from "@/lib/enhanced-ai-service";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { jobId, jobDescription, maxProjects = 4 } = body;

    let description = jobDescription as string | undefined;

    // If jobId provided, fetch job description
    if (jobId && !description) {
      const job = await prisma.job.findFirst({
        where: { id: jobId, userId: session.user.id },
      });
      if (job) description = job.description;
    }

    if (!description || typeof description !== "string") {
      return NextResponse.json(
        { error: "Job description or jobId required" },
        { status: 400 }
      );
    }

    // Fetch user's project profiles (comprehensive AI-analyzed data)
    const projectProfiles = await prisma.projectProfile.findMany({
      where: { userId: session.user.id },
    });

    if (projectProfiles.length === 0) {
      return NextResponse.json({
        matches: [],
        message: "No project profiles found. Please sync your GitHub repositories first."
      });
    }

    // Parse JSON fields from database
    const profiles: ProjectProfile[] = projectProfiles.map(p => ({
      id: p.id,
      repoName: p.repoName,
      repoUrl: p.repoUrl,
      category: p.category || undefined,
      masterDescription: p.masterDescription,
      bulletPoints: JSON.parse(p.bulletPoints),
      techStack: JSON.parse(p.techStack),
      architectureNotes: p.architectureNotes || undefined,
      metrics: JSON.parse(p.metrics),
      problemStatement: p.problemStatement || undefined,
      solutionApproach: p.solutionApproach || undefined,
      impact: p.impact || undefined,
      githubData: p.githubData ? JSON.parse(p.githubData) : undefined,
      primaryLanguage: p.primaryLanguage || undefined,
      topics: p.topics ? JSON.parse(p.topics) : undefined,
      lastAnalyzed: p.lastAnalyzed
    }));

    // Use enhanced AI service to select and tailor projects for this job
    const tailoredProjects = await selectAndTailorProjects(
      description,
      profiles,
      maxProjects
    );

    // Format response to match expected structure
    const matches = tailoredProjects.map(tp => ({
      projectId: tp.projectId,
      repoName: tp.repoName,
      relevanceScore: tp.relevanceScore,
      matchReason: tp.whyRelevant,
      tailoredDescription: profiles.find(p => p.id === tp.projectId)?.masterDescription || "",
      keyAlignments: tp.matchingSkills,
      tailoredBullets: tp.tailoredBullets,
      category: tp.category
    }));

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Match API error:", error);
    return NextResponse.json(
      { error: "Failed to match projects" },
      { status: 500 }
    );
  }
}
