import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X } from 'lucide-react';
import { useAuth } from '@/store/auth';
import { subscribeToNotifications, AppNotification } from '@/services/notifications';
import { useNavigation } from '@/store/navigation';

export default function NotificationToast() {
  const { user } = useAuth();
  const { push } = useNavigation();
  const [toast, setToast] = useState<AppNotification | null>(null);
  const [prevNotifIds, setPrevNotifIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToNotifications(user.uid, (notifications) => {
      // Find new notifications
      if (prevNotifIds.size > 0) {
        const newNotifs = notifications.filter(n => !prevNotifIds.has(n.id) && !n.isRead);
        if (newNotifs.length > 0) {
          // Show the most recent new notification
          setToast(newNotifs[0]);
          
          // Auto-hide after 4 seconds
          setTimeout(() => {
            setToast(null);
          }, 4000);
        }
      }
      
      // Update our known list of notification IDs
      setPrevNotifIds(new Set(notifications.map(n => n.id)));
    });

    return () => unsubscribe();
  }, [user, prevNotifIds]);

  const handleClick = () => {
    setToast(null);
    push('notifications');
  };

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="fixed top-4 left-4 right-4 z-[100] flex justify-center pointer-events-none"
        >
          <div 
            onClick={handleClick}
            className="w-full max-w-sm glass-card !p-4 !rounded-2xl border-white/20 shadow-2xl bg-[#0a0a0a]/90 backdrop-blur-xl pointer-events-auto cursor-pointer flex items-start gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-white mb-0.5">New Notification</h4>
              <p className="text-xs text-white/70 line-clamp-2">
                <span className="font-semibold text-white/90">{toast.actorProfile?.displayName || 'Someone'}</span> interacted with you.
              </p>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setToast(null); }}
              className="p-1 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
