import React, { useState, useEffect } from 'react';
import { Trophy, Target, Star, Users, Plus } from 'lucide-react';
import { useNavigation } from '@/store/navigation';
import { getChallenges, Challenge } from '@/services/challenges';
import { motion } from 'motion/react';

export default function Challenges() {
  const { push } = useNavigation();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChallenges().then(data => {
      setChallenges(data);
      setLoading(false);
    });
  }, []);

  const activeChallenges = challenges.filter(c => c.status === 'active');
  const upcomingChallenges = challenges.filter(c => c.status === 'upcoming');

  return (
    <div className="w-full min-h-full pt-12 px-4 pb-32">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-black tracking-tight text-white mb-2">
            Challenges
          </h1>
          <p className="text-white/60">Compete, vote, and earn points.</p>
        </div>
        {/* Placeholder for creating challenges, could be restricted to admins */}
        <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
          <Plus className="w-5 h-5" />
        </button>
      </header>

      {loading ? (
        <div className="text-center py-12 text-white/50">Loading challenges...</div>
      ) : challenges.length === 0 ? (
        <div className="text-center py-12 text-white/50 glass-card">
          No challenges available right now. Check back later!
        </div>
      ) : (
        <>
          {activeChallenges.map((challenge, index) => (
            <motion.div 
              key={challenge.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => push('challengeDetail', { challenge })}
              className="glass-card mb-8 p-0 overflow-hidden relative group cursor-pointer hover:border-white/20 transition-colors"
            >
              <div className="h-48 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 relative">
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute inset-0 bg-[url('https://api.dicebear.com/7.x/shapes/svg?seed=challenge')] opacity-30 mix-blend-overlay" />
                
                <div className="absolute top-4 right-4 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Active</span>
                </div>
              </div>
              
              <div className="p-6 relative">
                <div className="absolute -top-10 left-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 p-[2px] shadow-lg">
                  <div className="w-full h-full bg-[#111] rounded-2xl flex items-center justify-center">
                     <Trophy className="w-8 h-8 text-yellow-400" />
                  </div>
                </div>
                
                <div className="mt-8">
                  <h2 className="text-2xl font-bold text-white mb-2">{challenge.title}</h2>
                  <p className="text-white/70 text-sm mb-6 line-clamp-2">
                    {challenge.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1 text-white/60 text-sm">
                        <Users className="w-4 h-4" /> {challenge.participantsCount}
                      </div>
                      <div className="flex items-center gap-1 text-yellow-400 text-sm font-semibold">
                        <Star className="w-4 h-4" /> +{challenge.points} pts
                      </div>
                    </div>
                    <button className="px-6 py-2 rounded-full bg-white text-black font-semibold text-sm hover:scale-105 active:scale-95 transition-transform">
                      View
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {upcomingChallenges.length > 0 && (
            <>
              <h3 className="text-lg font-bold text-white mb-4">Upcoming Challenges</h3>
              <div className="flex flex-col gap-4">
                {upcomingChallenges.map((challenge, i) => (
                  <motion.div 
                    key={challenge.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => push('challengeDetail', { challenge })}
                    className="glass-card flex items-center gap-4 p-4 cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <Target className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{challenge.title}</h4>
                      <p className="text-sm text-white/50">{challenge.type}</p>
                    </div>
                    <div className="text-right">
                      <span className="block text-yellow-400 font-bold text-sm">+{challenge.points}</span>
                      <span className="text-xs text-white/40">pts</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
