"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProjectForm } from "@/components/ProjectForm";
import Link from "next/link";
import { useState } from "react";

type ProjectProfile = {
  id: string;
  repoName: string;
  repoUrl: string;
  category: string | null;
  masterDescription: string;
  bulletPoints: string;
  techStack: string;
  architectureNotes: string | null;
  metrics: string;
  problemStatement: string | null;
  solutionApproach: string | null;
  impact: string | null;
  primaryLanguage: string | null;
  topics: string | null;
  lastAnalyzed: string;
};

type Project = {
  id: string;
  title: string;
  description: string | null;
  techStack: string | null;
  role: string | null;
  startDate: string | null;
  endDate: string | null;
  link: string | null;
  outcomes: string | null;
  tags: string | null;
  highlight: boolean;
  githubRepo: string | null;
  source: string;
  profile: ProjectProfile | null;
};

/**
 * Render the ProjectProfile as a structured markdown-style report
 */
function ProfileReport({ profile }: { profile: ProjectProfile }) {
  // Parse JSON fields safely
  let bulletPoints: string[] = [];
  try {
    const parsed = JSON.parse(profile.bulletPoints);
    bulletPoints = Array.isArray(parsed) ? parsed : [profile.bulletPoints];
  } catch {
    bulletPoints = profile.bulletPoints.split("\n").filter((s) => s.trim());
  }

  let techStack: { primary?: string[]; secondary?: string[]; proficiency?: Record<string, string> } = {};
  try {
    techStack = JSON.parse(profile.techStack);
  } catch {
    techStack = { primary: profile.techStack.split(",").map((s) => s.trim()) };
  }

  let metrics: Record<string, unknown> = {};
  try {
    metrics = JSON.parse(profile.metrics);
  } catch {
    // ignore
  }

  let topics: string[] = [];
  if (profile.topics) {
    try {
      topics = JSON.parse(profile.topics);
    } catch {
      topics = profile.topics.split(",").map((s) => s.trim());
    }
  }

  const analyzedDate = new Date(profile.lastAnalyzed).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Check if this is a shallow/fallback analysis
  const isShallow = bulletPoints.length <= 1 && bulletPoints[0]?.startsWith("Developed a software project");

  return (
    <div className="mt-8 border border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-blue-50 dark:bg-blue-900/30 px-6 py-4 border-b border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
            <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-300">
              AI Project Report
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {profile.category && (
              <span className="text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                {profile.category}
              </span>
            )}
            <span className="text-xs text-gray-500">Analyzed {analyzedDate}</span>
          </div>
        </div>
        {isShallow && (
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
            ⚠️ This is a shallow analysis. Click &quot;Re-analyze with AI&quot; below for a comprehensive report.
          </p>
        )}
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-6 bg-white dark:bg-gray-950 text-sm leading-relaxed">

        {/* Description */}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">📋 Description</h3>
          <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{profile.masterDescription}</p>
        </section>

        {/* Problem → Solution → Impact */}
        {profile.problemStatement && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">🎯 Problem Statement</h3>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{profile.problemStatement}</p>
          </section>
        )}
        {profile.solutionApproach && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">💡 Solution Approach</h3>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{profile.solutionApproach}</p>
          </section>
        )}
        {profile.impact && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">📈 Impact</h3>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{profile.impact}</p>
          </section>
        )}

        {/* Bullet Points */}
        {bulletPoints.length > 0 && !isShallow && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">🔹 Resume Bullet Points</h3>
            <ul className="space-y-1.5">
              {bulletPoints.map((bp, i) => (
                <li key={i} className="flex gap-2 text-gray-800 dark:text-gray-200">
                  <span className="text-blue-500 flex-shrink-0">•</span>
                  <span>{bp.replace(/^[-•*]\s*/, "")}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Tech Stack */}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">🛠 Tech Stack</h3>
          <div className="space-y-2">
            {techStack.primary && techStack.primary.length > 0 && (
              <div>
                <span className="text-gray-500 font-medium text-xs">Primary: </span>
                <span className="text-gray-800 dark:text-gray-200">
                  {techStack.primary.join(", ")}
                </span>
              </div>
            )}
            {techStack.secondary && techStack.secondary.length > 0 && (
              <div>
                <span className="text-gray-500 font-medium text-xs">Secondary: </span>
                <span className="text-gray-800 dark:text-gray-200">
                  {techStack.secondary.join(", ")}
                </span>
              </div>
            )}
            {techStack.proficiency && typeof techStack.proficiency === "object" && Object.keys(techStack.proficiency).length > 0 && (
              <div>
                <span className="text-gray-500 font-medium text-xs">Proficiency: </span>
                <span className="text-gray-800 dark:text-gray-200">
                  {Object.entries(techStack.proficiency).map(([tech, level]) => `${tech} (${String(level)})`).join(", ")}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Architecture */}
        {profile.architectureNotes && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">🏗 Architecture</h3>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{profile.architectureNotes}</p>
          </section>
        )}

        {/* Metrics */}
        {Object.keys(metrics).length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">📊 Metrics</h3>
            <div className="flex flex-wrap gap-4">
              {Object.entries(metrics).map(([key, val]) => (
                <div key={key} className="bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded">
                  <span className="text-gray-500 text-xs">{key}: </span>
                  <span className="text-gray-800 dark:text-gray-200 font-semibold">{String(val)}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Topics */}
        {topics.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">🏷 Topics</h3>
            <div className="flex flex-wrap gap-1.5">
              {topics.map((t, i) => (
                <span key={i} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                  {t}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Primary Language */}
        {profile.primaryLanguage && (
          <div className="text-xs text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-800">
            Primary language: <span className="text-gray-600 dark:text-gray-300 font-semibold">{profile.primaryLanguage}</span>
            {profile.repoUrl && (
              <>
                {" · "}
                <a href={profile.repoUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
                  View on GitHub ↗
                </a>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function EditProjectPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ["projects", id],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${id}`);
      if (!r.ok) throw new Error("Not found");
      return r.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const r = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.error ?? "Failed to update");
      }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", id] });
      router.push("/dashboard/projects");
    },
  });

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const r = await fetch(`/api/projects/${id}/analyze`, { method: "POST" });
      const data = await r.json();
      if (!r.ok) {
        setAnalyzeError(data.error || "Analysis failed");
      } else {
        // Refetch the project to get the new profile
        queryClient.invalidateQueries({ queryKey: ["projects", id] });
        queryClient.invalidateQueries({ queryKey: ["projects"] });
      }
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  if (isLoading || !project) return <p className="text-gray-500">Loading…</p>;

  // Determine if this project has a GitHub link (for analyze button)
  const hasGitHubLink = !!(
    project.link?.includes("github.com") ||
    project.githubRepo?.includes("github.com") ||
    project.source === "github"
  );

  // Check if the profile is a shallow fallback
  let isShallowProfile = false;
  if (project.profile) {
    try {
      const bp = JSON.parse(project.profile.bulletPoints);
      isShallowProfile = Array.isArray(bp) && bp.length <= 1 && bp[0]?.startsWith("Developed a software project");
    } catch {
      isShallowProfile = false;
    }
  }

  const initial = {
    title: project.title,
    description: project.description ?? "",
    techStack: project.techStack ?? "",
    role: project.role ?? "",
    startDate: project.startDate ?? "",
    endDate: project.endDate ?? "",
    link: project.link ?? "",
    outcomes: project.outcomes ?? "",
    tags: project.tags ?? "",
    highlight: project.highlight,
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/dashboard/projects" className="text-gray-500 hover:text-gray-700">
          ← Projects
        </Link>
        <h1 className="text-2xl font-bold">Edit project</h1>
      </div>

      <ProjectForm
        initial={initial}
        onSubmit={(data) => mutation.mutate(data)}
        isSubmitting={mutation.isPending}
        error={mutation.error?.message}
      />

      {/* Analyze / Re-analyze button */}
      {hasGitHubLink && (
        <div className="mt-6">
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className={`px-5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${analyzing
                ? "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-wait"
                : isShallowProfile || !project.profile
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                  : "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
          >
            {analyzing ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing... (this may take 30-60s)
              </>
            ) : project.profile && !isShallowProfile ? (
              <>🔄 Re-analyze with AI</>
            ) : (
              <>✨ Generate AI Report</>
            )}
          </button>
          {analyzeError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{analyzeError}</p>
          )}
        </div>
      )}

      {/* Show the AI report if available */}
      {project.profile && <ProfileReport profile={project.profile} />}

      {/* Show notice for projects without a link */}
      {!hasGitHubLink && !project.profile && (
        <div className="mt-8 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
          <p className="text-gray-500 text-sm">
            Add a GitHub URL to the <span className="font-semibold">Link</span> field above, then click{" "}
            <span className="font-mono font-semibold text-blue-600">Generate AI Report</span>{" "}
            to get a comprehensive project analysis.
          </p>
        </div>
      )}
    </div>
  );
}
