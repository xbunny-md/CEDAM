import React, { useState, useEffect } from 'react';
import { Search, Users, Hash, Trophy, UserPlus, UserCheck, Flame } from 'lucide-react';
import { useNavigation } from '@/store/navigation';
import { searchUsers, getTrendingUsers, getNewUsers, UserProfile } from '@/services/users';
import { searchPosts, getTrendingPosts, Post } from '@/services/posts';
import { useFollow } from '@/hooks/useFollow';
import { motion, AnimatePresence } from 'motion/react';
import PostCard from '../feed/PostCard';
import UserAvatar from '@/components/ui/UserAvatar';

const UserCard: React.FC<{ user: UserProfile }> = ({ user }) => {
  const { isFollowing, toggleFollow, canFollow } = useFollow(user.uid);
  const { push } = useNavigation();
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => push('profile', { userId: user.uid })}
      className="glass-card flex flex-col p-4 cursor-pointer hover:bg-white/5 transition-colors gap-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserAvatar src={user.avatarUrl} name={user.displayName || user.username || 'User'} size="lg" />
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-white truncate">{user.displayName}</span>
            <span className="text-sm text-white/50 truncate">@{user.username}</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-blue-400 font-medium">{user.followersCount || 0} followers</span>
              <span className="text-white/30 text-[10px]">•</span>
              <span className="text-xs text-yellow-400 font-medium">{user.points || 0} pts</span>
            </div>
          </div>
        </div>
        
        {canFollow && (
          <button 
            onClick={(e) => { e.stopPropagation(); toggleFollow(); }}
            className={`p-2 rounded-full shrink-0 transition-colors ${
              isFollowing 
                ? 'bg-white/10 text-white' 
                : 'bg-blue-600 text-white hover:bg-blue-500'
            }`}
          >
            {isFollowing ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
          </button>
        )}
      </div>

      {user.badges && user.badges.length > 0 && (
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pt-2 border-t border-white/5">
          {user.badges.slice(0, 3).map((badge, idx) => (
            <span key={idx} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/80 text-[10px] whitespace-nowrap">
              {badge}
            </span>
          ))}
          {user.badges.length > 3 && (
            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-[10px] whitespace-nowrap">
              +{user.badges.length - 3}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function Discover() {
  const { push } = useNavigation();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const [searchResults, setSearchResults] = useState<{users: UserProfile[], posts: Post[]}>({ users: [], posts: [] });
  const [trendingUsers, setTrendingUsers] = useState<UserProfile[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [newMembers, setNewMembers] = useState<UserProfile[]>([]);
  
  useEffect(() => {
    // Load default sections
    getTrendingUsers().then(setTrendingUsers).catch(console.error);
    getNewUsers().then(setNewMembers).catch(console.error);
    getTrendingPosts().then(setTrendingPosts).catch(console.error);
  }, []);

  useEffect(() => {
    if (searchTerm.trim().length === 0) {
      setIsSearching(false);
      setSearchResults({ users: [], posts: [] });
      return;
    }
    
    setIsSearching(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const [users, posts] = await Promise.all([
          searchUsers(searchTerm),
          searchPosts(searchTerm)
        ]);
        setSearchResults({ users, posts });
      } catch (e) {
        console.error(e);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <div className="w-full min-h-full pt-12 px-4 pb-32">
      <h1 className="text-3xl font-display font-black tracking-tight text-white mb-6">
        Discover
      </h1>

      {/* Search Bar */}
      <div className="relative mb-8 z-10">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-white/40" />
        </div>
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full glass-panel !rounded-full pl-12 pr-4 py-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          placeholder="Search Luga Boyz..."
        />
      </div>

      <AnimatePresence mode="wait">
        {isSearching ? (
          <motion.div
            key="search-results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            {searchResults.users.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-white/80 mb-4">Users</h2>
                <div className="flex flex-col gap-3">
                  {searchResults.users.map(user => (
                    <UserCard key={user.uid} user={user} />
                  ))}
                </div>
              </section>
            )}
            
            {searchResults.posts.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-white/80 mb-4">Posts</h2>
                <div className="flex flex-col gap-4">
                  {searchResults.posts.map(post => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              </section>
            )}

            {searchResults.users.length === 0 && searchResults.posts.length === 0 && (
              <div className="text-center py-12 text-white/40">
                No results found for "{searchTerm}"
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="discover-content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Categories */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button className="glass-card flex flex-col items-center justify-center p-6 gap-3 hover:bg-white/10 transition-colors group">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <span className="font-semibold text-white">Top Users</span>
              </button>
              <button 
                onClick={() => push('challenges')}
                className="glass-card flex flex-col items-center justify-center p-6 gap-3 hover:bg-white/10 transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                  <Trophy className="w-6 h-6" />
                </div>
                <span className="font-semibold text-white">Challenges</span>
              </button>
            </div>

            {/* Trending Users */}
            {trendingUsers.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4 text-white/80">
                  <Users className="w-5 h-5 text-blue-400" />
                  <h2 className="text-lg font-semibold">Trending Members</h2>
                </div>
                <div className="flex flex-col gap-3">
                  {trendingUsers.map(user => (
                    <UserCard key={user.uid} user={user} />
                  ))}
                </div>
              </section>
            )}

            {/* Trending Topics */}
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-4 text-white/80">
                <Hash className="w-5 h-5 text-pink-400" />
                <h2 className="text-lg font-semibold">Trending Topics</h2>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { tag: 'Reality', count: '3.4k' },
                  { tag: 'Challenges', count: '2.1k' },
                  { tag: 'LugaBoyzDesign', count: '1.2k' },
                  { tag: 'Mwanalugali', count: '856' },
                ].map((topic, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-white/20">0{i + 1}</span>
                      <span className="font-medium text-white">#{topic.tag}</span>
                    </div>
                    <span className="text-sm text-white/40">{topic.count} posts</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Trending Posts */}
            {trendingPosts.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4 text-white/80">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <h2 className="text-lg font-semibold">Popular Content</h2>
                </div>
                <div className="flex flex-col gap-4">
                  {trendingPosts.map(post => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              </section>
            )}

            {/* New Members - Horizontal Scroll */}
            {newMembers.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4 text-white/80">
                  <Users className="w-5 h-5 text-green-400" />
                  <h2 className="text-lg font-semibold">New Additions</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar -mx-4 px-4">
                  {newMembers.map((user) => (
                    <div 
                      key={user.uid} 
                      onClick={() => push('profile', { userId: user.uid })}
                      className="min-w-[140px] snap-center glass-card flex flex-col items-center text-center p-4 cursor-pointer hover:bg-white/5 transition-colors"
                    >
                      <UserAvatar src={user.avatarUrl} name={user.displayName || user.username || 'User'} size="lg" className="mb-3" />
                      <p className="font-semibold text-white text-sm line-clamp-1">{user.displayName}</p>
                      <p className="text-xs text-white/50 mb-3">@{user.username}</p>
                      <FollowButtonSmall targetUserId={user.uid} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FollowButtonSmall({ targetUserId }: { targetUserId: string }) {
  const { isFollowing, toggleFollow, canFollow } = useFollow(targetUserId);
  
  if (!canFollow) return null;
  
  return (
    <button 
      onClick={(e) => { e.stopPropagation(); toggleFollow(); }}
      className={`px-4 py-1.5 rounded-full text-xs font-semibold w-full transition-colors ${
        isFollowing 
          ? 'bg-white/10 text-white hover:bg-white/20' 
          : 'bg-blue-600 text-white hover:bg-blue-500'
      }`}
    >
      {isFollowing ? 'Following' : 'Follow'}
    </button>
  );
}
