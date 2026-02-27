"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

type Job = { id: string; title: string | null; company: string | null; url: string | null; description: string };

export default function JobDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: job, isLoading } = useQuery<Job>({
    queryKey: ["jobs", id],
    queryFn: async () => {
      const r = await fetch(`/api/jobs/${id}`);
      if (!r.ok) throw new Error("Not found");
      return r.json();
    },
  });

  if (isLoading || !job) return <p className="text-gray-500">Loading…</p>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/jobs" className="text-gray-500 hover:text-gray-700">← Jobs</Link>
          <h1 className="text-2xl font-bold">{job.title ?? "Untitled"}</h1>
          {job.company && <span className="text-gray-500">at {job.company}</span>}
        </div>
        <Link
          href={`/dashboard/build/new?jobId=${job.id}`}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Build resume for this job
        </Link>
      </div>
      {job.url && (
        <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
          <a href={job.url} target="_blank" rel="noopener noreferrer">{job.url}</a>
        </p>
      )}
      <div className="prose dark:prose-invert max-w-none">
        <pre className="whitespace-pre-wrap text-sm bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">{job.description}</pre>
      </div>
    </div>
  );
}
