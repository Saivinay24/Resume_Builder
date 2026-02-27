"use client";

import { useState } from "react";

type Initial = {
  title?: string;
  description?: string;
  techStack?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  link?: string;
  outcomes?: string;
  tags?: string;
  highlight?: boolean;
};

export function ProjectForm({
  initial,
  onSubmit,
  isSubmitting,
  error,
}: {
  initial: Initial;
  onSubmit: (data: Record<string, unknown>) => void;
  isSubmitting: boolean;
  error?: string;
}) {
  const [title, setTitle] = useState(initial.title ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [techStack, setTechStack] = useState(initial.techStack ?? "");
  const [role, setRole] = useState(initial.role ?? "");
  const [startDate, setStartDate] = useState(initial.startDate ?? "");
  const [endDate, setEndDate] = useState(initial.endDate ?? "");
  const [link, setLink] = useState(initial.link ?? "");
  const [outcomes, setOutcomes] = useState(initial.outcomes ?? "");
  const [tags, setTags] = useState(initial.tags ?? "");
  const [highlight, setHighlight] = useState(initial.highlight ?? true);

  // README auto-fill state
  const [readmeText, setReadmeText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showReadmeArea, setShowReadmeArea] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  async function handleReadmeAnalyze() {
    if (!readmeText.trim() || readmeText.trim().length < 20) {
      setAnalyzeError("Paste a README with at least 20 characters.");
      return;
    }

    setIsAnalyzing(true);
    setAnalyzeError(null);

    try {
      const response = await fetch("/api/projects/analyze-readme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readme: readmeText }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        setAnalyzeError(err.error || "Analysis failed. Try again.");
        return;
      }

      const data = await response.json();

      // Auto-fill all fields from AI analysis
      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.techStack) setTechStack(data.techStack);
      if (data.outcomes) setOutcomes(data.outcomes);
      if (data.tags) setTags(data.tags);
      if (data.role) setRole(data.role);

      // Collapse the README area after success
      setShowReadmeArea(false);
    } catch (err) {
      setAnalyzeError("Network error. Check your connection.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      techStack: techStack.trim() || null,
      role: role.trim() || null,
      startDate: startDate.trim() || null,
      endDate: endDate.trim() || null,
      link: link.trim() || null,
      outcomes: outcomes.trim() || null,
      tags: tags.trim() || null,
      highlight,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* README Auto-Fill Section */}
      <div className="border border-dashed border-blue-300 dark:border-blue-700 rounded-lg p-4 bg-blue-50/50 dark:bg-blue-950/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">✨</span>
            <span className="font-medium text-sm">Auto-fill from README</span>
          </div>
          <button
            type="button"
            onClick={() => setShowReadmeArea(!showReadmeArea)}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
          >
            {showReadmeArea ? "Hide" : "Paste README →"}
          </button>
        </div>

        {!showReadmeArea && (
          <p className="text-xs text-gray-500">
            Paste your project&apos;s README and AI will auto-fill all fields below.
          </p>
        )}

        {showReadmeArea && (
          <div className="space-y-3 mt-3">
            <textarea
              value={readmeText}
              onChange={(e) => setReadmeText(e.target.value)}
              placeholder="Paste your README.md content here...&#10;&#10;# Project Name&#10;Description of the project..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm font-mono"
            />
            {analyzeError && (
              <p className="text-red-600 text-xs">{analyzeError}</p>
            )}
            <button
              type="button"
              onClick={handleReadmeAnalyze}
              disabled={isAnalyzing || readmeText.trim().length < 20}
              className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Analyzing README...
                </>
              ) : (
                <>✨ Auto-Fill Fields</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Manual fields (always visible and editable) */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">Title *</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
        />
      </div>
      <div>
        <label htmlFor="techStack" className="block text-sm font-medium mb-1">Tech stack (comma-separated)</label>
        <input
          id="techStack"
          type="text"
          value={techStack}
          onChange={(e) => setTechStack(e.target.value)}
          placeholder="React, Node.js, PostgreSQL"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
        />
      </div>
      <div>
        <label htmlFor="role" className="block text-sm font-medium mb-1">Your role</label>
        <input
          id="role"
          type="text"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium mb-1">Start date</label>
          <input
            id="startDate"
            type="text"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Jan 2024"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium mb-1">End date</label>
          <input
            id="endDate"
            type="text"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="Present"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
          />
        </div>
      </div>
      <div>
        <label htmlFor="link" className="block text-sm font-medium mb-1">Link (demo or repo)</label>
        <input
          id="link"
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
        />
      </div>
      <div>
        <label htmlFor="outcomes" className="block text-sm font-medium mb-1">Outcomes / metrics (one per line)</label>
        <textarea
          id="outcomes"
          value={outcomes}
          onChange={(e) => setOutcomes(e.target.value)}
          rows={4}
          placeholder="Improved performance by 40%&#10;Reduced load time by 2s"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
        />
      </div>
      <div>
        <label htmlFor="tags" className="block text-sm font-medium mb-1">Tags for matching (comma-separated)</label>
        <input
          id="tags"
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="React, Python, ML, fullstack"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          id="highlight"
          type="checkbox"
          checked={highlight}
          onChange={(e) => setHighlight(e.target.checked)}
          className="rounded border-gray-300"
        />
        <label htmlFor="highlight" className="text-sm">Include in resume by default</label>
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
