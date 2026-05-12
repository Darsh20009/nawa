import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("nawa_pwa_dismissed");
    if (dismissed) return;

    const installed = window.matchMedia("(display-mode: standalone)").matches;
    if (installed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show after 3 seconds
      setTimeout(() => setShow(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    await deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") {
      setShow(false);
    }
    setInstalling(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    sessionStorage.setItem("nawa_pwa_dismissed", "true");
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-50"
        >
          <div className="bg-[#0D1B3E] text-white rounded-2xl shadow-2xl overflow-hidden border border-white/10">
            {/* Gold accent line */}
            <div className="h-0.5 w-full bg-gradient-to-r from-[#C9A96E] via-yellow-300 to-[#C9A96E]" />
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                  <Smartphone className="w-5 h-5 text-[#C9A96E]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-white">
                    {isAr ? "ثبّت تطبيق نوى" : "Install Nawa App"}
                  </h3>
                  <p className="text-xs text-white/60 mt-0.5 leading-relaxed">
                    {isAr
                      ? "احصل على تجربة أفضل مع تطبيقنا. بدون متجر، مباشرة على هاتفك."
                      : "Better experience as an app. No app store needed, install directly."}
                  </p>
                </div>
                <button onClick={handleDismiss} className="p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0">
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleInstall}
                  disabled={installing}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#C9A96E] hover:bg-[#b8934d] text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  {installing ? (isAr ? "جاري التثبيت..." : "Installing...") : (isAr ? "تثبيت التطبيق" : "Install App")}
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-3 py-2 text-xs text-white/50 hover:text-white/80 transition-colors"
                >
                  {isAr ? "لاحقاً" : "Later"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
