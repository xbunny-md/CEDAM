import { db, storage } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  getDoc,
  getDocs,
  runTransaction,
  where
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth } from '@/lib/firebase';

import { awardPoints, POINTS } from '@/services/points';
import { createNotification, processMentions } from '@/services/notifications';

import { uploadImage, uploadVideo } from '@/services/upload';

export interface PollOption {
  id: string;
  text: string;
  votesCount: number;
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  mediaUrl?: string;
  type: 'text' | 'image' | 'video' | 'poll';
  likesCount: number;
  commentsCount: number;
  createdAt: any;
  authorProfile?: any;
  pollOptions?: PollOption[];
  totalVotes?: number;
  hasVotedOptionId?: string; // Client-side populated
}

export async function createPost(content: string, mediaFile?: File | null, pollOptionsData?: string[]) {
  if (!auth.currentUser) throw new Error('Must be logged in');

  let mediaUrl = '';
  let type: 'text' | 'image' | 'video' | 'poll' = 'text';
  let pollOptions: PollOption[] | undefined;
  let totalVotes = 0;

  if (pollOptionsData && pollOptionsData.length > 0) {
    type = 'poll';
    pollOptions = pollOptionsData.map((text, i) => ({
      id: `opt_${i}_${Date.now()}`,
      text,
      votesCount: 0
    }));
  } else if (mediaFile) {
    type = mediaFile.type.startsWith('video/') ? 'video' : 'image';
    if (type === 'video') {
      mediaUrl = await uploadVideo(mediaFile);
    } else {
      mediaUrl = await uploadImage(mediaFile);
    }
  }

  const postsRef = collection(db, 'posts');
  const postData: any = {
    authorId: auth.currentUser.uid,
    content,
    mediaUrl,
    type,
    likesCount: 0,
    commentsCount: 0,
    createdAt: serverTimestamp()
  };

  if (type === 'poll') {
    postData.pollOptions = pollOptions;
    postData.totalVotes = 0;
  }

  const docRef = await addDoc(postsRef, postData);
  
  // Award points asynchronously
  awardPoints(auth.currentUser.uid, POINTS.CREATE_POST, { postsCount: 1 });
  
  // Process mentions
  if (content) {
    processMentions(content, { postId: docRef.id });
  }
  
  return docRef.id;
}

export async function voteOnPoll(postId: string, optionId: string) {
  if (!auth.currentUser) throw new Error('Must be logged in');
  
  const userId = auth.currentUser.uid;
  const postRef = doc(db, 'posts', postId);
  const voteRef = doc(db, 'posts', postId, 'votes', userId);
  
  await runTransaction(db, async (transaction) => {
    const postDoc = await transaction.get(postRef);
    if (!postDoc.exists()) throw new Error('Post does not exist');
    
    const voteDoc = await transaction.get(voteRef);
    if (voteDoc.exists()) throw new Error('Already voted');
    
    const data = postDoc.data();
    if (data.type !== 'poll' || !data.pollOptions) throw new Error('Not a poll');
    
    const newOptions = data.pollOptions.map((opt: PollOption) => {
      if (opt.id === optionId) {
        return { ...opt, votesCount: opt.votesCount + 1 };
      }
      return opt;
    });
    
    transaction.set(voteRef, { optionId, createdAt: serverTimestamp() });
    transaction.update(postRef, {
      pollOptions: newOptions,
      totalVotes: (data.totalVotes || 0) + 1
    });
  });
  
  // Award points
  awardPoints(userId, POINTS.VOTE_POLL);
  
  // Get post author to send notification
  const postDoc = await getDoc(postRef);
  if (postDoc.exists()) {
    createNotification(postDoc.data().authorId, {
      type: 'poll',
      postId,
      actorId: userId
    });
  }
}

export async function deletePost(postId: string) {
  if (!auth.currentUser) throw new Error('Must be logged in');
  // Need to also delete comments and likes subcollections ideally, 
  // but for now deleting the document is the start.
  await deleteDoc(doc(db, 'posts', postId));
}

// Transaction for likes
export async function toggleLike(postId: string, isLiked: boolean) {
  if (!auth.currentUser) throw new Error('Must be logged in');
  
  const userId = auth.currentUser.uid;
  const postRef = doc(db, 'posts', postId);
  const likeRef = doc(db, 'posts', postId, 'likes', userId);

  let postAuthorId = '';
  await runTransaction(db, async (transaction) => {
    const postDoc = await transaction.get(postRef);
    if (!postDoc.exists()) throw new Error('Post does not exist');
    
    postAuthorId = postDoc.data().authorId;
    const currentLikes = postDoc.data().likesCount || 0;

    if (isLiked) {
      // User wants to unlike
      transaction.delete(likeRef);
      transaction.update(postRef, { likesCount: Math.max(0, currentLikes - 1) });
    } else {
      // User wants to like
      transaction.set(likeRef, { createdAt: serverTimestamp() });
      transaction.update(postRef, { likesCount: currentLikes + 1 });
    }
  });
  
  if (!isLiked && postAuthorId && postAuthorId !== userId) {
    awardPoints(postAuthorId, POINTS.RECEIVE_LIKE, { likesReceived: 1 });
    createNotification(postAuthorId, { type: 'like', postId, actorId: userId });
  }
}

export async function addComment(postId: string, content: string) {
  if (!auth.currentUser) throw new Error('Must be logged in');
  
  const userId = auth.currentUser.uid;
  
  const commentsRef = collection(db, 'posts', postId, 'comments');
  const postRef = doc(db, 'posts', postId);

  let postAuthorId = '';
  // We do not strictly need a transaction for adding if we use increment,
  // but transaction is safer. Let's use transaction for exact count.
  await runTransaction(db, async (transaction) => {
    const postDoc = await transaction.get(postRef);
    if (!postDoc.exists()) throw new Error('Post does not exist');
    
    postAuthorId = postDoc.data().authorId;
    const newCommentRef = doc(commentsRef);
    transaction.set(newCommentRef, {
      authorId: userId,
      content,
      createdAt: serverTimestamp()
    });
    
    transaction.update(postRef, { commentsCount: (postDoc.data().commentsCount || 0) + 1 });
  });
  
  if (postAuthorId && postAuthorId !== userId) {
    awardPoints(postAuthorId, POINTS.RECEIVE_COMMENT);
    createNotification(postAuthorId, { type: 'comment', postId, actorId: userId });
  }
  
  if (content) {
    processMentions(content, { postId });
  }
}

export async function toggleSavePost(postId: string, isSaved: boolean) {
  if (!auth.currentUser) throw new Error('Must be logged in');
  const userId = auth.currentUser.uid;
  const saveRef = doc(db, 'users', userId, 'saves', postId);
  
  if (isSaved) {
    await deleteDoc(saveRef);
  } else {
    await setDoc(saveRef, { savedAt: serverTimestamp() });
  }
}

const userCache = new Map<string, any>();

async function populateAuthorProfiles(posts: Post[]): Promise<Post[]> {
  return await Promise.all(
    posts.map(async (p) => {
      if (userCache.has(p.authorId)) {
        p.authorProfile = userCache.get(p.authorId);
        return p;
      }
      try {
        const userDoc = await getDoc(doc(db, 'users', p.authorId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          p.authorProfile = data;
          userCache.set(p.authorId, data);
        }
        return p;
      } catch(e) {
        return p;
      }
    })
  );
}

export async function searchPosts(searchTerm: string): Promise<Post[]> {
  const term = searchTerm.toLowerCase();
  if (!term) return [];

  // Firestore doesn't support full-text search. 
  // We'll fetch recent posts and filter on the client for a simple approximation.
  const postsRef = collection(db, 'posts');
  const q = query(postsRef, orderBy('createdAt', 'desc'), limit(50));
  const snapshot = await getDocs(q);
  
  const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
  const filtered = posts.filter(post => post.content.toLowerCase().includes(term));
  
  return populateAuthorProfiles(filtered);
}

export async function getTrendingPosts(): Promise<Post[]> {
  const postsRef = collection(db, 'posts');
  const q = query(postsRef, orderBy('likesCount', 'desc'), limit(10));
  const snapshot = await getDocs(q);
  const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
  
  return populateAuthorProfiles(posts);
}

export async function getUserPosts(userId: string): Promise<Post[]> {
  const postsRef = collection(db, 'posts');
  const q = query(postsRef, where('authorId', '==', userId), orderBy('createdAt', 'desc'), limit(50));
  const snapshot = await getDocs(q);
  const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
  return populateAuthorProfiles(posts);
}

export async function getSavedPosts(userId: string): Promise<Post[]> {
  const savesRef = collection(db, 'users', userId, 'saves');
  const savesSnapshot = await getDocs(savesRef);
  
  if (savesSnapshot.empty) return [];
  
  const savedPostIds = savesSnapshot.docs.map(doc => doc.id);
  const posts: Post[] = [];
  
  // We should ideally batch getDocs or use 'in' query if <= 30. For simplicity, just get one by one
  for (const postId of savedPostIds) {
    const postDoc = await getDoc(doc(db, 'posts', postId));
    if (postDoc.exists()) {
      posts.push({ id: postDoc.id, ...postDoc.data() } as Post);
    }
  }
  
  return populateAuthorProfiles(posts.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()));
}

export async function reportPost(postId: string, reason: string) {
  if (!auth.currentUser) throw new Error('Must be logged in');
  
  await addDoc(collection(db, 'reports'), {
    postId,
    reporterId: auth.currentUser.uid,
    reason,
    createdAt: serverTimestamp()
  });
}
