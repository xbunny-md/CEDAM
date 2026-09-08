import { db } from '@/lib/firebase';
import { collection, doc, writeBatch, serverTimestamp, getDocs, query, where, limit, getCountFromServer, getDoc } from 'firebase/firestore';

// Topics and user archetypes for realistic generation
const TOPICS = ['Football', 'Music', 'Memes', 'Fashion', 'Gaming', 'Technology', 'Entertainment', 'School-life'];
const FIRST_NAMES = ['Kato', 'Wasswa', 'Mukasa', 'Kizito', 'Musisi', 'Ssematimba', 'Kakooza', 'Kavuma', 'Mugisha', 'Kagimu', 'Lwanga', 'Lubwama'];
const LAST_NAMES = ['Boyz', 'Luga', 'Mwana', 'Don', 'Pro', 'Tech', 'G', 'Star'];

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Ensure unique IDs
const generateSimulatedUserId = () => `sim_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;

export class SimulationEngine {
  private isRunning: boolean = false;
  private intervalId: number | null = null;
  private logCallback: (msg: string) => void = () => {};

  setLogger(callback: (msg: string) => void) {
    this.logCallback = callback;
  }

  private log(msg: string) {
    console.log(`[SimulationEngine] ${msg}`);
    this.logCallback(msg);
  }

  async seedInitialAccounts(count: number = 100) {
    this.log(`Seeding ${count} simulated accounts...`);
    
    // Batch writes (max 500 per batch)
    let batch = writeBatch(db);
    let opCount = 0;
    
    for (let i = 0; i < count; i++) {
      const uid = generateSimulatedUserId();
      const userRef = doc(db, 'users', uid);
      const usernameRef = doc(db, 'usernames', `simuser${Date.now()}${i}`);
      
      const firstName = getRandomElement(FIRST_NAMES);
      const lastName = getRandomElement(LAST_NAMES);
      const displayName = `${firstName} ${lastName}`;
      const username = `sim_${firstName.toLowerCase()}${i}`;
      
      const profile = {
        uid,
        displayName,
        username,
        bio: `Simulated community member. Loves ${getRandomElement(TOPICS)} and ${getRandomElement(TOPICS)}.`,
        avatarUrl: null,
        followersCount: getRandomInt(0, 50),
        followingCount: getRandomInt(0, 50),
        postsCount: 0,
        likesReceived: 0,
        challengesJoined: 0,
        challengeVotesReceived: 0,
        points: getRandomInt(0, 300),
        badges: ['og'],
        createdAt: serverTimestamp(),
        accountType: 'simulated',
        isSimulated: true,
        createdByEngine: true,
      };

      batch.set(userRef, profile);
      batch.set(usernameRef, { uid });
      opCount += 2;

      if (opCount >= 490) {
        await batch.commit();
        batch = writeBatch(db);
        opCount = 0;
        this.log(`Committed batch of simulated accounts...`);
      }
    }

    if (opCount > 0) {
      await batch.commit();
    }
    
    this.log(`Successfully seeded ${count} simulated accounts.`);
  }

  // Gets a random simulated user
  private async getRandomSimulatedUser() {
    const usersRef = collection(db, 'users');
    // In a real huge DB, this isn't perfectly uniform without special indices, 
    // but for our internal engine with a few hundred users, limiting is fine.
    const q = query(usersRef, where('isSimulated', '==', true), limit(20));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docs = snapshot.docs;
    return docs[Math.floor(Math.random() * docs.length)].data();
  }

  // Generate diverse fictional content (Without exposing raw Gemini Keys client side, 
  // we will use basic templated content generation to remain entirely client-side and fast.
  // We can expand this easily if we want LLM integration.)
  private generateContent() {
    const topic = getRandomElement(TOPICS);
    const templates = [
      `Anyone else obsessed with ${topic} lately? Let's discuss.`,
      `Just saw the craziest thing related to ${topic}!`,
      `What's everyone's favorite thing about ${topic}?`,
      `I can't believe how much ${topic} has changed over the years.`,
      `Looking for recommendations for ${topic}. Drop them below!`,
      `Unpopular opinion about ${topic}... it's actually overrated.`,
      `Luga Boyz represent! Who's into ${topic}?`
    ];
    return getRandomElement(templates);
  }

  async performRandomAction() {
    try {
      const user = await this.getRandomSimulatedUser();
      if (!user) {
        this.log('No simulated users found. Please seed first.');
        return;
      }

      const actionType = Math.random();
      
      if (actionType < 0.25) {
        // 25% chance to Create Post
        const content = this.generateContent();
        const postRef = doc(collection(db, 'posts'));
        const batch = writeBatch(db);
        batch.set(postRef, {
          authorId: user.uid,
          content,
          type: 'text',
          createdAt: serverTimestamp(),
          likesCount: 0,
          commentsCount: 0,
          isSimulated: true, // mark the post
        });
        // Gain 5 points for posting
        batch.update(doc(db, 'users', user.uid), { 
           points: (user.points || 0) + 5,
           postsCount: (user.postsCount || 0) + 1
        });
        await batch.commit();
        this.log(`Action: ${user.username} created a post and gained 5 pts.`);
        
      } else if (actionType < 0.45) {
        // 20% chance to Like a recent post
        const postsRef = collection(db, 'posts');
        const q = query(postsRef, limit(10));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const randomPost = getRandomElement(snapshot.docs);
          const postData = randomPost.data();
          const likeRef = doc(db, 'posts', randomPost.id, 'likes', user.uid);
          
          const batch = writeBatch(db);
          batch.set(likeRef, { createdAt: serverTimestamp() });
          batch.update(randomPost.ref, { likesCount: (postData.likesCount || 0) + 1 });
          if (postData.authorId) {
             batch.update(doc(db, 'users', postData.authorId), { likesReceived: (postData.likesReceived || 0) + 1 });
          }
          await batch.commit();
          this.log(`Action: ${user.username} liked a post.`);
        }
      } else if (actionType < 0.6) {
        // 15% chance to comment on a recent post
        const postsRef = collection(db, 'posts');
        const q = query(postsRef, limit(10));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const randomPost = getRandomElement(snapshot.docs);
          const postData = randomPost.data();
          const commentRef = doc(collection(db, 'posts', randomPost.id, 'comments'));
          
          const batch = writeBatch(db);
          batch.set(commentRef, { 
            authorId: user.uid,
            content: this.generateContent(),
            createdAt: serverTimestamp(),
          });
          batch.update(randomPost.ref, { commentsCount: (postData.commentsCount || 0) + 1 });
          batch.update(doc(db, 'users', user.uid), { points: (user.points || 0) + 2 });
          
          await batch.commit();
          this.log(`Action: ${user.username} commented on a post and gained 2 pts.`);
        }
      } else if (actionType < 0.75) {
        // 15% chance to participate in a challenge
        const challengesRef = collection(db, 'challenges');
        const q = query(challengesRef, limit(10));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const randomChallenge = getRandomElement(snapshot.docs);
          const entryRef = doc(collection(db, 'challenges', randomChallenge.id, 'entries'));
          
          const batch = writeBatch(db);
          batch.set(entryRef, {
            authorId: user.uid,
            content: `My entry for ${randomChallenge.data().title}: ${this.generateContent()}`,
            type: 'text',
            votesCount: 0,
            createdAt: serverTimestamp(),
            isSimulated: true
          });
          batch.update(randomChallenge.ref, { participantsCount: (randomChallenge.data().participantsCount || 0) + 1 });
          batch.update(doc(db, 'users', user.uid), { 
             challengesJoined: (user.challengesJoined || 0) + 1,
             points: (user.points || 0) + 10
          });
          await batch.commit();
          this.log(`Action: ${user.username} joined a challenge and gained 10 pts.`);
        }
      } else if (actionType < 0.9) {
        // 15% chance to CREATE a new challenge
        const topic = getRandomElement(TOPICS);
        const challengeRef = doc(collection(db, 'challenges'));
        const batch = writeBatch(db);
        batch.set(challengeRef, {
          title: `${topic} Masterclass`,
          description: `Show us your best ${topic} skills. May the best Luga Boy win!`,
          type: 'text',
          creatorId: user.uid,
          createdAt: serverTimestamp(),
          endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          participantsCount: 0,
          status: 'active',
          points: 500,
          isSimulated: true
        });
        batch.update(doc(db, 'users', user.uid), { points: (user.points || 0) + 20 });
        await batch.commit();
        this.log(`Action: ${user.username} created a new challenge and gained 20 pts.`);
      } else {
        // 10% chance to follow someone
        const target = await this.getRandomSimulatedUser();
        if (target && target.uid !== user.uid) {
          const followRef = doc(db, 'users', target.uid, 'followers', user.uid);
          const followingRef = doc(db, 'users', user.uid, 'following', target.uid);
          
          const batch = writeBatch(db);
          batch.set(followRef, { createdAt: serverTimestamp() });
          batch.set(followingRef, { createdAt: serverTimestamp() });
          batch.update(doc(db, 'users', target.uid), { followersCount: (target.followersCount || 0) + 1 });
          batch.update(doc(db, 'users', user.uid), { followingCount: (user.followingCount || 0) + 1 });
          
          await batch.commit();
          this.log(`Action: ${user.username} followed ${target.username}.`);
        }
      }
    } catch (err: any) {
      this.log(`Error performing action: ${err.message}`);
    }
  }

  private seedIntervalId: number | null = null;

  start(intervalMs: number = 5000) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.log(`Simulation Engine STARTED (Interval: ${intervalMs}ms)`);
    
    // Run immediately
    this.performRandomAction();

    this.intervalId = window.setInterval(() => {
      if (!this.isRunning) return;
      this.performRandomAction();
    }, intervalMs);

    // Seed 100 users every minute
    this.seedIntervalId = window.setInterval(() => {
      if (!this.isRunning) return;
      this.log('Minute passed: Generating 100 new community accounts...');
      this.seedInitialAccounts(100).catch(err => this.log(`Seed error: ${err.message}`));
    }, 60000);
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.seedIntervalId) clearInterval(this.seedIntervalId);
    this.intervalId = null;
    this.seedIntervalId = null;
    this.log('Simulation Engine STOPPED');
  }

  getStatus() {
    return this.isRunning;
  }
}

export const engine = new SimulationEngine();
