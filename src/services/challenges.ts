import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  getDocs,
  getDoc,
  runTransaction,
  setDoc,
  where
} from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { awardPoints, POINTS } from '@/services/points';
import { createNotification } from '@/services/notifications';

export interface Challenge {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  type: 'Daily' | 'Photo' | 'Funny' | 'Football' | 'Creativity';
  points: number;
  startDate: any;
  endDate: any;
  status: 'active' | 'upcoming' | 'completed';
  participantsCount: number;
  imageUrl?: string;
  createdAt: any;
}

export interface ChallengeEntry {
  id: string;
  challengeId: string;
  authorId: string;
  authorProfile?: any;
  content: string;
  mediaUrl?: string;
  votesCount: number;
  createdAt: any;
  hasVoted?: boolean;
  status?: 'pending' | 'approved' | 'rejected';
}

export async function createChallenge(data: Partial<Challenge>) {
  if (!auth.currentUser) throw new Error('Must be logged in');
  
  const challengeData = {
    ...data,
    creatorId: auth.currentUser.uid,
    participantsCount: 0,
    createdAt: serverTimestamp()
  };
  
  const ref = await addDoc(collection(db, 'challenges'), challengeData);
  return ref.id;
}

export async function getChallenges(): Promise<Challenge[]> {
  const q = query(collection(db, 'challenges'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty && auth.currentUser) {
    // Seed initial challenges
    const seedData = [
      {
        title: "Best UI Design",
        description: "Show off your best futuristic glassmorphism UI. The community votes on the winner.",
        type: "Creativity" as const,
        points: 500,
        status: "active" as const
      },
      {
        title: "Football Freestyle",
        description: "Post a video of your best football freestyle moves.",
        type: "Football" as const,
        points: 300,
        status: "active" as const
      },
      {
        title: "Best Funny Moment",
        description: "Share the funniest moment of your week.",
        type: "Funny" as const,
        points: 200,
        status: "upcoming" as const
      }
    ];
    for (const data of seedData) {
      await createChallenge(data);
    }
    const newSnapshot = await getDocs(q);
    return newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Challenge));
  }
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Challenge));
}

export async function joinChallenge(challengeId: string) {
  if (!auth.currentUser) throw new Error('Must be logged in');
  const userId = auth.currentUser.uid;
  
  const challengeRef = doc(db, 'challenges', challengeId);
  const participantRef = doc(db, 'challenges', challengeId, 'participants', userId);
  
  await runTransaction(db, async (transaction) => {
    const pDoc = await transaction.get(participantRef);
    if (pDoc.exists()) return; // already joined
    
    const cDoc = await transaction.get(challengeRef);
    if (!cDoc.exists()) throw new Error('Challenge not found');
    
    transaction.set(participantRef, { joinedAt: serverTimestamp() });
    transaction.update(challengeRef, { participantsCount: (cDoc.data().participantsCount || 0) + 1 });
  });
  
  awardPoints(userId, POINTS.JOIN_CHALLENGE, { challengesJoined: 1 });
}

export async function hasJoinedChallenge(challengeId: string, userId: string): Promise<boolean> {
  const docRef = doc(db, 'challenges', challengeId, 'participants', userId);
  const snap = await getDoc(docRef);
  return snap.exists();
}

export async function submitChallengeEntry(challengeId: string, content: string, mediaUrl?: string) {
  if (!auth.currentUser) throw new Error('Must be logged in');
  const userId = auth.currentUser.uid;
  
  const entriesRef = collection(db, 'challenges', challengeId, 'entries');
  await addDoc(entriesRef, {
    authorId: userId,
    challengeId,
    content,
    mediaUrl,
    votesCount: 0,
    status: 'pending',
    createdAt: serverTimestamp()
  });
}

export async function approveEntry(challengeId: string, entryId: string, status: 'approved' | 'rejected') {
  if (!auth.currentUser) throw new Error('Must be logged in');
  
  const entryRef = doc(db, 'challenges', challengeId, 'entries', entryId);
  await updateDoc(entryRef, {
    status
  });
}

export async function getChallengeEntries(challengeId: string): Promise<ChallengeEntry[]> {
  const q = query(collection(db, 'challenges', challengeId, 'entries'), orderBy('votesCount', 'desc'));
  const snapshot = await getDocs(q);
  
  const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChallengeEntry));
  const user = auth.currentUser;
  
  const populated = await Promise.all(
    entries.map(async (entry) => {
      // Get author profile
      try {
        const uDoc = await getDoc(doc(db, 'users', entry.authorId));
        if (uDoc.exists()) entry.authorProfile = uDoc.data();
      } catch(e) {}
      
      // Get vote status if logged in
      if (user) {
        try {
          const voteDoc = await getDoc(doc(db, 'challenges', challengeId, 'entries', entry.id, 'votes', user.uid));
          entry.hasVoted = voteDoc.exists();
        } catch(e) {}
      }
      return entry;
    })
  );
  
  return populated;
}

export async function voteOnEntry(challengeId: string, entryId: string) {
  if (!auth.currentUser) throw new Error('Must be logged in');
  const userId = auth.currentUser.uid;
  
  const entryRef = doc(db, 'challenges', challengeId, 'entries', entryId);
  const voteRef = doc(db, 'challenges', challengeId, 'entries', entryId, 'votes', userId);
  
  let entryAuthorId = '';
  await runTransaction(db, async (transaction) => {
    const vDoc = await transaction.get(voteRef);
    if (vDoc.exists()) throw new Error('Already voted');
    
    const eDoc = await transaction.get(entryRef);
    if (!eDoc.exists()) throw new Error('Entry not found');
    
    entryAuthorId = eDoc.data().authorId;
    transaction.set(voteRef, { createdAt: serverTimestamp() });
    transaction.update(entryRef, { votesCount: (eDoc.data().votesCount || 0) + 1 });
  });
  
  if (entryAuthorId && entryAuthorId !== userId) {
    awardPoints(entryAuthorId, POINTS.RECEIVE_CHALLENGE_VOTE, { challengeVotesReceived: 1 });
    createNotification(entryAuthorId, { type: 'challenge_vote', challengeId, actorId: userId });
  }
}
