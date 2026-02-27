import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GitHubSyncButton } from "@/components/GitHubSyncButton";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // Get GitHub username if connected
  let githubUsername: string | undefined;
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        accounts: {
          where: { provider: "github" }
        }
      }
    });

    const githubAccount = user?.accounts.find(a => a.provider === "github");

    if (githubAccount) {
      // Try to get from session name first (GitHub sets this)
      if (session.user.name) {
        githubUsername = session.user.name;
      } else if (githubAccount.access_token) {
        // Fallback: fetch from GitHub API using correct endpoint
        try {
          const response = await fetch('https://api.github.com/user', {
            headers: {
              'Authorization': `Bearer ${githubAccount.access_token}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          });
          if (response.ok) {
            const data = await response.json();
            githubUsername = data.login;
          }
        } catch (error) {
          console.error("Error fetching GitHub username:", error);
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Add projects (manual or from GitHub), paste job descriptions, then build an ATS-friendly resume with the best projects selected.
        </p>
      </div>

      {/* GitHub Sync Section */}
      <GitHubSyncButton githubUsername={githubUsername} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/dashboard/projects"
          className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <h2 className="font-semibold">Projects</h2>
          <p className="text-sm text-gray-500">Manage your project bank</p>
        </Link>
        <Link
          href="/dashboard/experience"
          className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <h2 className="font-semibold">Experience</h2>
          <p className="text-sm text-gray-500">Track internships and jobs</p>
        </Link>
        <Link
          href="/dashboard/jobs"
          className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <h2 className="font-semibold">Jobs</h2>
          <p className="text-sm text-gray-500">Paste job descriptions</p>
        </Link>
        <Link
          href="/dashboard/build"
          className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <h2 className="font-semibold">Build resume</h2>
          <p className="text-sm text-gray-500">Match projects and export PDF</p>
        </Link>
      </div>
    </div>
  );
}
