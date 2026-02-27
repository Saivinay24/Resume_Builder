import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const experience = await prisma.experience.findFirst({
            where: {
                id: params.id,
                userId: session.user.id,
            },
        });

        if (!experience) {
            return NextResponse.json(
                { error: "Experience not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(experience);
    } catch (error) {
        console.error("Error fetching experience:", error);
        return NextResponse.json(
            { error: "Failed to fetch experience" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
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

        const existing = await prisma.experience.findFirst({
            where: {
                id: params.id,
                userId: session.user.id,
            },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Experience not found" },
                { status: 404 }
            );
        }

        const experience = await prisma.experience.update({
            where: { id: params.id },
            data: {
                company: company !== undefined ? company : existing.company,
                position: position !== undefined ? position : existing.position,
                startDate: startDate !== undefined ? startDate : existing.startDate,
                endDate: endDate !== undefined ? endDate : existing.endDate,
                description:
                    description !== undefined ? description : existing.description,
                responsibilities:
                    responsibilities !== undefined
                        ? responsibilities
                        : existing.responsibilities,
                achievements:
                    achievements !== undefined
                        ? achievements
                        : existing.achievements,
                techStack: techStack !== undefined ? techStack : existing.techStack,
                location: location !== undefined ? location : existing.location,
            },
        });

        return NextResponse.json(experience);
    } catch (error) {
        console.error("Error updating experience:", error);
        return NextResponse.json(
            { error: "Failed to update experience" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const existing = await prisma.experience.findFirst({
            where: {
                id: params.id,
                userId: session.user.id,
            },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Experience not found" },
                { status: 404 }
            );
        }

        await prisma.experience.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting experience:", error);
        return NextResponse.json(
            { error: "Failed to delete experience" },
            { status: 500 }
        );
    }
}
