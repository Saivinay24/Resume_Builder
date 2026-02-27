"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type GitHubRepo = {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
    language: string | null;
    stargazers_count: number;
    topics?: string[];
    updated_at: string;
};

type GitHubImportModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

export default function GitHubImportModal({ isOpen, onClose }: GitHubImportModalProps) {
    const queryClient = useQueryClient();
    const [selectedRepoIds, setSelectedRepoIds] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [useAI, setUseAI] = useState(true); // AI analysis enabled by default

    const { data: repos, isLoading, error } = useQuery<GitHubRepo[]>({
        queryKey: ["github-repos"],
        queryFn: async () => {
            const r = await fetch("/api/github/repos");
            if (!r.ok) {
                const err = await r.json();
                throw new Error(err.error || "Failed to fetch repositories");
            }
            return r.json();
        },
        enabled: isOpen,
    });

    const importMutation = useMutation({
        mutationFn: async (repoIds: number[]) => {
            const r = await fetch("/api/github/repos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ repoIds, useAI }),
            });
            if (!r.ok) throw new Error("Failed to import");
            return r.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            const aiMessage = data.aiAnalyzed ? " with AI analysis ✨" : "";
            alert(`Successfully imported ${data.count} project(s)${aiMessage}!`);
            setSelectedRepoIds([]);
            onClose();
        },
        onError: (error: Error) => {
            alert(`Import failed: ${error.message}`);
        },
    });

    const toggleRepo = (id: number) => {
        setSelectedRepoIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (!repos) return;
        const filtered = filteredRepos();
        if (selectedRepoIds.length === filtered.length) {
            setSelectedRepoIds([]);
        } else {
            setSelectedRepoIds(filtered.map((r) => r.id));
        }
    };

    const filteredRepos = () => {
        if (!repos) return [];
        if (!searchQuery.trim()) return repos;
        const query = searchQuery.toLowerCase();
        return repos.filter(
            (r) =>
                r.name.toLowerCase().includes(query) ||
                r.description?.toLowerCase().includes(query) ||
                r.language?.toLowerCase().includes(query)
        );
    };

    const handleImport = () => {
        if (selectedRepoIds.length === 0) {
            alert("Please select at least one repository");
            return;
        }
        importMutation.mutate(selectedRepoIds);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">Import from GitHub</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search repositories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading && (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading repositories...</p>
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-12">
                            <p className="text-red-600 dark:text-red-400">
                                {error instanceof Error ? error.message : "Failed to load repositories"}
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                Make sure you signed in with GitHub
                            </p>
                        </div>
                    )}

                    {repos && repos.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-600 dark:text-gray-400">No repositories found</p>
                        </div>
                    )}

                    {repos && repos.length > 0 && (
                        <>
                            {/* Select All */}
                            <div className="mb-4 flex items-center justify-between">
                                <button
                                    onClick={toggleAll}
                                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                >
                                    {selectedRepoIds.length === filteredRepos().length ? "Deselect All" : "Select All"}
                                </button>
                                <span className="text-sm text-gray-500">
                                    {selectedRepoIds.length} selected
                                </span>
                            </div>

                            {/* Repository List */}
                            <div className="space-y-3">
                                {filteredRepos().map((repo) => (
                                    <div
                                        key={repo.id}
                                        onClick={() => toggleRepo(repo.id)}
                                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedRepoIds.includes(repo.id)
                                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                            : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedRepoIds.includes(repo.id)}
                                                onChange={() => toggleRepo(repo.id)}
                                                className="mt-1"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold truncate">{repo.name}</h3>
                                                    {repo.language && (
                                                        <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-gray-700">
                                                            {repo.language}
                                                        </span>
                                                    )}
                                                </div>
                                                {repo.description && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                                        {repo.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                    <span>⭐ {repo.stargazers_count}</span>
                                                    <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {filteredRepos().length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    No repositories match your search
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-4">
                        <input
                            type="checkbox"
                            id="useAI"
                            checked={useAI}
                            onChange={(e) => setUseAI(e.target.checked)}
                            className="rounded"
                        />
                        <label htmlFor="useAI" className="text-sm text-gray-700 dark:text-gray-300">
                            ✨ Use AI to analyze code and generate professional descriptions (recommended)
                        </label>
                    </div>
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {useAI ? "AI will read your code and create compelling project summaries" : "Basic import with README descriptions"}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={importMutation.isPending}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={selectedRepoIds.length === 0 || importMutation.isPending}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {importMutation.isPending
                                    ? "Importing..."
                                    : `Import ${selectedRepoIds.length} Project${selectedRepoIds.length !== 1 ? "s" : ""}`}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
