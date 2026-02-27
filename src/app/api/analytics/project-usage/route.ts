import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  // Get all docs for this user first
  const userDocs = await prisma.generatedDoc.findMany({
    where: { userId: session.user.id },
    select: { id: true }
  });
  
  const docIds = userDocs.map(d => d.id);
  
  const usages = await prisma.generatedDocProject.groupBy({
    by: ["projectId"],
    where: {
      docId: { in: docIds },
    },
    _count: { projectId: true },
    orderBy: { _count: { projectId: "desc" } },
  });
  
  const projectIds = usages.map((u) => u.projectId);
  const projects = await prisma.project.findMany({
    where: { id: { in: projectIds }, userId: session.user.id },
  });
  const byId = Object.fromEntries(projects.map((p) => [p.id, p]));
  const result = usages.map((u) => ({
    projectId: u.projectId,
    title: byId[u.projectId]?.title ?? "Unknown",
    count: u._count.projectId,
  }));
  return NextResponse.json(result);
}
