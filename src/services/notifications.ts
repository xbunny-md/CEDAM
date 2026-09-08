import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  getDoc,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { UserProfile } from './users';

export type NotificationType = 'like' | 'comment' | 'follow' | 'mention' | 'poll' | 'challenge_vote' | 'profile_view' | 'share' | 'system_update';

export async function processMentions(text: string, data: { postId?: string, commentId?: string, challengeId?: string }) {
  if (!auth.currentUser) return;
  const actorId = auth.currentUser.uid;
  const mentions = text.match(/@(\w+)/g);
  if (!mentions) return;
  
  const usernames = [...new Set(mentions.map(m => m.slice(1).toLowerCase()))];
  
  for (const username of usernames) {
    try {
      const uDoc = await getDoc(doc(db, 'usernames', username));
      if (uDoc.exists()) {
        const targetUserId = uDoc.data().uid;
        createNotification(targetUserId, {
          type: 'mention',
          actorId,
          ...data
        });
      }
    } catch(e) {
      console.error('Failed to process mention', e);
    }
  }
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  actorId: string;
  actorProfile?: UserProfile;
  postId?: string;
  challengeId?: string;
  commentId?: string;
  isRead: boolean;
  createdAt: any;
}

export async function createNotification(userId: string, data: { type: NotificationType, postId?: string, challengeId?: string, commentId?: string, actorId: string }) {
  // Don't notify yourself
  if (userId === data.actorId) return;

  const notificationsRef = collection(db, 'users', userId, 'notifications');
  await addDoc(notificationsRef, {
    ...data,
    isRead: false,
    createdAt: serverTimestamp()
  });
}

// User cache to prevent duplicate fetches
const userCache = new Map<string, UserProfile>();

async function populateActorProfiles(notifications: AppNotification[]): Promise<AppNotification[]> {
  const result = [...notifications];
  for (const notif of result) {
    if (!notif.actorId) continue;
    
    if (userCache.has(notif.actorId)) {
      notif.actorProfile = userCache.get(notif.actorId);
    } else {
      try {
        const uDoc = await getDoc(doc(db, 'users', notif.actorId));
        if (uDoc.exists()) {
          const profile = uDoc.data() as UserProfile;
          notif.actorProfile = profile;
          userCache.set(notif.actorId, profile);
        }
      } catch (e) {}
    }
  }
  return result;
}

export function subscribeToNotifications(userId: string, callback: (notifications: AppNotification[], unreadCount: number) => void) {
  const q = query(collection(db, 'users', userId, 'notifications'), orderBy('createdAt', 'desc'), limit(50));
  
  return onSnapshot(q, async (snapshot) => {
    const notifications = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
    
    // Efficiently compute unread count
    const unreadCount = notifications.filter(n => !n.isRead).length;
    
    // We fetch profiles asynchronously and then call callback
    const populated = await populateActorProfiles(notifications);
    callback(populated, unreadCount);
  });
}

export async function markNotificationAsRead(userId: string, notificationId: string) {
  const ref = doc(db, 'users', userId, 'notifications', notificationId);
  await updateDoc(ref, { isRead: true });
}

export async function markAllNotificationsAsRead(userId: string) {
  const q = query(collection(db, 'users', userId, 'notifications'));
  const snapshot = await getDocs(q);
  
  const batch = writeBatch(db);
  let count = 0;
  snapshot.docs.forEach(d => {
    if (!d.data().isRead) {
      batch.update(d.ref, { isRead: true });
      count++;
    }
  });
  
  if (count > 0) {
    await batch.commit();
  }
}

export async function clearAllNotifications(userId: string) {
  const q = query(collection(db, 'users', userId, 'notifications'));
  const snapshot = await getDocs(q);
  
  const batch = writeBatch(db);
  snapshot.docs.forEach(d => {
    batch.delete(d.ref);
  });
  
  if (snapshot.docs.length > 0) {
    await batch.commit();
  }
}

export async function deleteNotification(userId: string, notificationId: string) {
  const ref = doc(db, 'users', userId, 'notifications', notificationId);
  await deleteDoc(ref);
}
