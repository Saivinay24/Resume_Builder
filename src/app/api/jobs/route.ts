import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const jobs = await prisma.job.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(jobs);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { title, company, url, description } = body;
  if (!description || typeof description !== "string")
    return NextResponse.json({ error: "Description required" }, { status: 400 });
  const job = await prisma.job.create({
    data: {
      userId: session.user.id,
      title: title ?? null,
      company: company ?? null,
      link: url ?? null,
      description: description.trim(),
    },
  });
  return NextResponse.json(job);
}
