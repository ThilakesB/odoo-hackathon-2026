import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';

// Firebase configuration using Vite environment variables with graceful fallbacks
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDayflowDevPlaceholderKey2026",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dayflow-hrms.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dayflow-hrms",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dayflow-hrms.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1029384756",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1029384756:web:a1b2c3d4e5f6g7"
};

// Initialize Firebase
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
