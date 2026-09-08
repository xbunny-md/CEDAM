import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const config = {
  projectId: "gen-lang-client-0138948334",
  appId: "1:964764763372:web:802491d55016995c1bd1c9",
  apiKey: "AIzaSyDN8w1PTrbw2FaQjavNdoPJ4UlAkYl_VK4",
  authDomain: "gen-lang-client-0138948334.firebaseapp.com",
  databaseURL: "https://gen-lang-client-0138948334.firebaseio.com",
  storageBucket: "gen-lang-client-0138948334.firebasestorage.app",
  messagingSenderId: "964764763372"
};

export const app = initializeApp(config);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-remixlugaboyzfou-6d6704ac-124d-4ac1-bf6f-5c2a62a5d894");
export const storage = getStorage(app);
