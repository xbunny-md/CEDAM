import { useState, useEffect } from 'react';
import { ArrowLeft, Moon, Sun, Download, LogOut, Info, Shield, Bell } from 'lucide-react';
import { useNavigation } from '@/store/navigation';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { logoutUser } from '@/services/auth';

export default function Settings() {
  const { pop, push, reset } = useNavigation();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    // Check initial state
    setIsLightMode(document.documentElement.classList.contains('light-mode'));
  }, []);

  const toggleTheme = () => {
    if (isLightMode) {
      document.documentElement.classList.remove('light-mode');
      setIsLightMode(false);
    } else {
      document.documentElement.classList.add('light-mode');
      setIsLightMode(true);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
  };

  return (
    <div className="w-full min-h-full pt-12 px-4 pb-32 bg-[#050505]">
      <header className="flex items-center gap-4 mb-8">
        <button 
          onClick={pop}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/80 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
      </header>

      <div className="space-y-6">
        {/* Appearance Section */}
        <section>
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3 px-2">Appearance</h2>
          <div className="glass-card !p-2 space-y-1">
            <button 
              onClick={toggleTheme}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  {isLightMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </div>
                <span className="font-medium text-white">{isLightMode ? 'Light Mode' : 'Dark Mode'}</span>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors relative ${isLightMode ? 'bg-blue-500' : 'bg-white/20'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isLightMode ? 'left-7' : 'left-1'}`} />
              </div>
            </button>
          </div>
        </section>

        {/* App Section */}
        <section>
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3 px-2">App</h2>
          <div className="glass-card !p-2 space-y-1">
            {(!isInstalled && (isInstallable || isIOS)) && (
              <button 
                onClick={install}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center">
                    <Download className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-white">Install App</span>
                </div>
              </button>
            )}
            
            <button 
              onClick={() => push('about')}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Info className="w-4 h-4" />
                </div>
                <span className="font-medium text-white">About LUGA BOYZ</span>
              </div>
            </button>

            <button 
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <span className="font-medium text-white">Notifications</span>
              </div>
            </button>
          </div>
        </section>

        {/* Account Section */}
        <section>
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3 px-2">Account</h2>
          <div className="glass-card !p-2 space-y-1">
            <button 
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="font-medium text-white">Privacy & Security</span>
              </div>
            </button>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-red-500/10 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center group-hover:bg-red-500/30">
                  <LogOut className="w-4 h-4" />
                </div>
                <span className="font-medium text-red-400">Log Out</span>
              </div>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
