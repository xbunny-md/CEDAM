import React, { useState, useEffect } from 'react';
import { Search, Users, Hash, Trophy, UserPlus, UserCheck, Flame } from 'lucide-react';
import { useNavigation } from '@/store/navigation';
import { searchUsers, getTrendingUsers, getNewUsers, UserProfile } from '@/services/users';
import { getTrendingPosts, Post, searchPosts } from '@/services/posts';
import { useFollow } from '@/hooks/useFollow';
import { motion, AnimatePresence } from 'motion/react';
import PostCard from '../feed/PostCard';
import UserAvatar from '@/components/ui/UserAvatar';
import { getEvents, AppEvent, createEvent } from '@/services/events';
import { getResources, AppResource, createResource } from '@/services/resources';
import { useAuth } from '@/store/auth';

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
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'explore' | 'events' | 'study' | 'necta'>('explore');
  
  const [searchResults, setSearchResults] = useState<{users: UserProfile[], posts: Post[]}>({ users: [], posts: [] });
  const [trendingUsers, setTrendingUsers] = useState<UserProfile[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [newMembers, setNewMembers] = useState<UserProfile[]>([]);
  
  // Real data for Events & Resources
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [resources, setResources] = useState<AppResource[]>([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAddResource, setShowAddResource] = useState(false);

  // Form for NECTA
  const [nectaYear, setNectaYear] = useState('2026');
  const [nectaType, setNectaType] = useState('acsee');
  const [nectaSchool, setNectaSchool] = useState('s3156');
  const [nectaUrl, setNectaUrl] = useState('');
  
  useEffect(() => {
    // Load default sections
    getTrendingUsers().then(setTrendingUsers).catch(console.error);
    getNewUsers().then(setNewMembers).catch(console.error);
    getTrendingPosts().then(setTrendingPosts).catch(console.error);
    getEvents().then(setEvents).catch(console.error);
    getResources().then(setResources).catch(console.error);
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

  const handleNectaSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nectaSchool.trim()) return;
    const sch = nectaSchool.trim().toLowerCase();
    const url = `https://matokeo.necta.go.tz/results/${nectaYear}/${nectaType}/results/${sch}.htm`;
    setNectaUrl(url);
  };

  return (
    <div className="w-full min-h-full pt-12 px-4 pb-32">
      <h1 className="text-3xl font-display font-black tracking-tight text-white mb-6">
        Discover
      </h1>

      {/* Search Bar */}
      <div className="relative mb-6 z-10">
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

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2 -mx-4 px-4">
        {[
          { id: 'explore', label: 'Explore' },
          { id: 'events', label: 'Match Center' },
          { id: 'study', label: 'Study Hub' },
          { id: 'necta', label: 'NECTA Results' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {tab.label}
          </button>
        ))}
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
        ) : activeTab === 'explore' ? (
          <motion.div
            key="discover-explore"
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
        ) : activeTab === 'necta' ? (
          <motion.div
            key="discover-necta"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            <div className="glass-card !p-6 border border-white/10 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">NECTA Results Portal</h2>
              <p className="text-white/60 text-sm mb-6">Quickly find and view official National Examination results.</p>
              
              <form onSubmit={handleNectaSearch} className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <div className="flex-1 text-left">
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Exam Type</label>
                    <select 
                      value={nectaType}
                      onChange={(e) => setNectaType(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 appearance-none"
                    >
                      <option value="csee">CSEE (O-Level)</option>
                      <option value="acsee">ACSEE (A-Level)</option>
                      <option value="sfna">SFNA (Std 4)</option>
                      <option value="psle">PSLE (Std 7)</option>
                    </select>
                  </div>
                  <div className="w-1/3 text-left">
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Year</label>
                    <select 
                      value={nectaYear}
                      onChange={(e) => setNectaYear(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 appearance-none"
                    >
                      <option value="2023">2023</option>
                      <option value="2022">2022</option>
                      <option value="2021">2021</option>
                      <option value="2020">2020</option>
                      <option value="2019">2019</option>
                    </select>
                  </div>
                </div>

                <div className="text-left">
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">School Number</label>
                  <input 
                    type="text"
                    value={nectaSchool}
                    onChange={(e) => setNectaSchool(e.target.value.toUpperCase())}
                    placeholder="e.g. S0101"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50"
                    required
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  View Results
                </button>
              </form>
            </div>
            
            {nectaUrl && (
              <div className="w-full bg-white rounded-xl overflow-hidden shadow-2xl h-[60vh]">
                <iframe src={nectaUrl} className="w-full h-full border-0" title="NECTA Results" />
              </div>
            )}
          </motion.div>
        ) : activeTab === 'events' ? (
          <motion.div
            key="discover-events"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-4"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">Matches & Events</h2>
              {user && (
                <button 
                  onClick={() => setShowAddEvent(!showAddEvent)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-full text-xs font-bold"
                >
                  {showAddEvent ? 'Cancel' : '+ Add Event'}
                </button>
              )}
            </div>

            {showAddEvent && user && (
              <div className="glass-card !p-4 border border-blue-500/30">
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    await createEvent({
                      title: (form.elements.namedItem('title') as HTMLInputElement).value,
                      description: (form.elements.namedItem('description') as HTMLTextAreaElement).value,
                      category: (form.elements.namedItem('category') as HTMLSelectElement).value,
                      date: (form.elements.namedItem('date') as HTMLInputElement).value,
                      createdBy: user.uid
                    });
                    setShowAddEvent(false);
                    getEvents().then(setEvents).catch(console.error);
                  }}
                  className="flex flex-col gap-3"
                >
                  <input name="title" placeholder="Event Title (e.g. PCM vs PCB)" required className="w-full bg-white/5 rounded-xl px-3 py-2 text-white text-sm" />
                  <textarea name="description" placeholder="Description & Location..." required className="w-full bg-white/5 rounded-xl px-3 py-2 text-white text-sm min-h-[60px]" />
                  <div className="flex gap-2">
                    <select name="category" className="bg-white/5 rounded-xl px-3 py-2 text-white text-sm flex-1 appearance-none">
                      <option value="Football" className="bg-[#111]">Football</option>
                      <option value="Debate" className="bg-[#111]">Debate</option>
                      <option value="Academic" className="bg-[#111]">Academic</option>
                      <option value="Other" className="bg-[#111]">Other</option>
                    </select>
                    <input name="date" type="datetime-local" required className="bg-white/5 rounded-xl px-3 py-2 text-white text-sm flex-1" />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded-xl text-sm">Post Event</button>
                </form>
              </div>
            )}

            {events.length === 0 ? (
              <div className="text-center py-10 text-white/50 text-sm">No events scheduled.</div>
            ) : (
              events.map((ev) => (
                <div key={ev.id} className="glass-card !p-4 border border-white/10">
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">{ev.category}</span>
                    <span className="text-xs text-white/50">{new Date(ev.date).toLocaleString()}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{ev.title}</h3>
                  <p className="text-sm text-white/60 mb-4">{ev.description}</p>
                  <button className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors">
                    RSVP
                  </button>
                </div>
              ))
            )}
          </motion.div>
        ) : (
          <motion.div
            key="discover-study"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-4"
          >
            <div className="flex justify-between items-center mb-2">
              <div>
                <h2 className="text-lg font-semibold text-white">Resource Vault</h2>
                <p className="text-sm text-white/60">Top shared academic resources.</p>
              </div>
              {user && (
                <button 
                  onClick={() => setShowAddResource(!showAddResource)}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-full text-xs font-bold"
                >
                  {showAddResource ? 'Cancel' : '+ Add Resource'}
                </button>
              )}
            </div>

            {showAddResource && user && (
              <div className="glass-card !p-4 border border-purple-500/30">
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    await createResource({
                      title: (form.elements.namedItem('title') as HTMLInputElement).value,
                      subject: (form.elements.namedItem('subject') as HTMLInputElement).value,
                      url: (form.elements.namedItem('url') as HTMLInputElement).value,
                      authorName: user.displayName || user.email || 'Anonymous',
                      createdBy: user.uid
                    });
                    setShowAddResource(false);
                    getResources().then(setResources).catch(console.error);
                  }}
                  className="flex flex-col gap-3"
                >
                  <input name="title" placeholder="Resource Title (e.g. Adv. Mechanics Notes)" required className="w-full bg-white/5 rounded-xl px-3 py-2 text-white text-sm" />
                  <div className="flex gap-2">
                    <input name="subject" placeholder="Subject (e.g. Physics)" required className="bg-white/5 rounded-xl px-3 py-2 text-white text-sm flex-1" />
                  </div>
                  <input name="url" type="url" placeholder="Link to file (Google Drive, Dropbox, etc.)" required className="w-full bg-white/5 rounded-xl px-3 py-2 text-white text-sm" />
                  <button type="submit" className="w-full bg-purple-600 text-white font-bold py-2 rounded-xl text-sm">Post Resource</button>
                </form>
              </div>
            )}
            
            {resources.length === 0 ? (
              <div className="text-center py-10 text-white/50 text-sm">No resources shared yet.</div>
            ) : (
              resources.map((res) => (
                <div key={res.id} onClick={() => window.open(res.url, '_blank')} className="glass-card !p-4 border border-white/10 flex justify-between items-center hover:bg-white/10 transition-colors cursor-pointer">
                  <div>
                    <span className="text-xs text-purple-400 font-semibold uppercase tracking-wider block mb-1">{res.subject}</span>
                    <h4 className="text-white font-medium text-sm mb-1">{res.title}</h4>
                    <p className="text-xs text-white/40">Shared by {res.authorName}</p>
                  </div>
                  <div className="flex flex-col items-center bg-white/5 rounded-lg p-2 min-w-[50px]">
                    <span className="text-xs font-bold text-white mb-1">▲</span>
                    <span className="text-sm font-bold text-white/80">{res.upvotes}</span>
                  </div>
                </div>
              ))
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
