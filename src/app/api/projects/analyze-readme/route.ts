import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analyzeReadme } from "@/lib/enhanced-ai-service";

/**
 * POST /api/projects/analyze-readme
 * Accepts a README content string and returns auto-filled project fields
 * Uses the fast model (gemini-2.0-flash) since this is a lightweight operation
 */
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { readme } = await request.json();

        if (!readme || typeof readme !== "string" || readme.trim().length < 20) {
            return NextResponse.json(
                { error: "README content is too short. Paste the full README." },
                { status: 400 }
            );
        }

        const result = await analyzeReadme(readme.trim());

        return NextResponse.json(result);
    } catch (error) {
        console.error("README analysis error:", error);
        return NextResponse.json(
            { error: "Failed to analyze README. Check your API key." },
            { status: 500 }
        );
    }
}
