"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";

type Profile = {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  summary: string | null;
  education: string | null;
  otherExperience: string | null;
  skills: string | null;
} | null;

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ["profile"],
    queryFn: async () => {
      const r = await fetch("/api/profile");
      if (!r.ok) throw new Error("Failed to fetch");
      return r.json();
    },
  });
  const [form, setForm] = useState<Record<string, string>>({});
  useEffect(() => {
    if (profile !== undefined && profile !== null) {
      setForm({
        fullName: profile.fullName ?? "",
        email: profile.email ?? "",
        phone: profile.phone ?? "",
        location: profile.location ?? "",
        linkedinUrl: profile.linkedinUrl ?? "",
        websiteUrl: profile.websiteUrl ?? "",
        summary: profile.summary ?? "",
        education: profile.education ?? "",
        otherExperience: profile.otherExperience ?? "",
        skills: profile.skills ?? "",
      });
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: async (body: Record<string, string | null>) => {
      const r = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error("Failed to save");
      return r.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body: Record<string, string | null> = {};
    for (const [k, v] of Object.entries(form)) {
      body[k] = typeof v === "string" && v.trim() ? v.trim() : null;
    }
    mutation.mutate(body);
  }

  if (isLoading && profile === undefined) return <p className="text-gray-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Profile (for resume)</h1>
      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium mb-1">Full name</label>
          <input
            id="fullName"
            type="text"
            value={form.fullName ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
          <input
            id="email"
            type="email"
            value={form.email ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="you@example.com"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1">Phone</label>
          <input
            id="phone"
            type="text"
            value={form.phone ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
          />
        </div>
        <div>
          <label htmlFor="location" className="block text-sm font-medium mb-1">Location</label>
          <input
            id="location"
            type="text"
            value={form.location ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
          />
        </div>
        <div>
          <label htmlFor="linkedinUrl" className="block text-sm font-medium mb-1">LinkedIn URL</label>
          <input
            id="linkedinUrl"
            type="url"
            value={form.linkedinUrl ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, linkedinUrl: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
          />
        </div>
        <div>
          <label htmlFor="websiteUrl" className="block text-sm font-medium mb-1">Website URL</label>
          <input
            id="websiteUrl"
            type="url"
            value={form.websiteUrl ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
          />
        </div>
        <div>
          <label htmlFor="summary" className="block text-sm font-medium mb-1">Summary (short bio for resume)</label>
          <textarea
            id="summary"
            value={form.summary ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
          />
        </div>
        <div>
          <label htmlFor="education" className="block text-sm font-medium mb-1">Education (e.g. degree, school, dates)</label>
          <textarea
            id="education"
            value={form.education ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, education: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
          />
        </div>
        <div>
          <label htmlFor="otherExperience" className="block text-sm font-medium mb-1">Other experience (non-project)</label>
          <textarea
            id="otherExperience"
            value={form.otherExperience ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, otherExperience: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
          />
        </div>
        <div>
          <label htmlFor="skills" className="block text-sm font-medium mb-1">Skills (comma-separated)</label>
          <input
            id="skills"
            type="text"
            value={form.skills ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))}
            placeholder="JavaScript, React, Python, SQL"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
          />
        </div>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {mutation.isPending ? "Saving…" : "Save profile"}
        </button>
      </form>
    </div>
  );
}
