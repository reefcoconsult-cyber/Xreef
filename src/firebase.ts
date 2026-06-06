import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD3044lUMz7LHHX2uChIc6y2KyneRW7528",
  authDomain: "xreef-8b39b.firebaseapp.com",
  projectId: "xreef-8b39b",
  storageBucket: "xreef-8b39b.firebasestorage.app",
  messagingSenderId: "360423427486",
  appId: "1:360423427486:web:c3a3668324be813061da8f",
  measurementId: "G-7Q9JRYS767"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Services for Xreef App
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Auth Methods
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

let currentAccessToken: string | null = null;

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (credential && credential.accessToken) {
    currentAccessToken = credential.accessToken;
  }
  return result;
};

export const signInWithEmail = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);
export const signUpWithEmail = (email: string, pass: string) => createUserWithEmailAndPassword(auth, email, pass);
export const logOut = () => signOut(auth);

// Firestore helpers
export enum OperationType {
  GET = 'GET',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

export function handleFirestoreError(error: any, operation: OperationType, path: string) {
  console.error(`Firestore error during ${operation} at ${path}:`, error);
}

// Drive auth helpers
export const getAccessToken = async () => {
  return currentAccessToken;
};

export const initAuth = (onAuthSuccess: () => void, onAuthRequired: () => void) => {
  if (currentAccessToken) {
    onAuthSuccess();
  } else {
    onAuthRequired();
  }
};

export default app;