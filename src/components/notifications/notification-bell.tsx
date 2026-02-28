'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from '@/lib/hooks/use-notifications';
import { useAuth } from '@/lib/hooks/use-auth';
import { useRealtimeNotifications } from '@/lib/hooks/use-realtime';
import { EmptyState, BellIcon } from '@/components/empty-state';
import type { Notification } from '@/types';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { data: notifications } = useNotifications();
  const { data: unreadCount } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  useRealtimeNotifications(user?.id);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const formatNotification = (n: Notification) => {
    const actor = n.actor?.name ?? 'Someone';
    switch (n.type) {
      case 'ticket_assigned': return `${actor} assigned you a ticket`;
      case 'comment_added': return `${actor} commented on a ticket`;
      case 'mentioned': return `${actor} mentioned you in a comment`;
      default: return n.type;
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-1.5 text-content-secondary hover:text-content-primary active:text-content-primary rounded transition-colors duration-[120ms]"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {(unreadCount ?? 0) > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
            {unreadCount! > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-surface-tertiary border border-border-subtle rounded-lg z-50 max-h-96 overflow-y-auto animate-fade-in">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border-subtle">
            <h3 className="text-xs font-medium uppercase tracking-wide text-content-muted">Notifications</h3>
            {(unreadCount ?? 0) > 0 && (
              <button
                onClick={() => markAllAsRead.mutate()}
                className="text-xs text-blue-600 hover:underline active:text-blue-800 rounded transition-colors duration-[120ms]"
              >
                Mark all read
              </button>
            )}
          </div>

          {!notifications?.length ? (
            <EmptyState
              icon={<BellIcon className="w-8 h-8" />}
              title="No notifications"
              description="You're all caught up."
              compact
            />
          ) : (
            <div>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-3 py-2 border-b border-border-subtle last:border-b-0 hover:bg-hover active:bg-hover transition-colors duration-[120ms] ${
                    !n.read ? 'bg-blue-500/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-content-primary">
                        {formatNotification(n)}
                      </p>
                      {n.ticket && (
                        <Link
                          href={`/ticket/${n.ticket_id}`}
                          className="text-xs text-blue-600 hover:underline truncate block"
                          onClick={() => {
                            if (!n.read) markAsRead.mutate(n.id);
                            setOpen(false);
                          }}
                        >
                          {(n.ticket as { title: string }).title}
                        </Link>
                      )}
                      <span className="text-xs text-content-muted">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                    </div>
                    {!n.read && (
                      <button
                        onClick={() => markAsRead.mutate(n.id)}
                        className="text-xs text-content-muted hover:text-content-secondary active:text-content-primary rounded-full flex-shrink-0 mt-1 transition-colors duration-[120ms] cursor-pointer"
                        title="Mark as read"
                      >
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
