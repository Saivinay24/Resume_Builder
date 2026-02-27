import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const projectIdsParam = searchParams.get("projectIds");
  const projectIds = projectIdsParam ? projectIdsParam.split(",").filter(Boolean) : [];
  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
  });
  const projects = await prisma.project.findMany({
    where: { userId: session.user.id, id: projectIds.length ? { in: projectIds } : undefined },
  });
  const ordered =
    projectIds.length > 0
      ? projectIds.map((id) => projects.find((p) => p.id === id)).filter(Boolean) as typeof projects
      : projects;
  return NextResponse.json({ profile, projects: ordered });
}
