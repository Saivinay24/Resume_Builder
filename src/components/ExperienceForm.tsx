"use client";

import { useState } from "react";

type ExperienceFormProps = {
    experience?: {
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
    };
    onSave: (data: any) => void;
    onCancel: () => void;
    isLoading?: boolean;
};

export default function ExperienceForm({
    experience,
    onSave,
    onCancel,
    isLoading,
}: ExperienceFormProps) {
    const [formData, setFormData] = useState({
        company: experience?.company || "",
        role: experience?.role || "",
        startDate: experience?.startDate || "",
        endDate: experience?.endDate || "",
        description: experience?.description || "",
        responsibilities: experience?.responsibilities || "",
        skills: experience?.skills || "",
        type: experience?.type || "internship",
        location: experience?.location || "",
        highlight: experience?.highlight !== undefined ? experience.highlight : true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]:
                type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Company <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
                        placeholder="e.g., Google, Microsoft"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Role/Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
                        placeholder="e.g., Software Engineering Intern"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
                    >
                        <option value="internship">Internship</option>
                        <option value="part-time">Part-time</option>
                        <option value="full-time">Full-time</option>
                        <option value="volunteer">Volunteer</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Start Date</label>
                    <input
                        type="text"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
                        placeholder="e.g., Jan 2023"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        End Date
                        <span className="text-xs text-gray-500 ml-1">(leave empty if current)</span>
                    </label>
                    <input
                        type="text"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
                        placeholder="e.g., May 2023 or Present"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
                    placeholder="e.g., San Francisco, CA or Remote"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
                    placeholder="Brief overview of the role"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">
                    Responsibilities & Achievements
                </label>
                <textarea
                    name="responsibilities"
                    value={formData.responsibilities}
                    onChange={handleChange}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 font-mono text-sm"
                    placeholder="One bullet point per line:&#10;- Developed feature X that improved Y by Z%&#10;- Collaborated with team of N engineers&#10;- Implemented A using B and C"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Tip: Start each line with a dash (-) and use action verbs. Quantify results when possible.
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">
                    Skills Used
                </label>
                <input
                    type="text"
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
                    placeholder="e.g., Python, React, AWS, Docker (comma-separated)"
                />
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    name="highlight"
                    checked={formData.highlight}
                    onChange={handleChange}
                    className="rounded"
                />
                <label className="text-sm">
                    Include in resume by default
                </label>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {isLoading ? "Saving..." : experience ? "Update" : "Add"} Experience
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}
