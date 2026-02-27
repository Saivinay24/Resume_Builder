"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Repo = {
  id: number;
  full_name: string;
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  topics?: string[];
  updated_at: string;
};

export default function GitHubImportPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: repos, isLoading, error } = useQuery<Repo[]>({
    queryKey: ["github-repos"],
    queryFn: async () => {
      const r = await fetch("/api/github/repos");
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.error ?? "Failed to fetch");
      }
      return r.json();
    },
  });
  const mutation = useMutation({
    mutationFn: async (fullName: string) => {
      const r = await fetch("/api/github/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, title: fullName.split("/").pop() }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.error ?? "Failed to import");
      }
      return r.json() as Promise<{ id: string }>;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.push(`/dashboard/projects/${project.id}`);
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/dashboard/projects" className="text-gray-500 hover:text-gray-700">← Projects</Link>
        <h1 className="text-2xl font-bold">Import from GitHub</h1>
      </div>
      {error && (
        <p className="text-amber-600 dark:text-amber-400 mb-4">
          {(error as Error).message}. Sign in with GitHub on the sign-in page to connect your account.
        </p>
      )}
      {isLoading && <p className="text-gray-500">Loading repos…</p>}
      {!isLoading && repos && (
        <ul className="space-y-2">
          {repos.map((repo) => (
            <li
              key={repo.id}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div>
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 dark:text-blue-400"
                >
                  {repo.full_name}
                </a>
                {repo.description && (
                  <p className="text-sm text-gray-500 mt-1">{repo.description}</p>
                )}
                <div className="flex gap-2 mt-1 text-xs text-gray-500">
                  {repo.language && <span>{repo.language}</span>}
                  {repo.stargazers_count > 0 && <span>★ {repo.stargazers_count}</span>}
                  {repo.topics?.slice(0, 3).map((t) => (
                    <span key={t} className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => mutation.mutate(repo.full_name)}
                disabled={mutation.isPending}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Import
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
