import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { calculateATSScore } from "@/lib/ats-scorer";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { resumeText, jobDescription } = body;

        if (!resumeText || typeof resumeText !== "string") {
            return NextResponse.json(
                { error: "Resume text is required" },
                { status: 400 }
            );
        }

        const score = calculateATSScore(resumeText, jobDescription);
        return NextResponse.json(score);
    } catch (error) {
        console.error("Error calculating ATS score:", error);
        return NextResponse.json(
            { error: "Failed to calculate ATS score" },
            { status: 500 }
        );
    }
}
