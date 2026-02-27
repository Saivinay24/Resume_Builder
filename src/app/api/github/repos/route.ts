import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  fetchGitHubRepos,
  repoToProjectData,
} from "@/lib/github-integration";

export type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  topics?: string[];
  updated_at: string;
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const account = await prisma.account.findFirst({
      where: { userId: session.user.id, provider: "github" },
    });

    if (!account?.access_token) {
      return NextResponse.json({ error: "GitHub not connected. Sign in with GitHub first." }, { status: 400 });
    }

    const repos = await fetchGitHubRepos(account.access_token);
    return NextResponse.json(repos);
  } catch (error) {
    console.error("Error fetching GitHub repos:", error);
    return NextResponse.json({ error: "Failed to fetch repos" }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { repoIds, useAI } = body;

    if (!Array.isArray(repoIds) || repoIds.length === 0) {
      return NextResponse.json(
        { error: "Repository IDs required" },
        { status: 400 }
      );
    }

    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: "github",
      },
    });

    if (!account?.access_token) {
      return NextResponse.json(
        { error: "GitHub account not connected" },
        { status: 400 }
      );
    }

    const allRepos = await fetchGitHubRepos(account.access_token);
    const selectedRepos = allRepos.filter((repo) => repoIds.includes(repo.id));

    // Use AI analysis if requested and API key is available
    const shouldUseAI = useAI && process.env.GEMINI_API_KEY;

    const projectDataPromises = selectedRepos.map((repo) =>
      repoToProjectData(repo, account.access_token || undefined, shouldUseAI)
    );
    const projectsData = await Promise.all(projectDataPromises);

    const createdProjects = await Promise.all(
      projectsData.map(async (data, i) => {
        const repo = selectedRepos[i];
        const repoName = repo.name;

        // Check if this project already exists (by GitHub URL)
        const existing = await prisma.project.findFirst({
          where: {
            userId: session.user.id,
            OR: [
              { link: data.link },
              { githubRepo: repoName },
              { githubRepo: data.link },
            ],
          },
        });

        if (existing) {
          // Update existing project instead of creating duplicate
          return prisma.project.update({
            where: { id: existing.id },
            data: {
              title: data.title,
              description: data.description,
              techStack: data.techStack,
              link: data.link,
              outcomes: data.outcomes,
              tags: data.tags,
              startDate: data.startDate,
              endDate: data.endDate,
              githubRepo: repoName,
            },
          });
        }

        // Create new project with githubRepo set
        return prisma.project.create({
          data: {
            userId: session.user.id,
            title: data.title,
            description: data.description,
            techStack: data.techStack,
            link: data.link,
            outcomes: data.outcomes,
            tags: data.tags,
            startDate: data.startDate,
            endDate: data.endDate,
            source: "github",
            githubRepo: repoName,
            highlight: true,
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      count: createdProjects.length,
      projects: createdProjects,
      aiAnalyzed: shouldUseAI,
    });
  } catch (error) {
    console.error("Error importing GitHub repos:", error);
    return NextResponse.json(
      { error: "Failed to import repositories" },
      { status: 500 }
    );
  }
}
