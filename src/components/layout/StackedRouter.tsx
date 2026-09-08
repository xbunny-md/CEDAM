import { motion, AnimatePresence } from 'motion/react';
import { useNavigation, ScreenId } from '@/store/navigation';
import Home from '@/features/feed/Home';
import Discover from '@/features/discover/Discover';
import Challenges from '@/features/challenges/Challenges';
import ChallengeDetail from '@/features/challenges/ChallengeDetail';
import Leaderboard from '@/features/leaderboard/Leaderboard';
import Notifications from '@/features/notifications/Notifications';
import Profile from '@/features/profile/Profile';
import About from '@/features/profile/About';
import AdminPanel from '@/features/admin/AdminPanel';
import Settings from '@/features/profile/Settings';
import ChatList from '@/features/chat/ChatList';
import ChatRoom from '@/features/chat/ChatRoom';
import UserList from '@/features/profile/UserList';
import React, { useEffect } from 'react';

// Map screen IDs to components
const ScreenComponents: Record<ScreenId, React.FC<any>> = {
  home: Home,
  discover: Discover,
  challenges: Challenges,
  challengeDetail: ChallengeDetail,
  leaderboard: Leaderboard,
  notifications: Notifications,
  profile: Profile,
  about: About,
  admin: AdminPanel,
  settings: Settings,
  chatList: ChatList,
  chatRoom: ChatRoom,
  userList: UserList
};

export default function StackedRouter() {
  const { stack, pop } = useNavigation();

  // Handle Android back button
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      if (stack.length > 1) {
        pop();
      }
    };
    
    // Push dummy states so the hardware back button can be intercepted
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [stack.length, pop]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <AnimatePresence>
        {stack.map((screen, index) => {
          const isTop = index === stack.length - 1;
          const ScreenComponent = ScreenComponents[screen.id];
          const isRoot = index === 0;

          return (
            <motion.div
              key={`${screen.id}-${index}`}
              className="absolute inset-0 w-full h-full bg-[#0a0a0a] shadow-[-10px_0_30px_rgba(0,0,0,0.5)] overflow-y-auto overflow-x-hidden pb-24 safe-pb"
              initial={isRoot ? { x: 0 } : { x: '100%' }}
              animate={{ 
                x: 0,
                scale: isTop ? 1 : 0.95, // Scale down screens behind
                opacity: isTop ? 1 : 0.6, 
              }}
              exit={{ x: '100%', opacity: 1, scale: 1 }}
              transition={{
                type: 'spring',
                damping: 25,
                stiffness: 200,
                mass: 0.8,
              }}
              drag={isRoot ? false : 'x'}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0, right: 1 }}
              onDragEnd={(e, { offset, velocity }) => {
                const swipeThreshold = 100; // pixels
                const velocityThreshold = 500; // px/s
                if (offset.x > swipeThreshold || velocity.x > velocityThreshold) {
                  pop();
                }
              }}
              style={{
                zIndex: index,
                // Ensure touch events don't conflict heavily with scrolling
                touchAction: isTop ? 'pan-y' : 'none',
              }}
            >
              {/* Optional Drag Handle visual cue for non-root screens */}
              {!isRoot && (
                <div className="absolute left-0 top-0 bottom-0 w-4 z-50 flex items-center justify-center opacity-0">
                  {/* Edge swipe area */}
                </div>
              )}
              <ScreenComponent {...screen.props} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
