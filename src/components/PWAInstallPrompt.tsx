import React, { useEffect, useState } from "react";
import { Download, Share, X, ExternalLink, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showAndroidBanner, setShowAndroidBanner] = useState(false);
  const [showIOSBanner, setShowIOSBanner] = useState(false);
  const [isOldDomain, setIsOldDomain] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hostname === "grt.madanimedia.com") {
      setIsOldDomain(true);
    }
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes("android-app://");

    if (isStandalone) return;

    if (
      localStorage.getItem("pwa_installed") === "true" ||
      localStorage.getItem("pwa_dismissed") === "true"
    ) {
      return;
    }

    const handleAppInstalled = () => {
      localStorage.setItem("pwa_installed", "true");
      setShowAndroidBanner(false);
      setShowIOSBanner(false);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowAndroidBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const ua = window.navigator.userAgent.toLowerCase();
    const isIOS =
      /iphone|ipad|ipod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isSafari =
      /safari/.test(ua) &&
      !/chrome|crios|crmo|firefox|fxios|edg|edge|opr|opera/.test(ua);

    if (isIOS && isSafari && !isStandalone) {
      const timer = setTimeout(() => setShowIOSBanner(true), 1200);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("appinstalled", handleAppInstalled);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    }

    return () => {
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem("pwa_installed", "true");
    } else {
      localStorage.setItem("pwa_dismissed", "true");
    }
    setShowAndroidBanner(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa_dismissed", "true");
    setShowAndroidBanner(false);
    setShowIOSBanner(false);
  };

  if (isOldDomain) {
    return (
      <div className="fixed inset-x-0 top-0 z-50 bg-amber-500 text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-3 sm:flex-row">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="rounded-full bg-amber-600/60 p-2">
              <AlertTriangle className="h-5 w-5 text-amber-100" />
            </div>
            <p className="text-xs font-semibold leading-relaxed sm:text-sm">
              ആപ്പ് പുതിയ ഡൊമെയ്‌നിലേക്ക് (grtapp.in) മാറിയിരിക്കുന്നു. തടസ്സമില്ലാതെ ഉപയോഗിക്കാൻ പുതിയ ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യുക / തുറക്കുക.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              window.location.href = "https://grtapp.in";
            }}
            className="w-full shrink-0 gap-1.5 bg-white font-bold text-amber-900 shadow hover:bg-amber-100 sm:w-auto"
          >
            <ExternalLink className="h-4 w-4" />
            പുതിയ ആപ്പിലേക്ക് മാറുക
          </Button>
        </div>
      </div>
    );
  }

  if (showAndroidBanner) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in fade-in slide-in-from-bottom-5">
        <div className="rounded-2xl border border-blue-200 bg-white/95 p-4 shadow-xl backdrop-blur-md dark:border-blue-900 dark:bg-slate-900/95">
          <div className="flex items-start gap-3">
            <img src="/icon-192x192.png" alt="GRT" className="h-11 w-11 rounded-xl object-contain shadow-sm" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">GRT Portal</h3>
              <p className="mt-0.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                GRT ആപ്പ് നിങ്ങളുടെ ഫോണിൽ ഇൻസ്റ്റാൾ ചെയ്യണോ?
              </p>
            </div>
            <button onClick={handleDismiss} className="text-slate-400 hover:text-slate-600" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={handleDismiss} className="h-8 text-xs">
              പിന്നീട്
            </Button>
            <Button size="sm" onClick={handleInstallClick} className="h-8 gap-1.5 bg-blue-600 px-3 text-xs text-white hover:bg-blue-700">
              <Download className="h-3.5 w-3.5" />
              ഇൻസ്റ്റാൾ ചെയ്യുക
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (showIOSBanner) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in fade-in slide-in-from-bottom-5">
        <div className="rounded-2xl border border-blue-200 bg-white/95 p-4 shadow-xl backdrop-blur-md dark:border-blue-900 dark:bg-slate-900/95">
          <div className="flex items-start gap-3">
            <img src="/icon-192x192.png" alt="GRT" className="h-11 w-11 rounded-xl object-contain shadow-sm" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">GRT Portal</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യാൻ താഴെയുള്ള <span className="inline-flex items-center font-bold text-blue-600"><Share className="mx-0.5 inline h-3.5 w-3.5" /> Share</span> ബട്ടൺ അമർത്തി <strong className="font-semibold text-slate-900 dark:text-white">&apos;Add to Home Screen&apos;</strong> തിരഞ്ഞെടുക്കുക.
              </p>
            </div>
            <button onClick={handleDismiss} className="text-slate-400 hover:text-slate-600" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-end">
            <Button variant="outline" size="sm" onClick={handleDismiss} className="h-8 text-xs">
              പിന്നീട്
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
