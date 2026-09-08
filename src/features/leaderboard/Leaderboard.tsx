import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'motion/react';
import { Trophy, Star, PenTool, Crown, Activity, Heart, Medal, ArrowUp } from 'lucide-react';
import { getLeaderboard, BADGES } from '@/services/points';
import { useNavigation } from '@/store/navigation';
import UserAvatar from '@/components/ui/UserAvatar';

function AnimatedCounter({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 100, damping: 20 });
  
  useEffect(() => {
    spring.set(value);
  }, [value, spring]);
  
  const display = useTransform(spring, (current) => Math.round(current).toLocaleString());
  
  return <motion.span>{display}</motion.span>;
}

type BoardType = 'points' | 'postsCount' | 'likesReceived' | 'challengesJoined' | 'challengeVotesReceived';

const BOARDS: { id: BoardType; label: string; icon: React.FC<any>; color: string; desc: string }[] = [
  { id: 'points', label: 'Rising Star', icon: Star, color: 'text-yellow-400', desc: 'Overall most points earned' },
  { id: 'postsCount', label: 'Top Creator', icon: PenTool, color: 'text-purple-400', desc: 'Most posts created' },
  { id: 'likesReceived', label: 'Most Liked', icon: Heart, color: 'text-pink-400', desc: 'Most likes received' },
  { id: 'challengesJoined', label: 'Most Active', icon: Activity, color: 'text-blue-400', desc: 'Joined the most challenges' },
  { id: 'challengeVotesReceived', label: 'Most Voted', icon: Crown, color: 'text-orange-400', desc: 'Most votes in challenges' },
];

export default function Leaderboard() {
  const { push } = useNavigation();
  const [activeBoard, setActiveBoard] = useState<BoardType>('points');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getLeaderboard(activeBoard)
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(console.error);
  }, [activeBoard]);

  return (
    <div className="w-full min-h-full pt-12 px-4 pb-32">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-black tracking-tight text-white mb-2">
            Leaderboard
          </h1>
          <p className="text-white/60">Top rankings across the community.</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
          <Trophy className="w-6 h-6 text-black" />
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2">
        {BOARDS.map(board => (
          <button
            key={board.id}
            onClick={() => setActiveBoard(board.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
              activeBoard === board.id 
                ? 'bg-white text-black' 
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <board.icon className={`w-4 h-4 ${activeBoard === board.id ? 'text-black' : board.color}`} />
            {board.label}
          </button>
        ))}
      </div>

      <div className="mb-6 glass-card p-4">
        <p className="text-white/80 font-medium text-sm">
          {BOARDS.find(b => b.id === activeBoard)?.desc}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="text-center py-12 text-white/50">Loading rankings...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-white/50 glass-card">
            No data yet for this category.
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {users.map((user, index) => (
              <motion.div
                key={user.uid}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() => push('profile', { userId: user.uid })}
                className="glass-card p-4 flex items-center gap-4 relative overflow-hidden cursor-pointer hover:bg-white/10 transition-colors"
              >
                {/* Rank Number */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 shrink-0 ${
                  index === 0 ? 'bg-yellow-400 text-black' :
                  index === 1 ? 'bg-gray-300 text-black' :
                  index === 2 ? 'bg-orange-400 text-black' :
                  'bg-white/10 text-white'
                }`}>
                  #{index + 1}
                </div>

                {/* Avatar */}
                <div className="relative z-10 shrink-0">
                  <UserAvatar 
                    src={user.avatarUrl} 
                    name={user.displayName || user.username || 'User'} 
                    size="lg" 
                  />
                  {index === 0 && (
                     <div className="absolute -top-1 -right-1 text-yellow-400">
                        <Crown className="w-4 h-4 fill-current" />
                     </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 z-10">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white">{user.displayName || 'Unknown'}</h3>
                    {user.badges && user.badges.length > 0 && (
                      <div className="flex gap-1">
                        {user.badges.slice(0, 3).map((badgeId: string, bIdx: number) => {
                          const badge = BADGES.find(b => b.id === badgeId);
                          if (!badge) return null;
                          return (
                            <motion.div 
                              key={badge.id} 
                              initial={{ scale: 0, rotate: -45 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ delay: index * 0.05 + bIdx * 0.1, type: "spring" }}
                              title={badge.name} 
                              className={`w-5 h-5 rounded-full bg-white/10 flex items-center justify-center ${badge.color}`}
                            >
                              <Medal className="w-3 h-3" />
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-white/50">@{user.username || 'user'}</p>
                </div>

                {/* Stat */}
                <div className="text-right z-10 flex flex-col items-end">
                  <motion.div 
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1 font-black text-xl text-white"
                  >
                    {activeBoard === 'points' && <Star className="w-4 h-4 text-yellow-400" />}
                    <AnimatedCounter value={user[activeBoard] || 0} />
                  </motion.div>
                  <span className="text-xs text-white/40 uppercase tracking-wider">
                    {activeBoard === 'points' ? 'pts' : BOARDS.find(b => b.id === activeBoard)?.label}
                  </span>
                </div>

                {/* Top 3 subtle background gradients */}
                {index === 0 && <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent" />}
                {index === 1 && <div className="absolute inset-0 bg-gradient-to-r from-gray-400/10 to-transparent" />}
                {index === 2 && <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent" />}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
