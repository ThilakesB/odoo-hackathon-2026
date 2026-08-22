import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAmOa-8MmZQhwlRMezNM3G5movTWoSpHaM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dayfloe-fe234.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dayfloe-fe234",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dayfloe-fe234.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "991828345165",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:991828345165:web:f92c7b357052396bb73704",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-5J7SFCN56X"
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Initiates Google Sign-In with automatic fallback from Popup to Redirect mode if popups are blocked.
 */
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const idToken = await user.getIdToken();

    return {
      success: true,
      email: user.email || '',
      name: user.displayName || user.email?.split('@')[0] || 'Google User',
      photoUrl: user.photoURL || undefined,
      idToken
    };
  } catch (error: any) {
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
      console.warn('Popup blocked by browser. Switching to redirect sign-in...');
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw error;
  }
};

/**
 * Direct popup sign-in helper
 */
export const signInWithGooglePopup = signInWithGoogle;

/**
 * Checks for Google authentication redirect result when page reloads.
 */
export const checkGoogleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      const user = result.user;
      const idToken = await user.getIdToken();
      return {
        success: true,
        email: user.email || '',
        name: user.displayName || user.email?.split('@')[0] || 'Google User',
        photoUrl: user.photoURL || undefined,
        idToken
      };
    }
    return null;
  } catch (error: any) {
    console.error('Redirect auth result error:', error);
    return null;
  }
};
