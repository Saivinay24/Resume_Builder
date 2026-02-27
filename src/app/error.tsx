"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
        We encountered an error. You can try again or go back home.
      </p>
      <div className="flex gap-4">
        <button
          type="button"
          onClick={reset}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
