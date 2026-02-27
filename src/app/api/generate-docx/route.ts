import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderResumeWithTemplate, type ResumeTemplate } from "@/lib/resume-templates";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const projectIdsParam = searchParams.get("projectIds");
    const experienceIdsParam = searchParams.get("experienceIds");
    const template = (searchParams.get("template") || "archer-irm") as ResumeTemplate;
    const maxPages = parseInt(searchParams.get("maxPages") || "1");

    if (!projectIdsParam) {
      return NextResponse.json(
        { error: "Project IDs required" },
        { status: 400 }
      );
    }

    const projectIds = projectIdsParam.split(",").filter(Boolean);
    const experienceIds = experienceIdsParam ? experienceIdsParam.split(",").filter(Boolean) : [];

    // Fetch user profile
    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found. Please set up your profile in Settings first." },
        { status: 400 }
      );
    }

    // Fetch selected projects in order
    const projects = await prisma.project.findMany({
      where: {
        id: { in: projectIds },
        userId: session.user.id,
      },
    });

    const projectsMap = new Map(projects.map(p => [p.id, p]));
    const orderedProjects = projectIds.map(id => projectsMap.get(id)).filter(Boolean);

    // Fetch selected experiences
    const experiences = experienceIds.length > 0
      ? await prisma.experience.findMany({
        where: {
          id: { in: experienceIds },
          userId: session.user.id,
        },
        orderBy: [{ endDate: "desc" }, { startDate: "desc" }],
      })
      : [];

    // Generate resume
    const buffer = await renderResumeWithTemplate(
      template,
      profile as any,
      experiences,
      orderedProjects as any,
      maxPages
    );

    const headers = new Headers();
    headers.set("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    headers.set("Content-Disposition", `attachment; filename="resume_${template}.docx"`);

    return new NextResponse(new Uint8Array(buffer), { status: 200, headers });
  } catch (error) {
    console.error("Error generating resume:", error);
    return NextResponse.json(
      { error: "Failed to generate resume" },
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
    const { projectIds, experienceIds, template, maxPages, tailoredProjects } = body;

    if (!Array.isArray(projectIds) || projectIds.length === 0) {
      return NextResponse.json(
        { error: "Project IDs required" },
        { status: 400 }
      );
    }

    // Fetch user profile
    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found. Please set up your profile in Settings first." },
        { status: 400 }
      );
    }

    // Fetch selected projects
    const projects = await prisma.project.findMany({
      where: {
        id: { in: projectIds },
        userId: session.user.id
      },
    });

    // Order projects to match projectIds order
    const projectsMap = new Map(projects.map(p => [p.id, p]));
    const orderedProjects = projectIds.map((id: string) => projectsMap.get(id)).filter(Boolean) as typeof projects;

    // ── KEY FIX: Overlay tailored bullets onto project outcomes ──
    // If tailoredProjects data is provided (from the match step),
    // replace the raw project outcomes with AI-tailored bullets
    if (tailoredProjects && Array.isArray(tailoredProjects)) {
      for (const tp of tailoredProjects) {
        const project = orderedProjects.find(p => p.id === tp.projectId);
        if (project && tp.tailoredBullets && Array.isArray(tp.tailoredBullets) && tp.tailoredBullets.length > 0) {
          // Override outcomes with tailored bullets
          (project as any).outcomes = tp.tailoredBullets.join("\n");
        }
      }
    }

    // Fetch selected experiences
    const experiences = experienceIds && Array.isArray(experienceIds)
      ? await prisma.experience.findMany({
        where: {
          id: { in: experienceIds },
          userId: session.user.id,
        },
        orderBy: [{ endDate: "desc" }, { startDate: "desc" }],
      })
      : [];

    // Generate resume with selected template
    const selectedTemplate: ResumeTemplate = template || "archer-irm";
    const pageLimit = maxPages || 1;

    const buffer = await renderResumeWithTemplate(
      selectedTemplate,
      profile,
      experiences,
      orderedProjects,
      pageLimit
    );

    const headers = new Headers();
    headers.set("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    headers.set("Content-Disposition", `attachment; filename="resume_${selectedTemplate}.docx"`);

    return new NextResponse(new Uint8Array(buffer), { status: 200, headers });
  } catch (error) {
    console.error("Error generating resume:", error);
    return NextResponse.json(
      { error: "Failed to generate resume" },
      { status: 500 }
    );
  }
}
