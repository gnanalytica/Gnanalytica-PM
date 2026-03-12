'use client';

import Link from 'next/link';

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-primary">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold text-content-primary mb-4">
          Authentication Error
        </h1>
        <p className="text-content-secondary mb-6">
          There was a problem exchanging your authentication code. This might happen if:
        </p>
        <ul className="text-left text-content-secondary mb-6 space-y-2">
          <li>• The authentication code expired</li>
          <li>• The code was already used</li>
          <li>• Your session timed out</li>
          <li>• There's a configuration issue</li>
        </ul>
        <div className="space-y-3">
          <Link
            href="/login"
            className="block px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors"
          >
            Try Logging In Again
          </Link>
          <Link
            href="/"
            className="block px-4 py-2 bg-surface-secondary hover:bg-surface-tertiary text-content-primary rounded-lg transition-colors"
          >
            Go to Home
          </Link>
        </div>
        <p className="text-sm text-content-muted mt-6">
          If the problem persists, please contact support.
        </p>
      </div>
    </div>
  );
}
