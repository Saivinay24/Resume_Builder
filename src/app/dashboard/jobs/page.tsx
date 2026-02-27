"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

type Job = { id: string; title: string | null; company: string | null; description: string; createdAt: string };

export default function JobsPage() {
  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ["jobs"],
    queryFn: async () => {
      const r = await fetch("/api/jobs");
      if (!r.ok) throw new Error("Failed to fetch");
      return r.json();
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Jobs</h1>
        <Link href="/dashboard/jobs/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Add job
        </Link>
      </div>
      {isLoading && <p className="text-gray-500">Loading…</p>}
      {!isLoading && (!jobs || jobs.length === 0) && (
        <p className="text-gray-500">No jobs yet. Paste a job description to match your projects.</p>
      )}
      {!isLoading && jobs && jobs.length > 0 && (
        <ul className="space-y-2">
          {jobs.map((j) => (
            <li key={j.id}>
              <Link
                href={`/dashboard/jobs/${j.id}`}
                className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <span className="font-medium">{j.title ?? "Untitled"}</span>
                {j.company && <span className="text-gray-500 ml-2">at {j.company}</span>}
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{j.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
