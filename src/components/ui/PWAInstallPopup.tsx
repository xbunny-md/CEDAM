import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const PWAInstallPopup: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    if (isInstalled) {
      setIsVisible(false);
      return;
    }

    const interval = setInterval(() => {
      if (!isVisible && (isInstallable || isIOS)) {
        setIsVisible(true);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isInstalled, isInstallable, isIOS, isVisible]);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (isInstalled) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[100]"
        >
          <div className="glass-card flex flex-col gap-4 relative border-white/10 shadow-2xl bg-black/80 backdrop-blur-2xl">
            <button 
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-white/50 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-4">
              <img src="/pwa-192x192.png" alt="LUGA BOYZ" className="w-14 h-14 rounded-xl shadow-lg border border-white/10" />
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight leading-tight">Get the LUGA BOYZ App</h3>
                <p className="text-sm text-white/70 mt-1">Install for a faster and smoother experience.</p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-2">
              <button
                onClick={handleDismiss}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/80 font-medium hover:bg-white/5 transition-colors text-sm"
              >
                Not Now
              </button>
              
              {isInstallable ? (
                <button
                  onClick={async () => {
                    const success = await install();
                    if (success) setIsVisible(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Install App
                </button>
              ) : isIOS ? (
                <button
                  onClick={() => setShowIOSGuide(true)}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Install on iOS
                </button>
              ) : null}
            </div>
          </div>
        </motion.div>
      )}
      
      {showIOSGuide && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-3xl glass-card bg-[#0a0a0a]/95 border-white/10"
          >
            <h3 className="text-xl font-bold text-white mb-4">Install on iPhone / iPad</h3>
            <div className="space-y-4 text-white/80">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">1</div>
                <p>Tap the <strong>Share</strong> button in Safari's bottom toolbar.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">2</div>
                <p>Scroll down and tap <strong>Add to Home Screen</strong>.</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowIOSGuide(false);
                handleDismiss();
              }}
              className="mt-8 w-full rounded-xl bg-white/10 py-3 text-sm font-bold text-white hover:bg-white/20 transition-colors"
            >
              Got it
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
