import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">404</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">This page could not be found.</p>
      <Link
        href="/"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Go home
      </Link>
    </div>
  );
}
