"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";

export default function NewJobPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const mutation = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() || null, company: company.trim() || null, url: url.trim() || null, description }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.error ?? "Failed to create");
      }
      return r.json();
    },
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      router.push(`/dashboard/jobs/${job.id}`);
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/dashboard/jobs" className="text-gray-500 hover:text-gray-700">← Jobs</Link>
        <h1 className="text-2xl font-bold">Add job</h1>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (description.trim()) mutation.mutate();
        }}
        className="max-w-xl space-y-4"
      >
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">Job title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
          />
        </div>
        <div>
          <label htmlFor="company" className="block text-sm font-medium mb-1">Company</label>
          <input
            id="company"
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
          />
        </div>
        <div>
          <label htmlFor="url" className="block text-sm font-medium mb-1">Job URL</label>
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">Job description *</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={12}
            placeholder="Paste the full job description here..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
          />
        </div>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {mutation.isPending ? "Saving…" : "Save job"}
        </button>
      </form>
    </div>
  );
}
