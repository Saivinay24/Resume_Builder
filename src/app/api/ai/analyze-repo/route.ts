import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analyzeGitHubRepo } from "@/lib/ai-service";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, description, readme, languages, topics, stars } = body;

        if (!name) {
            return NextResponse.json(
                { error: "Repository name required" },
                { status: 400 }
            );
        }

        const analysis = await analyzeGitHubRepo({
            name,
            description,
            readme,
            languages: languages || [],
            topics: topics || [],
            stars: stars || 0,
        });

        return NextResponse.json(analysis);
    } catch (error) {
        console.error("AI analysis error:", error);
        return NextResponse.json(
            { error: "Failed to analyze repository" },
            { status: 500 }
        );
    }
}
