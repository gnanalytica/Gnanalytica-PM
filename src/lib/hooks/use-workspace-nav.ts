import { useCallback, useSyncExternalStore } from "react";

// ── Shallow URL subscription ──
//
// React-safe subscription to window.location.search via useSyncExternalStore.
// pushState / replaceState + dispatchEvent('popstate') triggers re-renders
// WITHOUT causing Next.js RSC navigations (truly shallow routing).

function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
}

function getSnapshot() {
  return window.location.search;
}

function getServerSnapshot() {
  return "";
}

/**
 * Reactive subscription to the raw URL search string.
 * Updates on pushState/replaceState (via popstate dispatch) and native back/forward.
 */
export function useShallowSearch(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// ── Internal helper ──

function notifyUrlChange() {
  window.dispatchEvent(new PopStateEvent("popstate"));
}

// ── Shallow URL mutation helpers ──

/**
 * Merge updates into the current search params (replaceState — no history entry).
 * Pass `null` to delete a param. Unmentioned params are preserved.
 */
export function shallowReplace(updates: Record<string, string | null>) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
  }
  window.history.replaceState(null, "", url.toString());
  notifyUrlChange();
}

/**
 * Replace ALL search params with `params` (replaceState — no history entry).
 * Keys listed in `preserveKeys` are carried over from the current URL.
 */
export function shallowReplaceAll(
  params: Record<string, string>,
  preserveKeys: string[] = [],
) {
  const url = new URL(window.location.href);
  const preserved: Record<string, string> = {};
  for (const key of preserveKeys) {
    const val = url.searchParams.get(key);
    if (val !== null) preserved[key] = val;
  }
  url.search = "";
  for (const [key, value] of Object.entries(preserved)) {
    url.searchParams.set(key, value);
  }
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  window.history.replaceState(null, "", url.toString());
  notifyUrlChange();
}

// ── Workspace ticket navigation ──
//
// Opening a ticket pushes a history entry so the browser back button can
// step through workspace states (open ticket A → open ticket B → back → A).
// Closing also pushes so the close action itself is a reversible step.

export function useWorkspaceNav() {
  const search = useShallowSearch();
  const ticketId = new URLSearchParams(search).get("ticket");

  const openTicket = useCallback((id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("ticket", id);
    window.history.pushState(null, "", url.toString());
    notifyUrlChange();
  }, []);

  const closeTicket = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("ticket");
    window.history.pushState(null, "", url.toString());
    notifyUrlChange();
  }, []);

  /** Navigate to a different ticket without adding a history entry (replaceState). */
  const replaceTicket = useCallback((id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("ticket", id);
    window.history.replaceState(null, "", url.toString());
    notifyUrlChange();
  }, []);

  return { ticketId, openTicket, closeTicket, replaceTicket } as const;
}
