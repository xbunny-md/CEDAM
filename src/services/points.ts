import { db } from '@/lib/firebase';
import { doc, updateDoc, increment, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

export async function getStreamLeaderboard(): Promise<{ stream: string, points: number, members: number }[]> {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, orderBy('points', 'desc'), limit(100)); // Sample top 100 to aggregate
  const snap = await getDocs(q);
  
  const streamMap: Record<string, { points: number, members: number }> = {};
  
  snap.docs.forEach(doc => {
    const data = doc.data();
    if (data.stream) {
      if (!streamMap[data.stream]) streamMap[data.stream] = { points: 0, members: 0 };
      streamMap[data.stream].points += (data.points || 0);
      streamMap[data.stream].members += 1;
    }
  });

  return Object.entries(streamMap)
    .map(([stream, data]) => ({ stream, ...data }))
    .sort((a, b) => b.points - a.points);
}

export async function getLeaderboard(type: 'points' | 'postsCount' | 'likesReceived' | 'challengesJoined' | 'challengeVotesReceived'): Promise<any[]> {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, orderBy(type, 'desc'), limit(10));
  const snap = await getDocs(q);
  
  return snap.docs.map(doc => ({
    uid: doc.id,
    ...doc.data()
  })).filter(u => u[type] != null && u[type] > 0);
}

export async function awardPoints(userId: string, amount: number, stats?: Partial<Record<keyof UserStats, number>>) {
  try {
    const userRef = doc(db, 'users', userId);
    
    const updateData: any = {
      points: increment(amount)
    };
    
    if (stats) {
      for (const [key, value] of Object.entries(stats)) {
        if (value) {
          updateData[key] = increment(value);
        }
      }
    }

    await updateDoc(userRef, updateData);
    
    // Check for badge unlocks in background
    checkBadges(userId);
  } catch (err) {
    console.error('Failed to award points', err);
  }
}

export const POINTS = {
  CREATE_POST: 10,
  RECEIVE_LIKE: 2,
  RECEIVE_COMMENT: 5,
  VOTE_POLL: 2,
  JOIN_CHALLENGE: 5,
  RECEIVE_CHALLENGE_VOTE: 5,
};

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  requirement: string;
  pointsRequired?: number;
  condition?: (stats: UserStats) => boolean;
}

export interface UserStats {
  points: number;
  postsCount: number;
  likesReceived: number;
  challengesJoined: number;
  challengeVotesReceived: number;
}

export const BADGES: Badge[] = [
  {
    id: 'rising_star',
    name: 'Rising Star',
    description: 'Earned 100 points',
    icon: 'Star',
    color: 'text-yellow-400',
    requirement: '100 points',
    pointsRequired: 100,
  },
  {
    id: 'top_creator',
    name: 'Top Creator',
    description: 'Created 10 posts',
    icon: 'PenTool',
    color: 'text-purple-400',
    requirement: '10 posts',
    condition: (stats) => stats.postsCount >= 10,
  },
  {
    id: 'challenge_king',
    name: 'Challenge King',
    description: 'Joined 5 challenges',
    icon: 'Trophy',
    color: 'text-yellow-500',
    requirement: '5 challenges',
    condition: (stats) => stats.challengesJoined >= 5,
  },
  {
    id: 'popular',
    name: 'Popular',
    description: 'Received 50 likes',
    icon: 'Heart',
    color: 'text-pink-400',
    requirement: '50 likes',
    condition: (stats) => stats.likesReceived >= 50,
  },
  {
    id: 'og',
    name: 'OG',
    description: 'Early adopter',
    icon: 'Crown',
    color: 'text-orange-400',
    requirement: 'Joined early',
  }
];

export async function checkBadges(userId: string) {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    
    const userData = userSnap.data();
    const currentBadges: string[] = userData.badges || [];
    
    const stats: UserStats = {
      points: userData.points || 0,
      postsCount: userData.postsCount || 0,
      likesReceived: userData.likesReceived || 0,
      challengesJoined: userData.challengesJoined || 0,
      challengeVotesReceived: userData.challengeVotesReceived || 0,
    };
    
    const newBadges = [...currentBadges];
    let changed = false;
    
    for (const badge of BADGES) {
      if (!currentBadges.includes(badge.id)) {
        let unlocked = false;
        
        if (badge.pointsRequired && stats.points >= badge.pointsRequired) {
          unlocked = true;
        } else if (badge.condition && badge.condition(stats)) {
          unlocked = true;
        }
        
        if (unlocked) {
          newBadges.push(badge.id);
          changed = true;
        }
      }
    }
    
    if (changed) {
      await updateDoc(userRef, { badges: newBadges });
    }
  } catch (e) {
    console.error('Failed to check badges', e);
  }
}
