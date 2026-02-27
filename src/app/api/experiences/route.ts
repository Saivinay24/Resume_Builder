import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const experiences = await prisma.experience.findMany({
      where: { userId: session.user.id },
      orderBy: [{ endDate: "desc" }, { startDate: "desc" }],
    });
    return NextResponse.json(experiences);
  } catch (error) {
    console.error("Error fetching experiences:", error);
    return NextResponse.json(
      { error: "Failed to fetch experiences" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      company,
      position,
      startDate,
      endDate,
      description,
      responsibilities,
      achievements,
      techStack,
      location,
    } = body;

    if (!company || !position) {
      return NextResponse.json(
        { error: "Company and position are required" },
        { status: 400 }
      );
    }

    const experience = await prisma.experience.create({
      data: {
        userId: session.user.id,
        company,
        position,
        startDate: startDate || "",
        endDate: endDate || null,
        description: description || null,
        responsibilities: responsibilities || null,
        achievements: achievements || null,
        techStack: techStack || null,
        location: location || null,
      },
    });

    return NextResponse.json(experience, { status: 201 });
  } catch (error) {
    console.error("Error creating experience:", error);
    return NextResponse.json(
      { error: "Failed to create experience" },
      { status: 500 }
    );
  }
}
