"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import GitHubImportModal from "@/components/GitHubImportModal";

type Project = {
  id: string;
  title: string;
  source: string;
  tags: string | null;
  link: string | null;
  updatedAt: string;
  hasProfile: boolean;
};

export default function ProjectsPage() {
  const [showGitHubModal, setShowGitHubModal] = useState(false);

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const r = await fetch("/api/projects");
      if (!r.ok) throw new Error("Failed to fetch");
      return r.json();
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowGitHubModal(true)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Import from GitHub
          </button>
          <Link
            href="/dashboard/projects/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Add Project
          </Link>
        </div>
      </div>

      {isLoading && <p className="text-gray-500">Loading…</p>}

      {!isLoading && (!projects || projects.length === 0) && (
        <div className="text-center py-12 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <p className="text-gray-500 mb-4">No projects yet</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowGitHubModal(true)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Import from GitHub
            </button>
            <Link
              href="/dashboard/projects/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Manually
            </Link>
          </div>
        </div>
      )}

      {!isLoading && projects && projects.length > 0 && (
        <ul className="space-y-2">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/dashboard/projects/${p.id}`}
                className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium">{p.title}</span>
                    {p.source === "github" && (
                      <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">GitHub</span>
                    )}
                    {p.hasProfile && (
                      <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">✨ AI Analyzed</span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">{p.tags ?? "—"}</span>
                </div>
                {p.link && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1 truncate">{p.link}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <GitHubImportModal
        isOpen={showGitHubModal}
        onClose={() => setShowGitHubModal(false)}
      />
    </div>
  );
}
