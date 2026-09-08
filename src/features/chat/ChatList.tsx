import { useState, useEffect } from 'react';
import { ArrowLeft, Search, MessageCircle } from 'lucide-react';
import { useNavigation } from '@/store/navigation';
import { useAuth } from '@/store/auth';
import { searchUsers, UserProfile } from '@/services/users';
import UserAvatar from '@/components/ui/UserAvatar';

export default function ChatList() {
  const { pop, push } = useNavigation();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);

  // We could fetch real chat history here, but for now we'll allow searching for users to chat with
  useEffect(() => {
    if (searchTerm.trim().length === 0) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const users = await searchUsers(searchTerm);
        // Exclude current user
        setSearchResults(users.filter(u => u.uid !== user?.uid));
      } catch (e) {
        console.error(e);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, user?.uid]);

  const openChat = (targetUser: UserProfile) => {
    // Navigate to ChatRoom passing target user info
    push('chatRoom', { targetUser });
  };

  return (
    <div className="w-full min-h-full pt-12 px-4 pb-32 bg-[#050505]">
      <header className="flex items-center gap-4 mb-6">
        <button 
          onClick={pop}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/80 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-white">Messages</h1>
      </header>

      {/* Search Bar for new chats */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-white/40" />
        </div>
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 transition-colors text-sm"
          placeholder="Search users to message..."
        />
      </div>

      <div className="flex flex-col gap-2">
        {isSearching && searchResults.length === 0 && (
          <div className="text-center py-10 text-white/50 text-sm">No users found</div>
        )}
        
        {searchResults.map(resultUser => (
          <button 
            key={resultUser.uid}
            onClick={() => openChat(resultUser)}
            className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-colors text-left"
          >
            <UserAvatar src={resultUser.avatarUrl} name={resultUser.displayName || resultUser.username || ''} size="lg" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white truncate">{resultUser.displayName}</h3>
              <p className="text-sm text-white/50 truncate">@{resultUser.username}</p>
            </div>
            <MessageCircle className="w-5 h-5 text-blue-400" />
          </button>
        ))}

        {!isSearching && (
          <div className="text-center py-16 text-white/40 flex flex-col items-center">
            <MessageCircle className="w-12 h-12 mb-3 opacity-20" />
            <p>Search for a user above to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}
