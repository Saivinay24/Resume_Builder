"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

type Usage = { projectId: string; title: string; count: number };

export default function AnalyticsPage() {
  const { data: usage, isLoading } = useQuery<Usage[]>({
    queryKey: ["analytics-project-usage"],
    queryFn: async () => {
      const r = await fetch("/api/analytics/project-usage");
      if (!r.ok) throw new Error("Failed to fetch");
      return r.json();
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">← Dashboard</Link>
        <h1 className="text-2xl font-bold">Analytics</h1>
      </div>
      <h2 className="text-lg font-semibold mb-2">Most-used projects</h2>
      <p className="text-sm text-gray-500 mb-4">
        Projects that appear most often in your saved/generated resumes.
      </p>
      {isLoading && <p className="text-gray-500">Loading…</p>}
      {!isLoading && (!usage || usage.length === 0) && (
        <p className="text-gray-500">No data yet. Save some resume versions to see which projects you use most.</p>
      )}
      {!isLoading && usage && usage.length > 0 && (
        <ul className="space-y-2">
          {usage.map((u) => (
            <li key={u.projectId} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <Link href={`/dashboard/projects/${u.projectId}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                {u.title}
              </Link>
              <span className="text-sm text-gray-500">Used in {u.count} resume(s)</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
