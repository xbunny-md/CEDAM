import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, TrendingUp, Clock, Flame, Bell } from 'lucide-react';
import { useNavigation } from '@/store/navigation';
import { useAuth } from '@/store/auth';
import { useFeed } from '@/services/useFeed';
import { subscribeToNotifications } from '@/services/notifications';
import PostCard from './PostCard';

export default function Home() {
  const { push } = useNavigation();
  const { user } = useAuth();
  const [feedType, setFeedType] = useState<'latest' | 'popular' | 'trending'>('latest');
  const { posts, loading } = useFeed(feedType);
  
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToNotifications(user.uid, (_, unread) => {
      setUnreadCount(unread);
    });
    return () => unsubscribe();
  }, [user]);

  return (
    <div className="w-full min-h-full pt-12 px-4 pb-32">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-black tracking-tight text-white mb-1">
            LUGA BOYZ
          </h1>
          <p className="text-sm font-medium text-blue-400">Mwanalugali Boys Social Hub</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => push('notifications')}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-[#0a0a0a] flex items-center justify-center"
                >
                  <span className="text-[10px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
          
          <button 
            onClick={() => push('leaderboard')}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-yellow-400 hover:bg-white/20 transition-colors"
          >
            <Sparkles className="w-5 h-5" />
          </button>
          <button 
            onClick={() => push('about')}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 p-[2px] overflow-hidden hover:scale-105 transition-transform"
          >
            <div className="w-full h-full bg-[#0a0a0a] rounded-full flex items-center justify-center">
              <img 
                src="https://i.ibb.co/chDNHsvK/1788680057122.png" 
                alt="Creator" 
                className="w-full h-full object-cover rounded-full"
              />
            </div>
          </button>
        </div>
      </header>

      {/* Feed Filter */}
      <div className="flex gap-3 mb-6">
        <button 
          onClick={() => setFeedType('latest')}
          className={`px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2 transition-colors ${feedType === 'latest' ? 'bg-white text-black' : 'glass-panel text-white/70 hover:bg-white/10'}`}
        >
          <Clock className="w-4 h-4" /> Latest
        </button>
        <button 
          onClick={() => setFeedType('popular')}
          className={`px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2 transition-colors ${feedType === 'popular' ? 'bg-white text-black' : 'glass-panel text-white/70 hover:bg-white/10'}`}
        >
          <Flame className="w-4 h-4" /> Popular
        </button>
        <button 
          onClick={() => setFeedType('trending')}
          className={`px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2 transition-colors ${feedType === 'trending' ? 'bg-white text-black' : 'glass-panel text-white/70 hover:bg-white/10'}`}
        >
          <TrendingUp className="w-4 h-4" /> Trending
        </button>
      </div>

      {/* Feed */}
      <div className="flex flex-col gap-4">
        {loading ? (
          // Skeletons
          [1, 2, 3].map((i) => (
            <div key={i} className="glass-card animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-white/10" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-white/10 rounded" />
                  <div className="h-3 w-16 bg-white/10 rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-white/10 rounded" />
                <div className="h-4 w-3/4 bg-white/10 rounded" />
              </div>
            </div>
          ))
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-white/50">
            <p>No posts found. Be the first to post!</p>
          </div>
        ) : (
          posts.map((post: any) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
  );
}
