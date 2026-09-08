import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  doc, 
  getDoc,
  writeBatch,
  increment,
  startAt,
  endAt
} from 'firebase/firestore';

import { createNotification } from './notifications';

export interface UserProfile {
  uid: string;
  displayName: string;
  username: string;
  bio: string;
  avatarUrl: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  likesReceived: number;
  challengesJoined: number;
  challengeVotesReceived: number;
  points: number;
  badges: string[];
  createdAt: any;
}

export async function searchUsers(searchTerm: string): Promise<UserProfile[]> {
  const term = searchTerm.toLowerCase();
  
  if (!term) return [];

  // Search by username
  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('username', '>=', term),
    where('username', '<=', term + '\uf8ff'),
    limit(10)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as UserProfile);
}

export async function getTrendingUsers(): Promise<UserProfile[]> {
  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    orderBy('followersCount', 'desc'),
    limit(6)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as UserProfile);
}

export async function getNewUsers(): Promise<UserProfile[]> {
  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    orderBy('createdAt', 'desc'),
    limit(6)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as UserProfile);
}

export async function toggleFollow(currentUserId: string, targetUserId: string, isFollowing: boolean) {
  const batch = writeBatch(db);
  
  const followingRef = doc(db, 'users', currentUserId, 'following', targetUserId);
  const followerRef = doc(db, 'users', targetUserId, 'followers', currentUserId);
  const currentUserRef = doc(db, 'users', currentUserId);
  const targetUserRef = doc(db, 'users', targetUserId);

  if (isFollowing) {
    // Unfollow
    batch.delete(followingRef);
    batch.delete(followerRef);
    batch.update(currentUserRef, { followingCount: increment(-1) });
    batch.update(targetUserRef, { followersCount: increment(-1) });
  } else {
    // Follow
    batch.set(followingRef, { createdAt: new Date() });
    batch.set(followerRef, { createdAt: new Date() });
    batch.update(currentUserRef, { followingCount: increment(1) });
    batch.update(targetUserRef, { followersCount: increment(1) });
  }

  await batch.commit();
  
  if (!isFollowing) {
    createNotification(targetUserId, { type: 'follow', actorId: currentUserId });
  }
}

export async function checkIsFollowing(currentUserId: string, targetUserId: string): Promise<boolean> {
  const followingRef = doc(db, 'users', currentUserId, 'following', targetUserId);
  const docSnap = await getDoc(followingRef);
  return docSnap.exists();
}
