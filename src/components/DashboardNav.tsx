"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

type User = { id?: string; name?: string | null; email?: string | null; image?: string | null };

export function DashboardNav({ user }: { user: User }) {
  const pathname = usePathname();
  const nav = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/projects", label: "Projects" },
    { href: "/dashboard/experience", label: "Experience" },
    { href: "/dashboard/jobs", label: "Jobs" },
    { href: "/dashboard/build", label: "Build resume" },
    { href: "/dashboard/analytics", label: "Analytics" },
    { href: "/dashboard/settings", label: "Settings" },
  ];
  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 sm:py-0 sm:h-14 min-h-14">
        <nav className="flex flex-wrap gap-3 sm:gap-6">
          {nav.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm font-medium ${pathname === href ? "text-blue-600" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-sm text-gray-500 truncate max-w-[180px] sm:max-w-none" title={user.email ?? user.name ?? undefined}>
            {user.email ?? user.name ?? "User"}
          </span>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
