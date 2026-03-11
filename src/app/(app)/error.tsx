"use client";

import { useEffect } from "react";
import { logError } from "@/lib/log-error";

/**
 * Next.js route-level error boundary for the (app) group.
 * Rendered inside the (app) layout — sidebar stays visible.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError(error, { boundary: "app-error", digest: error.digest });
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-24 px-4">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <svg
          className="w-6 h-6 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </div>
      <h2 className="text-sm font-medium text-gray-900 mb-1">
        Something went wrong
      </h2>
      <p className="text-sm text-gray-500 mb-5 max-w-md text-center">
        This page ran into an unexpected error. Your other data is safe.
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 text-sm bg-gray-900 text-white rounded-md hover:bg-hover transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
