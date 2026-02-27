"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ProjectForm } from "@/components/ProjectForm";
import Link from "next/link";

export default function NewProjectPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const r = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.error ?? "Failed to create");
      }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.push("/dashboard/projects");
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/dashboard/projects" className="text-gray-500 hover:text-gray-700">← Projects</Link>
        <h1 className="text-2xl font-bold">Add project</h1>
      </div>
      <ProjectForm
        initial={{}}
        onSubmit={(data) => mutation.mutate(data)}
        isSubmitting={mutation.isPending}
        error={mutation.error?.message}
      />
    </div>
  );
}
