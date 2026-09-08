import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Trophy, Star, Users, Upload, CheckCircle } from 'lucide-react';
import { useNavigation } from '@/store/navigation';
import { getChallengeEntries, hasJoinedChallenge, joinChallenge, submitChallengeEntry, voteOnEntry, Challenge, ChallengeEntry } from '@/services/challenges';
import { useAuth } from '@/store/auth';
import UserAvatar from '@/components/ui/UserAvatar';

export default function ChallengeDetail({ challenge }: { challenge: Challenge }) {
  const { pop, push } = useNavigation();
  const { user } = useAuth();
  
  const [entries, setEntries] = useState<ChallengeEntry[]>([]);
  const [hasJoined, setHasJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  
  const [submitText, setSubmitText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);

  useEffect(() => {
    if (user && challenge.id) {
      hasJoinedChallenge(challenge.id, user.uid).then(setHasJoined);
    }
    loadEntries();
  }, [challenge.id, user]);

  const loadEntries = () => {
    setLoading(true);
    getChallengeEntries(challenge.id)
      .then(setEntries)
      .finally(() => setLoading(false));
  };

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      await joinChallenge(challenge.id);
      setHasJoined(true);
    } catch(e) {
      console.error(e);
    }
    setIsJoining(false);
  };

  const handleSubmit = async () => {
    if (!submitText.trim()) return;
    setIsSubmitting(true);
    try {
      await submitChallengeEntry(challenge.id, submitText);
      setShowSubmit(false);
      setSubmitText('');
      loadEntries();
    } catch(e) {
      console.error(e);
    }
    setIsSubmitting(false);
  };

  const handleVote = async (entryId: string) => {
    try {
      // Optimistic update
      setEntries(prev => prev.map(e => 
        e.id === entryId ? { ...e, votesCount: e.votesCount + 1, hasVoted: true } : e
      ));
      await voteOnEntry(challenge.id, entryId);
    } catch(e) {
      console.error(e);
      loadEntries(); // Revert on failure
    }
  };

  const hasSubmitted = entries.some(e => e.authorId === user?.uid);

  return (
    <div className="w-full min-h-full pb-32">
      <div className="h-48 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 relative">
        <button 
          onClick={pop}
          className="absolute top-12 left-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-colors z-10"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="absolute inset-0 bg-[url('https://api.dicebear.com/7.x/shapes/svg?seed=challenge')] opacity-30 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
      </div>

      <div className="px-4 -mt-20 relative z-10">
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-white uppercase tracking-wider">
              {challenge.type}
            </span>
            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <Star className="w-3 h-3" /> {challenge.points} pts
            </span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">{challenge.title}</h1>
          <p className="text-white/70 mb-6">{challenge.description}</p>
          
          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <div className="flex gap-4">
              <div className="flex items-center gap-1 text-white/60 text-sm">
                <Users className="w-4 h-4" /> {challenge.participantsCount} participants
              </div>
            </div>
            {!hasJoined ? (
              <button 
                onClick={handleJoin}
                disabled={isJoining}
                className="px-6 py-2 rounded-full bg-blue-600 text-white font-semibold text-sm hover:bg-blue-500 transition-colors disabled:opacity-50"
              >
                {isJoining ? 'Joining...' : 'Join Challenge'}
              </button>
            ) : (
              <div className="px-4 py-2 rounded-full bg-white/10 text-white/80 font-semibold text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" /> Joined
              </div>
            )}
          </div>
        </div>

        {hasJoined && !hasSubmitted && !showSubmit && (
          <button 
            onClick={() => setShowSubmit(true)}
            className="w-full mb-6 glass-card p-4 flex items-center justify-center gap-2 text-white font-semibold hover:bg-white/10 transition-colors"
          >
            <Upload className="w-5 h-5" /> Submit Entry
          </button>
        )}

        {showSubmit && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="glass-card p-4 mb-6"
          >
            <h3 className="text-lg font-bold text-white mb-3">Your Entry</h3>
            <textarea 
              value={submitText}
              onChange={e => setSubmitText(e.target.value)}
              placeholder="Describe your entry..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors mb-3 min-h-[100px] resize-none"
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowSubmit(false)}
                className="px-4 py-2 rounded-full text-white/60 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting || !submitText.trim()}
                className="px-6 py-2 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </motion.div>
        )}

        <h2 className="text-xl font-bold text-white mb-4">Rankings & Entries</h2>
        
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="text-center py-8 text-white/50">Loading entries...</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-white/50 glass-card">
              No entries yet. Be the first!
            </div>
          ) : (
            entries.map((entry, index) => (
              <motion.div 
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-4 relative overflow-hidden"
              >
                {index < 3 && (
                  <div className="absolute top-0 right-0 p-3 bg-gradient-to-bl from-yellow-500/20 to-transparent rounded-bl-3xl">
                    <Trophy className={`w-6 h-6 ${
                      index === 0 ? 'text-yellow-400' : 
                      index === 1 ? 'text-gray-300' : 
                      'text-orange-400'
                    }`} />
                  </div>
                )}
                
                <div className="flex items-center gap-3 mb-3 cursor-pointer" onClick={() => push('profile', { userId: entry.authorId })}>
                  <UserAvatar src={entry.authorProfile?.avatarUrl} name={entry.authorProfile?.displayName || entry.authorProfile?.username || 'User'} size="md" />
                  <div>
                    <h4 className="font-semibold text-white">{entry.authorProfile?.displayName || 'Unknown'}</h4>
                    <span className="text-xs text-white/50">@{entry.authorProfile?.username || 'user'}</span>
                  </div>
                  <div className="ml-auto mr-8 text-xl font-black text-white/20">
                    #{index + 1}
                  </div>
                </div>
                
                <p className="text-white/90 mb-4">{entry.content}</p>
                
                <div className="flex items-center justify-between border-t border-white/10 pt-3">
                  <div className="flex items-center gap-1 text-sm font-semibold text-yellow-400">
                    <Star className="w-4 h-4" /> {entry.votesCount} votes
                  </div>
                  {entry.authorId !== user?.uid && (
                    <button 
                      onClick={() => !entry.hasVoted && handleVote(entry.id)}
                      disabled={entry.hasVoted}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                        entry.hasVoted 
                          ? 'bg-white/10 text-white/50 cursor-not-allowed' 
                          : 'bg-blue-600 text-white hover:bg-blue-500'
                      }`}
                    >
                      {entry.hasVoted ? 'Voted' : 'Vote'}
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
