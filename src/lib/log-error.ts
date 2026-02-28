/**
 * Centralized error logger.
 * Logs to console and provides a hook point for external services
 * (e.g. Sentry, LogRocket) without changing call sites.
 */
export function logError(error: Error, context?: Record<string, unknown>): void {
  console.error('[ErrorBoundary]', error.message, {
    stack: error.stack,
    ...context,
  });
}
