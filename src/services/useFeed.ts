import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore';
import { Post } from './posts';
import { useAuth } from '@/store/auth';
import { useOptimisticFeed } from '@/store/optimisticFeed';

// Cache for user profiles to speed up feed loading
const userCache = new Map<string, any>();

export function useFeed(feedType: 'latest' | 'popular' | 'trending' = 'latest') {
  const [firestorePosts, setFirestorePosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { pendingPosts } = useOptimisticFeed();
  
  useEffect(() => {
    let q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(20));
    
    if (feedType === 'popular') {
      q = query(collection(db, 'posts'), orderBy('likesCount', 'desc'), limit(20));
    } else if (feedType === 'trending') {
      q = query(collection(db, 'posts'), orderBy('commentsCount', 'desc'), limit(20));
    }

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const postsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Post));
      
      // Show immediately to avoid slow loading
      setFirestorePosts(postsData.map(p => ({...p, authorProfile: userCache.get(p.authorId)})));
      setLoading(false);
      
      let needsUpdate = false;
      const postsWithProfiles = await Promise.all(
        postsData.map(async (p) => {
          // Fetch Author
          if (!userCache.has(p.authorId)) {
            try {
               const userDoc = await getDoc(doc(db, 'users', p.authorId));
               if (userDoc.exists()) {
                 userCache.set(p.authorId, userDoc.data());
                 needsUpdate = true;
               }
            } catch(e) {}
          }
          p.authorProfile = userCache.get(p.authorId);

          // Fetch Poll Vote
          if (p.type === 'poll' && user) {
            try {
              const voteDoc = await getDoc(doc(db, 'posts', p.id, 'votes', user.uid));
              if (voteDoc.exists()) {
                p.hasVotedOptionId = voteDoc.data().optionId;
                needsUpdate = true;
              }
            } catch(e) {}
          }

          return p;
        })
      );
      
      if (needsUpdate) {
        setFirestorePosts(postsWithProfiles);
      }
    }, (err) => {
      console.error("Feed error:", err);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [feedType, user]);

  // Merge pending posts and filter out any that might have already appeared in firestorePosts
  const firestorePostIds = new Set(firestorePosts.map(p => p.id));
  const activePendingPosts = pendingPosts.filter(p => !firestorePostIds.has(p.id));

  const posts = feedType === 'latest' 
    ? [...activePendingPosts, ...firestorePosts]
    : firestorePosts;

  return { posts, loading: loading && posts.length === 0 };
}
