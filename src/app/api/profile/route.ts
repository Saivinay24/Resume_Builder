import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
  });
  return NextResponse.json(profile ?? null);
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { fullName, email, phone, location, linkedinUrl, websiteUrl, summary, education, otherExperience, skills } = body;
  const profile = await prisma.userProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      fullName: fullName ?? null,
      email: email ?? null,
      phone: phone ?? null,
      location: location ?? null,
      linkedinUrl: linkedinUrl ?? null,
      websiteUrl: websiteUrl ?? null,
      summary: summary ?? null,
      education: education ?? null,
      otherExperience: otherExperience ?? null,
      skills: skills ?? null,
    },
    update: {
      fullName: fullName ?? undefined,
      email: email ?? undefined,
      phone: phone ?? undefined,
      location: location ?? undefined,
      linkedinUrl: linkedinUrl ?? undefined,
      websiteUrl: websiteUrl ?? undefined,
      summary: summary ?? undefined,
      education: education ?? undefined,
      otherExperience: otherExperience ?? undefined,
      skills: skills ?? undefined,
    },
  });
  return NextResponse.json(profile);
}
