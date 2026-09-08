import { motion } from 'motion/react';
import { Home, Compass, Plus, Target, User } from 'lucide-react';
import { useNavigation, ScreenId } from '@/store/navigation';
import { cn } from '@/lib/utils';

export default function BottomNav() {
  const { stack, reset, push, setCreateSheetOpen } = useNavigation();
  const currentScreen = stack[stack.length - 1]?.id;

  const handleTabClick = (tabId: ScreenId) => {
    if (currentScreen === tabId) return; // Already there
    
    // Bottom tabs should reset the stack to avoid endless piling and 
    // to allow 'isRoot' logic in screens (like Profile) to display root actions (Logout) properly.
    reset(tabId);
  };

  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'discover', icon: Compass, label: 'Discover' },
  ] as const;

  const rightTabs = [
    { id: 'challenges', icon: Target, label: 'Challenges' },
    { id: 'profile', icon: User, label: 'Profile' },
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <div className="glass-card !rounded-[2rem] flex items-center justify-between px-6 py-4 shadow-[0_20px_40px_rgba(0,0,0,0.4)] border-white/10 relative overflow-hidden">
          
          {/* Subtle moving glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 translate-x-[-100%] animate-[shimmer_3s_infinite]" />

          {/* Left Tabs */}
          <div className="flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className="relative p-2 flex flex-col items-center justify-center text-white/60 hover:text-white transition-colors"
              >
                <tab.icon className={cn("w-6 h-6 transition-all duration-300", currentScreen === tab.id ? "text-blue-400 scale-110" : "")} />
                {currentScreen === tab.id && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-2 w-1 h-1 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Center Create Button */}
          <button
            onClick={() => setCreateSheetOpen(true)}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-7 h-7" />
          </button>

          {/* Right Tabs */}
          <div className="flex gap-6">
            {rightTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className="relative p-2 flex flex-col items-center justify-center text-white/60 hover:text-white transition-colors"
              >
                <tab.icon className={cn("w-6 h-6 transition-all duration-300", currentScreen === tab.id ? "text-purple-400 scale-110" : "")} />
                {currentScreen === tab.id && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-2 w-1 h-1 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]"
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
