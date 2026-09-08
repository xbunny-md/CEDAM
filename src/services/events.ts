import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';

export interface AppEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  createdBy: string;
  createdAt: Timestamp;
}

export async function getEvents(): Promise<AppEvent[]> {
  const q = query(collection(db, 'events'), orderBy('date', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AppEvent));
}

export async function createEvent(data: Omit<AppEvent, 'id' | 'createdAt'>) {
  const eventsRef = collection(db, 'events');
  return addDoc(eventsRef, {
    ...data,
    createdAt: serverTimestamp()
  });
}
