"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import ExperienceForm from "@/components/ExperienceForm";

type Experience = {
    id: string;
    company: string;
    role: string;
    startDate: string | null;
    endDate: string | null;
    description: string | null;
    responsibilities: string | null;
    skills: string | null;
    type: string;
    location: string | null;
    highlight: boolean;
    createdAt: string;
    updatedAt: string;
};

export default function ExperiencePage() {
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
    const [filterType, setFilterType] = useState<string>("all");

    const { data: experiences, isLoading } = useQuery<Experience[]>({
        queryKey: ["experiences"],
        queryFn: async () => {
            const r = await fetch("/api/experiences");
            if (!r.ok) throw new Error("Failed to fetch");
            return r.json();
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const r = await fetch("/api/experiences", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!r.ok) throw new Error("Failed to create");
            return r.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["experiences"] });
            setShowForm(false);
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const r = await fetch(`/api/experiences/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!r.ok) throw new Error("Failed to update");
            return r.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["experiences"] });
            setEditingExperience(null);
            setShowForm(false);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const r = await fetch(`/api/experiences/${id}`, {
                method: "DELETE",
            });
            if (!r.ok) throw new Error("Failed to delete");
            return r.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["experiences"] });
        },
    });

    const handleSave = (data: any) => {
        if (editingExperience) {
            updateMutation.mutate({ id: editingExperience.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleEdit = (exp: Experience) => {
        setEditingExperience(exp);
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingExperience(null);
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this experience?")) {
            deleteMutation.mutate(id);
        }
    };

    const filteredExperiences =
        filterType === "all"
            ? experiences
            : experiences?.filter((exp) => exp.type === filterType);

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Work Experience</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Track internships, jobs, and volunteer work
                    </p>
                </div>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        + Add Experience
                    </button>
                )}
            </div>

            {showForm && (
                <div className="mb-6 p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                    <h2 className="text-lg font-semibold mb-4">
                        {editingExperience ? "Edit" : "Add"} Experience
                    </h2>
                    <ExperienceForm
                        experience={editingExperience || undefined}
                        onSave={handleSave}
                        onCancel={handleCancel}
                        isLoading={createMutation.isPending || updateMutation.isPending}
                    />
                </div>
            )}

            <div className="mb-4 flex gap-2">
                <button
                    onClick={() => setFilterType("all")}
                    className={`px-3 py-1 rounded-lg text-sm ${filterType === "all"
                            ? "bg-blue-600 text-white"
                            : "border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                >
                    All
                </button>
                <button
                    onClick={() => setFilterType("internship")}
                    className={`px-3 py-1 rounded-lg text-sm ${filterType === "internship"
                            ? "bg-blue-600 text-white"
                            : "border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                >
                    Internships
                </button>
                <button
                    onClick={() => setFilterType("full-time")}
                    className={`px-3 py-1 rounded-lg text-sm ${filterType === "full-time"
                            ? "bg-blue-600 text-white"
                            : "border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                >
                    Full-time
                </button>
                <button
                    onClick={() => setFilterType("part-time")}
                    className={`px-3 py-1 rounded-lg text-sm ${filterType === "part-time"
                            ? "bg-blue-600 text-white"
                            : "border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                >
                    Part-time
                </button>
                <button
                    onClick={() => setFilterType("volunteer")}
                    className={`px-3 py-1 rounded-lg text-sm ${filterType === "volunteer"
                            ? "bg-blue-600 text-white"
                            : "border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                >
                    Volunteer
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-12 text-gray-500">Loading...</div>
            ) : filteredExperiences && filteredExperiences.length > 0 ? (
                <div className="space-y-4">
                    {filteredExperiences.map((exp) => (
                        <div
                            key={exp.id}
                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold">{exp.role}</h3>
                                        <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                            {exp.type}
                                        </span>
                                        {!exp.highlight && (
                                            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                                Hidden
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {exp.company}
                                        {exp.location && ` • ${exp.location}`}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {exp.startDate || "?"} – {exp.endDate || "Present"}
                                    </p>
                                    {exp.description && (
                                        <p className="text-sm mt-2">{exp.description}</p>
                                    )}
                                    {exp.responsibilities && (
                                        <div className="mt-2 text-sm">
                                            {exp.responsibilities.split("\n").filter(Boolean).map((line, i) => (
                                                <div key={i} className="text-gray-700 dark:text-gray-300">
                                                    {line}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {exp.skills && (
                                        <p className="text-xs text-gray-500 mt-2">
                                            <span className="font-medium">Skills:</span> {exp.skills}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={() => handleEdit(exp)}
                                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(exp.id)}
                                        disabled={deleteMutation.isPending}
                                        className="px-3 py-1 text-sm border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                    <p className="text-gray-500 mb-4">
                        {filterType === "all"
                            ? "No experiences yet"
                            : `No ${filterType} experiences`}
                    </p>
                    {!showForm && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Add Your First Experience
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
