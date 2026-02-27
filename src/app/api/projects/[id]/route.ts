import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Extract the GitHub repo slug from various formats:
 * - "owner/repo-name" → "repo-name"
 * - "https://github.com/owner/repo-name" → "repo-name"
 * - "repo-name" → "repo-name"
 */
function extractRepoName(input: string | null): string | null {
  if (!input) return null;
  // Full GitHub URL
  const urlMatch = input.match(/github\.com\/[^/]+\/([^/\s?#]+)/i);
  if (urlMatch) return urlMatch[1];
  // owner/repo format
  if (input.includes("/")) return input.split("/").pop() || null;
  // Just the name
  return input;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Try to find a matching ProjectProfile by multiple strategies
  let profile = null;

  // Strategy 1: Direct match on githubRepo field
  if (project.githubRepo) {
    const repoName = extractRepoName(project.githubRepo);
    if (repoName) {
      profile = await prisma.projectProfile.findFirst({
        where: { userId: session.user.id, repoName },
      });
    }
  }

  // Strategy 2: Try matching from the link field (GitHub URL)
  if (!profile && project.link) {
    const repoName = extractRepoName(project.link);
    if (repoName) {
      profile = await prisma.projectProfile.findFirst({
        where: { userId: session.user.id, repoName },
      });
    }
  }

  // Strategy 3: Try fuzzy match on project title → repoName (e.g. "fake news detector ml" → "fake-news-detector-ml")
  if (!profile && project.source === "github") {
    const slugTitle = project.title.toLowerCase().replace(/\s+/g, "-");
    profile = await prisma.projectProfile.findFirst({
      where: { userId: session.user.id, repoName: slugTitle },
    });
  }

  return NextResponse.json({ ...project, profile });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updated = await prisma.project.update({
    where: { id },
    data: {
      title: body.title ?? undefined,
      description: body.description ?? undefined,
      techStack: body.techStack ?? undefined,
      role: body.role ?? undefined,
      startDate: body.startDate ?? undefined,
      endDate: body.endDate ?? undefined,
      link: body.link ?? undefined,
      outcomes: body.outcomes ?? undefined,
      tags: body.tags ?? undefined,
      highlight: body.highlight ?? undefined,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
