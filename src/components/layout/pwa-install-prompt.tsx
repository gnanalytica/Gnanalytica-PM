'use client';

import { usePWAInstall } from '@/hooks/use-pwa-install';
import { useEffect, useState } from 'react';

export function PWAInstallPrompt() {
  const { showInstallPrompt, isInstalled, handleInstall, dismissPrompt } = usePWAInstall();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || !showInstallPrompt || isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-6 md:right-6 z-40 animate-slide-up">
      <div className="bg-surface-primary border border-border-subtle rounded-lg shadow-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-content-primary text-sm">
            Install Gnanalytica
          </h3>
          <p className="text-xs text-content-muted mt-1">
            Access your projects offline and get the app experience
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={dismissPrompt}
            className="px-3 py-2 text-xs font-medium text-content-secondary hover:bg-hover rounded transition-colors"
          >
            Later
          </button>
          <button
            onClick={handleInstall}
            className="px-3 py-2 text-xs font-medium text-white bg-accent hover:bg-accent-hover rounded transition-colors"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
