// components/pwa/InstallPrompt.tsx
'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
    setIsIOS(/iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()));

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (isStandalone || dismissed) return null;
  if (!deferredPrompt && !isIOS) return null;

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  return (
    <div className="fixed bottom-4 inset-x-4 md:inset-x-auto md:right-4 md:w-80 bg-white border border-[#EDEFF0] rounded-lg shadow-lg p-4 z-50">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 text-[#55606E] text-sm"
        aria-label="Dismiss"
      >
        ✕
      </button>
      {isIOS ? (
        <p className="text-sm text-[#232E3D] pr-4">
          Install Matata: tap the Share icon, then "Add to Home Screen".
        </p>
      ) : (
        <>
          <p className="text-sm text-[#232E3D] mb-3 pr-4">
            Install Matata for quicker access and offline support.
          </p>
          <button
            onClick={handleInstall}
            className="w-full px-4 py-2 bg-[#006EB5] text-white text-sm font-medium rounded hover:bg-[#005a94]"
          >
            Install App
          </button>
        </>
      )}
    </div>
  );
}