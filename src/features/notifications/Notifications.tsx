import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Check, Trash2, Heart, MessageSquare, UserPlus, AtSign, BarChart2, Target, ArrowLeft } from 'lucide-react';
import { useNavigation } from '@/store/navigation';
import { useAuth } from '@/store/auth';
import { 
  AppNotification, 
  subscribeToNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  clearAllNotifications 
} from '@/services/notifications';

const iconMap = {
  like: { icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  comment: { icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  follow: { icon: UserPlus, color: 'text-green-500', bg: 'bg-green-500/10' },
  mention: { icon: AtSign, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  poll: { icon: BarChart2, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  challenge_vote: { icon: Target, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
};

const messageMap = {
  like: 'liked your post.',
  comment: 'commented on your post.',
  follow: 'started following you.',
  mention: 'mentioned you in a post or comment.',
  poll: 'voted in your poll.',
  challenge_vote: 'voted for your challenge entry.',
};

export default function Notifications() {
  const { pop, push, stack } = useNavigation();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  
  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = subscribeToNotifications(user.uid, (data, unread) => {
      setNotifications(data);
      setUnreadCount(unread);
    });
    
    return () => unsubscribe();
  }, [user]);

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllNotificationsAsRead(user.uid);
  };
  
  const handleClearAll = async () => {
    if (!user) return;
    await clearAllNotifications(user.uid);
  };
  
  const handleNotificationClick = async (notif: AppNotification) => {
    if (!user) return;
    if (!notif.isRead) {
      await markNotificationAsRead(user.uid, notif.id);
    }
    
    // Navigate based on type
    if (notif.type === 'follow') {
      push('profile', { userId: notif.actorId });
    } else if (notif.type === 'challenge_vote' && notif.challengeId) {
      push('challenges'); 
    }
  };

  const requestPushPermission = async () => {
    if (!('Notification' in window)) return;
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // FCM token request would go here in a full integration
        alert('Push notifications enabled!');
      }
    } catch(e) {
      console.error(e);
    }
  };

  const filtered = notifications.filter(n => filter === 'all' || !n.isRead);
  const isRoot = stack.length === 1;

  return (
    <div className="w-full min-h-full pt-12 px-4 pb-32">
      <header className="mb-6 flex justify-between items-start">
        <div className="flex items-center gap-3 mb-2">
          {!isRoot && (
            <button 
              onClick={pop}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-3xl font-display font-black tracking-tight text-white flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                key={unreadCount}
                className="w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold"
              >
                {unreadCount}
              </motion.span>
            )}
          </h1>
        </div>
        
        {'Notification' in window && Notification.permission !== 'granted' && (
           <button 
             onClick={requestPushPermission}
             className="px-3 py-1.5 rounded-full bg-blue-600/20 text-blue-400 text-xs font-bold uppercase hover:bg-blue-600/30 transition-colors"
           >
             Enable Push
           </button>
        )}
      </header>

      {/* Controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              filter === 'all' ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              filter === 'unread' ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Unread
          </button>
        </div>
        
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              title="Mark all as read"
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              title="Clear all"
              className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12 text-white/50 glass-card"
            >
              No notifications here.
            </motion.div>
          ) : (
            filtered.map((notif, index) => {
              const IconData = iconMap[notif.type] || iconMap['mention'];
              const Icon = IconData.icon;
              
              return (
                <motion.div
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all flex gap-4 ${
                    !notif.isRead 
                      ? 'bg-blue-900/20 border border-blue-500/30' 
                      : 'bg-white/5 border border-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${IconData.bg}`}>
                    <Icon className={`w-6 h-6 ${IconData.color}`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-white/90 text-sm">
                        <span className="font-bold text-white">
                          {notif.actorProfile?.displayName || 'Someone'}
                        </span>{' '}
                        {messageMap[notif.type]}
                      </p>
                      {!notif.isRead && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
