/**
 * Enhanced GitHub integration utilities
 * Fetches repository data, README content, and generates project descriptions
 */

export type GitHubRepo = {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
    language: string | null;
    languages_url: string;
    stargazers_count: number;
    forks_count: number;
    created_at: string;
    updated_at: string;
    topics: string[];
    default_branch: string;
};

export type EnhancedProjectData = {
    title: string;
    description: string;
    techStack: string;
    link: string;
    outcomes: string;
    tags: string;
    startDate: string;
    endDate: string;
    githubUrl: string;
    stars: number;
    forks: number;
};

/**
 * Fetch user's GitHub repositories
 */
export async function fetchGitHubRepos(
    accessToken: string
): Promise<GitHubRepo[]> {
    const response = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github.v3+json",
        },
    });

    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Fetch README content for a repository
 */
export async function fetchRepoReadme(
    owner: string,
    repo: string,
    accessToken?: string
): Promise<string | null> {
    const headers: HeadersInit = {
        Accept: "application/vnd.github.v3.raw",
    };

    if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
    }

    try {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/readme`,
            { headers }
        );

        if (!response.ok) {
            return null;
        }

        return await response.text();
    } catch (error) {
        console.error(`Error fetching README for ${owner}/${repo}:`, error);
        return null;
    }
}

/**
 * Fetch languages used in a repository
 */
export async function fetchRepoLanguages(
    owner: string,
    repo: string,
    accessToken?: string
): Promise<Record<string, number>> {
    const headers: HeadersInit = {
        Accept: "application/vnd.github.v3+json",
    };

    if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
    }

    try {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/languages`,
            { headers }
        );

        if (!response.ok) {
            return {};
        }

        return await response.json();
    } catch (error) {
        console.error(`Error fetching languages for ${owner}/${repo}:`, error);
        return {};
    }
}

/**
 * Parse README to extract project description and outcomes
 */
export function parseReadmeContent(readme: string): {
    description: string;
    outcomes: string[];
} {
    const lines = readme.split("\n");
    let description = "";
    const outcomes: string[] = [];

    // Extract description (first paragraph after title)
    let foundTitle = false;
    let descriptionLines: string[] = [];

    for (const line of lines) {
        const trimmed = line.trim();

        // Skip title
        if (trimmed.startsWith("#")) {
            foundTitle = true;
            continue;
        }

        // Collect description lines
        if (foundTitle && trimmed && !trimmed.startsWith("##")) {
            descriptionLines.push(trimmed);
            if (descriptionLines.length >= 3) break; // Take first 3 lines
        }

        if (foundTitle && trimmed.startsWith("##")) {
            break;
        }
    }

    description = descriptionLines.join(" ").slice(0, 300);

    // Extract features/outcomes
    let inFeaturesSection = false;
    for (const line of lines) {
        const trimmed = line.trim();
        const lower = trimmed.toLowerCase();

        // Detect features section
        if (
            lower.includes("feature") ||
            lower.includes("highlight") ||
            lower.includes("what i built") ||
            lower.includes("key points")
        ) {
            inFeaturesSection = true;
            continue;
        }

        // Stop at next major section
        if (inFeaturesSection && trimmed.startsWith("##")) {
            break;
        }

        // Extract bullet points
        if (inFeaturesSection && (trimmed.startsWith("-") || trimmed.startsWith("*"))) {
            const outcome = trimmed.replace(/^[-*]\s*/, "").trim();
            if (outcome.length > 10) {
                outcomes.push(outcome);
            }
        }
    }

    return { description, outcomes };
}

/**
 * Convert languages object to tech stack string
 */
export function languagesToTechStack(languages: Record<string, number>): string {
    const sortedLanguages = Object.entries(languages)
        .sort(([, a], [, b]) => b - a)
        .map(([lang]) => lang);

    return sortedLanguages.join(", ");
}

/**
 * Generate project outcomes from commit messages
 */
export async function fetchRepoCommits(
    owner: string,
    repo: string,
    accessToken?: string,
    limit: number = 20
): Promise<string[]> {
    const headers: HeadersInit = {
        Accept: "application/vnd.github.v3+json",
    };

    if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
    }

    try {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/commits?per_page=${limit}`,
            { headers }
        );

        if (!response.ok) {
            return [];
        }

        const commits = await response.json();
        return commits.map((c: any) => c.commit.message);
    } catch (error) {
        console.error(`Error fetching commits for ${owner}/${repo}:`, error);
        return [];
    }
}

/**
 * Analyze commits to generate outcomes
 */
export function generateOutcomesFromCommits(commits: string[]): string[] {
    const outcomes: string[] = [];
    const keywords = {
        feature: /add|implement|create|build/i,
        improvement: /improve|optimize|enhance|refactor/i,
        fix: /fix|resolve|correct/i,
        performance: /performance|speed|faster|optimize/i,
    };

    const significantCommits = commits.filter((msg) => {
        return (
            Object.values(keywords).some((regex) => regex.test(msg)) &&
            msg.length > 20 &&
            !msg.toLowerCase().includes("merge") &&
            !msg.toLowerCase().includes("update readme")
        );
    });

    // Take top 5 significant commits
    significantCommits.slice(0, 5).forEach((msg) => {
        const cleaned = msg.split("\n")[0].trim();
        if (cleaned.length > 15) {
            outcomes.push(`- ${cleaned}`);
        }
    });

    return outcomes;
}

/**
 * Convert GitHub repo to enhanced project data
 * @param useAI - If true, use AI to analyze the repository deeply
 */
export async function repoToProjectData(
    repo: GitHubRepo,
    accessToken?: string,
    useAI?: boolean
): Promise<EnhancedProjectData> {
    const [owner, repoName] = repo.full_name.split("/");

    // Fetch additional data
    const [readme, languages, commits] = await Promise.all([
        fetchRepoReadme(owner, repoName, accessToken),
        fetchRepoLanguages(owner, repoName, accessToken),
        fetchRepoCommits(owner, repoName, accessToken, 20),
    ]);

    let description = repo.description || "";
    let outcomes: string[] = [];

    // Use AI analysis if enabled
    if (useAI && readme) {
        try {
            const { analyzeGitHubRepo } = await import("./ai-service");
            const languageList = Object.keys(languages);

            const aiAnalysis = await analyzeGitHubRepo({
                name: repo.name,
                description: repo.description,
                readme: readme,
                languages: languageList,
                topics: repo.topics,
                stars: repo.stargazers_count,
            });

            description = aiAnalysis.professionalSummary;
            outcomes = aiAnalysis.technicalHighlights.map(h => `- ${h}`);
        } catch (error) {
            console.error("AI analysis failed, falling back to manual parsing:", error);
            // Fall through to manual parsing
        }
    }

    // Fallback to manual parsing if AI not used or failed
    if (!description || description === repo.description) {
        if (readme) {
            const parsed = parseReadmeContent(readme);
            if (parsed.description) {
                description = parsed.description;
            }
            if (outcomes.length === 0) {
                outcomes = parsed.outcomes.map(o => `- ${o}`);
            }
        }
    }

    // If no outcomes from README, generate from commits
    if (outcomes.length === 0 && commits.length > 0) {
        outcomes = generateOutcomesFromCommits(commits);
    }

    // If still no outcomes, create generic ones
    if (outcomes.length === 0) {
        outcomes = [
            `- Developed ${repo.name} using ${repo.language || "various technologies"}`,
            `- Achieved ${repo.stargazers_count} stars and ${repo.forks_count} forks`,
        ];
    }

    const techStack = languagesToTechStack(languages);
    const tags = [...repo.topics, repo.language].filter(Boolean).join(", ");

    return {
        title: repo.name.replace(/-/g, " ").replace(/_/g, " "),
        description,
        techStack: techStack || repo.language || "Various technologies",
        link: repo.html_url,
        outcomes: outcomes.join("\n"),
        tags,
        startDate: new Date(repo.created_at).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
        }),
        endDate: new Date(repo.updated_at).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
        }),
        githubUrl: repo.html_url,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
    };
}
