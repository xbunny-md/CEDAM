import { useState, useEffect } from 'react';
import { Settings, Award, Grid, Image, Flame, LogOut, Edit2, Bookmark, ArrowLeft, UserPlus, UserCheck, Calendar, Zap, Trophy, Shield, Circle, PieChart, Activity, ThumbsUp, Database, MessageCircle } from 'lucide-react';
import { useNavigation } from '@/store/navigation';
import { useAuth } from '@/store/auth';
import { logoutUser } from '@/services/auth';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/services/users';
import { getUserPosts, getSavedPosts, Post } from '@/services/posts';
import { useFollow } from '@/hooks/useFollow';
import EditProfileSheet from './EditProfileSheet';
import PostCard from '../feed/PostCard';
import UserAvatar from '@/components/ui/UserAvatar';

import { BADGES } from '@/services/points';
import { Medal } from 'lucide-react';

// Rank computation helper
const getRankInfo = (points: number) => {
  if (points < 100) return { name: 'Novice', color: 'text-gray-400', bg: 'bg-gray-400', max: 100, icon: Circle };
  if (points < 300) return { name: 'Bronze', color: 'text-amber-600', bg: 'bg-amber-600', max: 300, icon: Shield };
  if (points < 600) return { name: 'Silver', color: 'text-slate-300', bg: 'bg-slate-300', max: 600, icon: Award };
  if (points < 1000) return { name: 'Gold', color: 'text-yellow-400', bg: 'bg-yellow-400', max: 1000, icon: Trophy };
  return { name: 'Diamond', color: 'text-cyan-400', bg: 'bg-cyan-400', max: points + 500, icon: Zap }; // Unlimited
};

export default function Profile({ userId }: { userId?: string }) {
  const { push, pop, stack } = useNavigation();
  const { profile: currentUserProfile, user: currentUser } = useAuth();
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'achievements'>('posts');
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  const isOwnProfile = !userId || userId === currentUser?.uid;

  useEffect(() => {
    let targetUid = userId || currentUser?.uid;
    
    if (isOwnProfile && currentUserProfile) {
      setProfile(currentUserProfile);
      setLoading(false);
    } else if (userId) {
      setLoading(true);
      getDoc(doc(db, 'users', userId))
        .then(docSnap => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }

    if (targetUid) {
      setPostsLoading(true);
      getUserPosts(targetUid).then(setPosts).finally(() => setPostsLoading(false));
      if (isOwnProfile) {
        getSavedPosts(targetUid).then(setSavedPosts);
      }
    }
  }, [isOwnProfile, userId, currentUserProfile, currentUser?.uid]);

  const { isFollowing, toggleFollow, canFollow } = useFollow(profile?.uid || '');

  const handleLogout = async () => {
    await logoutUser();
  };

  const isRoot = stack.length === 1;

  if (loading) {
    return <div className="w-full h-full flex items-center justify-center text-white/50">Loading profile...</div>;
  }

  if (!profile) return <div className="w-full h-full flex items-center justify-center text-white/50">User not found</div>;

  const joinDate = profile.createdAt?.toDate ? profile.createdAt.toDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown';
  
  const rankInfo = getRankInfo(profile.points || 0);
  const progressPercent = Math.min(100, Math.max(0, ((profile.points || 0) / rankInfo.max) * 100));

  return (
    <div className="w-full min-h-full pb-32">
      {/* Cover Photo */}
      <div className="h-48 bg-gradient-to-tr from-blue-600 via-indigo-700 to-purple-800 relative">
        <div className="absolute inset-0 bg-black/20" />
        
        {!isRoot && (
          <button 
            onClick={pop}
            className="absolute top-12 left-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-colors z-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        
        {isOwnProfile && isRoot && (
          <button 
            onClick={handleLogout}
            className="absolute top-12 left-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-colors z-10"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}

          {isOwnProfile && currentUser?.email === 'jkambi00@gmail.com' && (
            <button 
              onClick={() => push('admin')}
              className="absolute top-12 right-16 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-red-500 hover:bg-black/50 transition-colors z-10"
              title="Admin Console"
            >
              <Database className="w-5 h-5 text-red-400" />
            </button>
          )}
          
          {isOwnProfile && (
            <button 
              onClick={() => push('settings')}
              className="absolute top-12 right-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-colors z-10"
            >
            <Settings className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="px-4 -mt-16 relative z-10">
        <div className="flex justify-between items-end mb-4">
          {/* Avatar */}
          <div className="w-32 h-32 rounded-full bg-[#0a0a0a] p-1.5 relative shrink-0">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-[2px]">
              <UserAvatar 
                src={profile.avatarUrl} 
                name={profile.displayName || profile.username || 'User'} 
                size="xl" 
                className="w-full h-full"
              />
            </div>
            {/* Online indicator */}
            <div className="absolute bottom-3 right-3 w-4 h-4 rounded-full bg-green-500 border-2 border-[#0a0a0a]" title="Online Status" />
            
            {isOwnProfile && (
              <button 
                onClick={() => setIsEditOpen(true)}
                className="absolute top-0 right-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-[#0a0a0a]"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="flex flex-col items-end gap-2">
            {isOwnProfile ? (
              <button 
                onClick={() => setIsEditOpen(true)}
                className="mb-2 px-6 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold hover:bg-white/20 transition-colors text-sm"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-2 mb-2">
                {canFollow && (
                  <button 
                    onClick={toggleFollow}
                    className={`px-6 py-2 flex items-center gap-2 rounded-full font-semibold transition-colors text-sm shadow-lg ${
                      isFollowing ? 'bg-white/10 text-white hover:bg-white/20 border border-white/10' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/25'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4" /> Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" /> Follow
                      </>
                    )}
                  </button>
                )}
                <button 
                  onClick={() => push('chatRoom', { targetUser: profile })}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {/* Rank badge top right */}
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold uppercase tracking-widest ${rankInfo.color}`}>
              <rankInfo.icon className="w-3 h-3" />
              {rankInfo.name}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white mb-0.5">{profile.displayName}</h1>
            {profile.points && profile.points > 300 && (
              <Award className="w-5 h-5 text-blue-400" title="Verified Member" />
            )}
          </div>
          <p className="text-blue-400 font-medium mb-3 text-sm">@{profile.username}</p>
          <p className="text-white/80 text-sm leading-relaxed max-w-[90%] mb-4">
            {profile.bio || (isOwnProfile ? "No bio yet. Tap Edit Profile to add one." : "No bio.")}
          </p>
          
          <div className="flex items-center gap-4 text-xs text-white/50">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Joined {joinDate}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <button 
            onClick={() => push('userList', { type: 'followers', userId: profile.uid })}
            className="glass-card !p-3 text-center rounded-2xl bg-white/5 hover:bg-white/10 transition-colors w-full"
          >
            <span className="block text-xl font-bold text-white mb-1">{profile.followersCount || 0}</span>
            <span className="text-[10px] text-white/50 uppercase tracking-widest font-semibold flex items-center justify-center gap-1">
              Followers
            </span>
          </button>
          <button 
            onClick={() => push('userList', { type: 'following', userId: profile.uid })}
            className="glass-card !p-3 text-center rounded-2xl bg-white/5 hover:bg-white/10 transition-colors w-full"
          >
            <span className="block text-xl font-bold text-white mb-1">{profile.followingCount || 0}</span>
            <span className="text-[10px] text-white/50 uppercase tracking-widest font-semibold flex items-center justify-center gap-1">
              Following
            </span>
          </button>
          <div className="glass-card !p-3 text-center rounded-2xl bg-white/5 hover:bg-white/10 transition-colors">
            <span className="block text-xl font-bold text-yellow-400 mb-1">{profile.points || 0}</span>
            <span className="text-[10px] text-yellow-400/70 uppercase tracking-widest font-semibold flex items-center justify-center gap-1">
              Points
            </span>
          </div>
          <div className="glass-card !p-3 text-center rounded-2xl bg-white/5 hover:bg-white/10 transition-colors">
            <span className="block text-xl font-bold text-white mb-1">{profile.postsCount || 0}</span>
            <span className="text-[10px] text-white/50 uppercase tracking-widest font-semibold flex items-center justify-center gap-1">
              <Grid className="w-3 h-3" /> Posts
            </span>
          </div>
          <div className="glass-card !p-3 text-center rounded-2xl bg-white/5 hover:bg-white/10 transition-colors">
            <span className="block text-xl font-bold text-white mb-1">{profile.likesReceived || 0}</span>
            <span className="text-[10px] text-white/50 uppercase tracking-widest font-semibold flex items-center justify-center gap-1">
              <ThumbsUp className="w-3 h-3" /> Likes
            </span>
          </div>
          <div className="glass-card !p-3 text-center rounded-2xl bg-white/5 hover:bg-white/10 transition-colors">
            <span className="block text-xl font-bold text-white mb-1">{profile.challengesJoined || 0}</span>
            <span className="text-[10px] text-white/50 uppercase tracking-widest font-semibold flex items-center justify-center gap-1">
              <Flame className="w-3 h-3" /> Challs
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 mb-4 sticky top-14 bg-[#0a0a0a]/90 backdrop-blur-md z-20">
          <button 
            onClick={() => setActiveTab('posts')}
            className={`flex-1 pb-4 flex justify-center transition-all ${activeTab === 'posts' ? 'text-white border-b-2 border-white' : 'text-white/40 hover:text-white/70'}`}
          >
            <Grid className="w-5 h-5" />
          </button>
          {isOwnProfile && (
            <button 
              onClick={() => setActiveTab('saved')}
              className={`flex-1 pb-4 flex justify-center transition-all ${activeTab === 'saved' ? 'text-white border-b-2 border-white' : 'text-white/40 hover:text-white/70'}`}
            >
              <Bookmark className="w-5 h-5" />
            </button>
          )}
          <button 
            onClick={() => setActiveTab('achievements')}
            className={`flex-1 pb-4 flex justify-center transition-all ${activeTab === 'achievements' ? 'text-white border-b-2 border-white' : 'text-white/40 hover:text-white/70'}`}
          >
            <Trophy className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'posts' ? (
          <div className="flex flex-col gap-4 mt-4">
            {postsLoading ? (
              <div className="text-center py-12 text-white/50">Loading posts...</div>
            ) : posts.length > 0 ? (
              posts.map(post => <PostCard key={post.id} post={post} />)
            ) : (
              <div className="text-center py-16 text-white/50 glass-card bg-white/5 mx-2">
                <Grid className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="font-medium">No posts yet.</p>
                {isOwnProfile && <p className="text-xs mt-2 opacity-70">Share something with the community.</p>}
              </div>
            )}
          </div>
        ) : activeTab === 'saved' ? (
          <div className="flex flex-col gap-4 mt-4">
            {postsLoading ? (
              <div className="text-center py-12 text-white/50">Loading saved posts...</div>
            ) : savedPosts.length > 0 ? (
              savedPosts.map(post => <PostCard key={post.id} post={post} />)
            ) : (
              <div className="text-center py-16 text-white/50 glass-card bg-white/5 mx-2">
                <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="font-medium">Your saved posts will appear here.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-6 mt-4">
            {/* Rank Progress */}
            <div className="glass-card bg-gradient-to-br from-white/5 to-white/[0.02]">
              <div className="flex justify-between items-end mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-1">Current Rank</h3>
                  <div className={`text-2xl font-bold flex items-center gap-2 ${rankInfo.color}`}>
                    <rankInfo.icon className="w-6 h-6" />
                    {rankInfo.name}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-white">{profile.points || 0}</span>
                  <span className="text-white/50 text-xs ml-1">/ {rankInfo.max} XP</span>
                </div>
              </div>
              
              <div className="h-3 w-full bg-black/50 rounded-full overflow-hidden border border-white/10">
                <div 
                  className={`h-full ${rankInfo.bg} rounded-full transition-all duration-1000 ease-out`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-white/40 mt-3 text-center">
                Earn {Math.max(0, rankInfo.max - (profile.points || 0))} more points to reach the next rank!
              </p>
            </div>

            {/* Badges */}
            <div className="glass-card">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Medal className="w-4 h-4" /> Earned Badges
              </h3>
              
              {profile.badges && profile.badges.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {profile.badges.map((badgeId, idx) => {
                     const badgeInfo = BADGES.find(b => b.id === badgeId);
                     if (!badgeInfo) return null;
                     return (
                       <div key={idx} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 text-center hover:bg-white/10 transition-colors">
                         <div className={`w-12 h-12 rounded-full bg-white/10 flex items-center justify-center ${badgeInfo.color} mb-1 shadow-inner shadow-white/5`}>
                           <Medal className="w-6 h-6" />
                         </div>
                         <span className="font-bold text-sm text-white">{badgeInfo.name}</span>
                         <span className="text-[10px] text-white/50 leading-tight">{badgeInfo.description}</span>
                       </div>
                     );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="w-10 h-10 mx-auto text-white/10 mb-3" />
                  <p className="text-white/40 text-sm">No badges earned yet. Participate in challenges and post content to earn some!</p>
                </div>
              )}
            </div>

            {/* Community Activity Summary */}
            <div className="glass-card">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Activity Impact
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <Grid className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Content Creator</p>
                      <p className="text-xs text-white/50">{profile.postsCount || 0} posts published</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                      <Flame className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Challenge Participant</p>
                      <p className="text-xs text-white/50">{profile.challengesJoined || 0} challenges joined</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center">
                      <ThumbsUp className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Community Loved</p>
                      <p className="text-xs text-white/50">{profile.likesReceived || 0} likes received</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        )}
      </div>
      
      {isOwnProfile && <EditProfileSheet isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} />}
    </div>
  );
}
