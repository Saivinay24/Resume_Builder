"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

interface SyncStatus {
    count: number;
    lastAnalyzed: string | null;
    profiles: Array<{
        id: string;
        repoName: string;
        category: string | null;
        lastAnalyzed: string;
    }>;
}

export function GitHubSyncButton({ githubUsername }: { githubUsername?: string }) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const queryClient = useQueryClient();

    // Fetch current sync status
    const { data: syncStatus } = useQuery<SyncStatus>({
        queryKey: ["github-sync-status"],
        queryFn: async () => {
            const res = await fetch("/api/github/deep-analyze");
            if (!res.ok) throw new Error("Failed to fetch sync status");
            return res.json();
        }
    });

    // Mutation for deep analysis
    const syncMutation = useMutation({
        mutationFn: async (forceRefresh: boolean) => {
            setIsAnalyzing(true);
            const res = await fetch("/api/github/deep-analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ githubUsername, forceRefresh })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to sync");
            }

            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["github-sync-status"] });
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            setIsAnalyzing(false);
        },
        onError: (error) => {
            console.error("Sync error:", error);
            setIsAnalyzing(false);
        }
    });

    const handleSync = () => {
        if (!githubUsername) {
            alert("Please connect your GitHub account first");
            return;
        }
        syncMutation.mutate(false);
    };

    const handleForceRefresh = () => {
        if (!githubUsername) {
            alert("Please connect your GitHub account first");
            return;
        }
        if (confirm("This will re-analyze all repositories. Continue?")) {
            syncMutation.mutate(true);
        }
    };

    const lastSyncDate = syncStatus?.lastAnalyzed
        ? new Date(syncStatus.lastAnalyzed).toLocaleDateString()
        : "Never";

    const daysSinceSync = syncStatus?.lastAnalyzed
        ? Math.floor((Date.now() - new Date(syncStatus.lastAnalyzed).getTime()) / (1000 * 60 * 60 * 24))
        : null;

    const needsSync = !syncStatus?.lastAnalyzed || (daysSinceSync !== null && daysSinceSync > 7);

    return (
        <div className="flex flex-col gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-sm">GitHub Project Profiles</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {syncStatus?.count || 0} projects analyzed • Last sync: {lastSyncDate}
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleSync}
                        disabled={isAnalyzing || !githubUsername}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${needsSync
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        <RefreshCw className={`w-4 h-4 ${isAnalyzing ? "animate-spin" : ""}`} />
                        {isAnalyzing ? "Analyzing..." : needsSync ? "Sync Now" : "Refresh"}
                    </button>

                    {syncStatus && syncStatus.count > 0 && (
                        <button
                            onClick={handleForceRefresh}
                            disabled={isAnalyzing}
                            className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                        >
                            Force Refresh
                        </button>
                    )}
                </div>
            </div>

            {/* Status Messages */}
            {needsSync && !isAnalyzing && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div className="text-xs text-yellow-700 dark:text-yellow-300">
                        <strong>Sync recommended:</strong> Your projects haven't been analyzed recently.
                        Click "Sync Now" to get AI-powered project descriptions.
                    </div>
                </div>
            )}

            {syncMutation.isSuccess && !isAnalyzing && (
                <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                    <div className="text-xs text-green-700 dark:text-green-300">
                        <strong>Sync complete!</strong> Analyzed {syncMutation.data?.count || 0} repositories.
                    </div>
                </div>
            )}

            {syncMutation.isError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
                    <div className="text-xs text-red-700 dark:text-red-300">
                        <strong>Sync failed:</strong> {(syncMutation.error as Error)?.message || "Unknown error"}
                    </div>
                </div>
            )}

            {/* Progress indicator */}
            {isAnalyzing && (
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>Analyzing repositories...</span>
                        <span>This may take 30-60 seconds</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full animate-pulse" style={{ width: "60%" }} />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        💡 Tip: This is a one-time deep analysis. Future resume builds will use cached data!
                    </p>
                </div>
            )}
        </div>
    );
}
