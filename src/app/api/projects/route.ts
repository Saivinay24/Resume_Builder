import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Extract the GitHub repo slug from various formats
 */
function extractRepoName(input: string | null): string | null {
  if (!input) return null;
  const urlMatch = input.match(/github\.com\/[^/]+\/([^/\s?#]+)/i);
  if (urlMatch) return urlMatch[1];
  if (input.includes("/")) return input.split("/").pop() || null;
  return input;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  // Fetch all analyzed repo names for this user
  const profiles = await prisma.projectProfile.findMany({
    where: { userId: session.user.id },
    select: { repoName: true },
  });
  const analyzedRepos = new Set(profiles.map((p) => p.repoName));

  // Match projects to profiles using multiple strategies
  const annotated = projects.map((p) => {
    let hasProfile = false;

    // Strategy 1: githubRepo field
    const fromGithubRepo = extractRepoName(p.githubRepo);
    if (fromGithubRepo && analyzedRepos.has(fromGithubRepo)) hasProfile = true;

    // Strategy 2: link field (GitHub URL)
    if (!hasProfile) {
      const fromLink = extractRepoName(p.link);
      if (fromLink && analyzedRepos.has(fromLink)) hasProfile = true;
    }

    // Strategy 3: slugified title
    if (!hasProfile && p.source === "github") {
      const slugTitle = p.title.toLowerCase().replace(/\s+/g, "-");
      if (analyzedRepos.has(slugTitle)) hasProfile = true;
    }

    return { ...p, hasProfile };
  });

  return NextResponse.json(annotated);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const {
    title,
    description,
    techStack,
    role,
    startDate,
    endDate,
    link,
    outcomes,
    tags,
    source = "manual",
    githubRepo,
    highlight = true,
  } = body;
  if (!title || typeof title !== "string") return NextResponse.json({ error: "Title required" }, { status: 400 });
  const project = await prisma.project.create({
    data: {
      userId: session.user.id,
      source: source as string,
      title: title.trim(),
      description: description ?? null,
      techStack: techStack ?? null,
      role: role ?? null,
      startDate: startDate ?? null,
      endDate: endDate ?? null,
      link: link ?? null,
      outcomes: outcomes ?? null,
      tags: tags ?? null,
      githubRepo: githubRepo ?? null,
      highlight: !!highlight,
    },
  });
  return NextResponse.json(project);
}
