import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <span className="font-semibold text-lg">Resume Builder</span>
          <nav className="flex gap-4">
            <Link href="/auth/signin" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 md:py-24 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
            Match your projects to every job
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-10">
            Store your projects once. Paste a job description. Get an ATS-friendly resume with the best projects selected automatically.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg"
            >
              Get started free
            </Link>
            <Link
              href="/auth/signin"
              className="px-8 py-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold text-lg"
            >
              Sign in
            </Link>
          </div>
        </section>

        <section className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold text-center mb-12 text-gray-900 dark:text-white">
              How it works
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400 font-bold">
                  1
                </div>
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Add your projects</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Enter projects manually or connect GitHub to import repos. Tag skills and outcomes for matching.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400 font-bold">
                  2
                </div>
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Paste the job</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Paste the job description (or pick a saved job). We rank your projects by keyword and skill match.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400 font-bold">
                  3
                </div>
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Export your resume</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Select and reorder projects, then download an ATS-friendly PDF or DOCX. Save versions per job.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 border-t border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-4 text-center max-w-2xl">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Built for students and job seekers
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              One project bank. Any job. Tailored resumes in minutes—no rewriting from scratch.
            </p>
            <Link
              href="/auth/signup"
              className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Create your account
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 py-8">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span>Resume Builder — match projects to jobs, export ATS resumes</span>
          <div className="flex gap-6">
            <Link href="/auth/signin" className="hover:text-gray-700 dark:hover:text-gray-300">Sign in</Link>
            <Link href="/auth/signup" className="hover:text-gray-700 dark:hover:text-gray-300">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
