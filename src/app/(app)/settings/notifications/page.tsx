'use client';

import { useState, useEffect } from 'react';
import { useNotificationPrefs, useUpdateNotificationPrefs } from '@/lib/hooks/use-notification-prefs';

export default function NotificationsSettingsPage() {
  const { data: prefs, isLoading } = useNotificationPrefs();
  const updatePrefs = useUpdateNotificationPrefs();

  const [emailMode, setEmailMode] = useState<'instant' | 'digest' | 'off'>('instant');
  const [pushEnabled, setPushEnabled] = useState(true);
  const [digestEnabled, setDigestEnabled] = useState(false);

  useEffect(() => {
    if (prefs) {
      setEmailMode(prefs.email_mode ?? 'instant');
      setPushEnabled(prefs.push_enabled ?? true);
      setDigestEnabled(prefs.digest_enabled ?? false);
    }
  }, [prefs]);

  const handleSave = () => {
    updatePrefs.mutate({
      email_mode: emailMode,
      push_enabled: pushEnabled,
      digest_enabled: digestEnabled,
    });
  };

  if (isLoading) {
    return <p className="text-sm text-content-muted">Loading preferences...</p>;
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-lg font-semibold text-content-primary mb-4">Notification Preferences</h1>

      <div className="space-y-5">
        {/* Email notifications */}
        <div>
          <label className="text-[12px] font-medium text-content-primary block mb-2">
            Email Notifications
          </label>
          <div className="space-y-1.5">
            {([
              { value: 'instant' as const, label: 'Instant (all activity)' },
              { value: 'digest' as const, label: 'Daily digest only' },
              { value: 'off' as const, label: 'Off' },
            ]).map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="emailMode"
                  value={opt.value}
                  checked={emailMode === opt.value}
                  onChange={() => setEmailMode(opt.value)}
                  className="w-3.5 h-3.5 text-accent"
                />
                <span className="text-[13px] text-content-secondary">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Push notifications */}
        <div>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-[12px] font-medium text-content-primary block">Push Notifications</span>
              <span className="text-[11px] text-content-muted">Receive browser push notifications for updates</span>
            </div>
            <input
              type="checkbox"
              checked={pushEnabled}
              onChange={(e) => setPushEnabled(e.target.checked)}
              className="rounded border-border-subtle text-accent w-4 h-4"
            />
          </label>
        </div>

        {/* Daily digest */}
        <div>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-[12px] font-medium text-content-primary block">Daily Digest</span>
              <span className="text-[11px] text-content-muted">Get a daily summary email of all activity</span>
            </div>
            <input
              type="checkbox"
              checked={digestEnabled}
              onChange={(e) => setDigestEnabled(e.target.checked)}
              className="rounded border-border-subtle text-accent w-4 h-4"
            />
          </label>
        </div>

        <button
          onClick={handleSave}
          disabled={updatePrefs.isPending}
          className="px-4 py-2 text-[13px] bg-accent text-white rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {updatePrefs.isPending ? 'Saving...' : 'Save Preferences'}
        </button>

        {updatePrefs.isSuccess && (
          <p className="text-[12px] text-[#5fae7e]">Preferences saved successfully.</p>
        )}
      </div>
    </div>
  );
}
