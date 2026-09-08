import { useState, useEffect } from 'react';
import { ArrowLeft, Users } from 'lucide-react';
import { useNavigation } from '@/store/navigation';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, getDoc, doc } from 'firebase/firestore';
import { UserProfile } from '@/services/users';
import UserAvatar from '@/components/ui/UserAvatar';

interface UserListProps {
  type: 'followers' | 'following';
  userId: string;
}

export default function UserList({ type, userId }: UserListProps) {
  const { pop, push } = useNavigation();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const refs = collection(db, 'users', userId, type);
        const snapshot = await getDocs(query(refs));
        
        const userDocs = await Promise.all(
          snapshot.docs.map(async (d) => {
            const profileSnap = await getDoc(doc(db, 'users', d.id));
            if (profileSnap.exists()) {
              return { uid: profileSnap.id, ...profileSnap.data() } as UserProfile;
            }
            return null;
          })
        );
        
        setUsers(userDocs.filter(Boolean) as UserProfile[]);
      } catch(e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUsers();
    }
  }, [userId, type]);

  return (
    <div className="w-full min-h-full pt-12 px-4 pb-32 bg-[#050505]">
      <header className="flex items-center gap-4 mb-6">
        <button 
          onClick={pop}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/80 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-white capitalize">{type}</h1>
      </header>

      <div className="flex flex-col gap-2">
        {loading ? (
          <div className="text-center py-10 text-white/50 text-sm">Loading...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-white/40 flex flex-col items-center">
            <Users className="w-12 h-12 mb-3 opacity-20" />
            <p>No {type} yet.</p>
          </div>
        ) : (
          users.map(u => (
            <button 
              key={u.uid}
              onClick={() => push('profile', { userId: u.uid })}
              className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-colors text-left"
            >
              <UserAvatar src={u.avatarUrl} name={u.displayName || u.username || ''} size="lg" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">{u.displayName}</h3>
                <p className="text-sm text-white/50 truncate">@{u.username}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
