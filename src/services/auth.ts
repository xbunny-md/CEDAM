import { auth, db } from '@/lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore';

export async function checkUsernameUnique(username: string): Promise<boolean> {
  const docRef = doc(db, 'usernames', username.toLowerCase());
  const docSnap = await getDoc(docRef);
  return !docSnap.exists();
}

export async function registerUser(data: any) {
  // 1. Create Auth user
  const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
  const user = userCredential.user;

  const usernameLower = data.username.toLowerCase();
  const photoURL = data.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`;

  // 2. Start updateProfile in background
  updateProfile(user, {
    displayName: data.displayName,
    photoURL
  }).catch(console.error);

  // 3. Use writeBatch to safely claim username and create profile
  // Using writeBatch instead of runTransaction because runTransaction fails immediately 
  // if the auth token hasn't fully propagated to the Firestore client yet.
  try {
    const batch = writeBatch(db);
    const usernameRef = doc(db, 'usernames', usernameLower);
    const userRef = doc(db, 'users', user.uid);
    
    // Claim username
    batch.set(usernameRef, { uid: user.uid });
    
    // Create profile
    batch.set(userRef, {
      uid: user.uid,
      displayName: data.displayName,
      username: usernameLower,
      bio: '',
      avatarUrl: photoURL,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      likesReceived: 0,
      challengesJoined: 0,
      challengeVotesReceived: 0,
      points: 0,
      badges: ['og'],
      createdAt: serverTimestamp()
    });

    await batch.commit();
  } catch (err: any) {
    console.error("Profile creation failed:", err);
    try {
      await user.delete();
    } catch(deleteErr) {
      console.error("Could not delete broken auth user", deleteErr);
    }
    throw new Error(err.message || 'Failed to create profile in database.');
  }

  return user;
}

export async function loginUser(emailOrUsername: string, pass: string) {
  let email = emailOrUsername;

  // Super Admin Bypass for micknella
  if (emailOrUsername.toLowerCase() === 'micknella' && pass === '123456') {
    const adminEmail = 'micknella@lugaboyz.com';
    try {
      return await signInWithEmailAndPassword(auth, adminEmail, pass);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
        // Auto-register the super admin if they don't exist
        const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, pass);
        const user = userCredential.user;
        const photoURL = 'https://i.ibb.co/chDNHsvK/1788680057122.png';
        
        await updateProfile(user, { displayName: 'Lupin Starnley', photoURL }).catch(console.error);
        
        const batch = writeBatch(db);
        batch.set(doc(db, 'usernames', 'micknella'), { uid: user.uid });
        batch.set(doc(db, 'users', user.uid), {
          uid: user.uid,
          displayName: 'Lupin Starnley',
          username: 'micknella',
          bio: 'Founder & Creator of LUGA BOYZ. Full-Stack Engineer.',
          avatarUrl: photoURL,
          followersCount: 9999,
          followingCount: 0,
          postsCount: 0,
          likesReceived: 0,
          challengesJoined: 0,
          challengeVotesReceived: 0,
          points: 999999,
          badges: ['og', 'super_admin'],
          createdAt: serverTimestamp(),
          accountType: 'admin'
        });
        await batch.commit();
        return userCredential;
      }
      throw err;
    }
  }

  // Normal login
  if (!email.includes('@')) {
    throw new Error('Please enter a valid email address to login, or use the admin username.');
  }
  return await signInWithEmailAndPassword(auth, email, pass);
}

export async function logoutUser() {
  await signOut(auth);
}

export async function loginAsGuest() {
  const userCredential = await signInAnonymously(auth);
  const user = userCredential.user;
  
  // Create a guest profile if it doesn't exist so the UI works correctly
  const userRef = doc(db, 'users', user.uid);
  const docSnap = await getDoc(userRef);
  
  if (!docSnap.exists()) {
    const guestUsername = `guest_${user.uid.substring(0, 5)}`;
    await updateProfile(user, {
      displayName: 'Guest User',
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${guestUsername}`
    });
    
    const batch = writeBatch(db);
    batch.set(doc(db, 'usernames', guestUsername), { uid: user.uid });
    batch.set(userRef, {
      uid: user.uid,
      displayName: 'Guest User',
      username: guestUsername,
      bio: 'Visiting LUGA BOYZ as a guest.',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${guestUsername}`,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      likesReceived: 0,
      challengesJoined: 0,
      challengeVotesReceived: 0,
      points: 0,
      badges: [],
      createdAt: serverTimestamp(),
      accountType: 'guest'
    });
    await batch.commit();
  }
  
  return user;
}
