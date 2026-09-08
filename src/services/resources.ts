import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';

export interface AppResource {
  id: string;
  title: string;
  subject: string;
  authorName: string;
  url: string;
  upvotes: number;
  createdBy: string;
  createdAt: Timestamp;
}

export async function getResources(): Promise<AppResource[]> {
  const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AppResource));
}

export async function createResource(data: Omit<AppResource, 'id' | 'createdAt' | 'upvotes'>) {
  const resourcesRef = collection(db, 'resources');
  return addDoc(resourcesRef, {
    ...data,
    upvotes: 0,
    createdAt: serverTimestamp()
  });
}
