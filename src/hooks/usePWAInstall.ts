import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function getInitialEnv() {
  if (typeof window === 'undefined') {
    return {
      isStandalone: false,
      isIOS: false,
      isAndroid: false,
      isInAppBrowser: false,
      isInIframe: false,
    };
  }
  const ua = window.navigator.userAgent || '';
  const lowerUa = ua.toLowerCase();
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  const isIOS = /iphone|ipad|ipod/.test(lowerUa);
  const isAndroid = /android/.test(lowerUa);
  const isInAppBrowser = /telegram|tgwebview|whatsapp|fban|fbav|instagram|vkclient|gsa\/|; wv\)/i.test(ua);
  let isInIframe = false;
  try {
    isInIframe = window.self !== window.top;
  } catch {
    isInIframe = true;
  }

  return {
    isStandalone,
    isIOS,
    isAndroid,
    isInAppBrowser,
    isInIframe,
  };
}

export function usePWAInstall() {
  const initial = getInitialEnv();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(initial.isStandalone);
  const [isIOS] = useState(initial.isIOS);
  const [isAndroid] = useState(initial.isAndroid);
  const [isInAppBrowser] = useState(initial.isInAppBrowser);
  const [isInIframe] = useState(initial.isInIframe);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.warn('PWA install error:', err);
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    isAndroid,
    isInAppBrowser,
    isInIframe,
    install,
  };
}
