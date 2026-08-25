import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import type { User, EmployeeProfile, Role } from '../types';
import {
  auth,
  loginWithEmail as fbLoginWithEmail,
  registerWithEmail as fbRegisterWithEmail,
  signInWithGoogle as fbSignInWithGoogle,
  logoutUser as fbLogoutUser
} from '../config/firebase';
import {
  firestoreUserService,
  seedInitialHRData
} from '../services/firestoreService';

interface AuthContextType {
  user: User | null;
  profile: EmployeeProfile | null;
  role: Role | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  loginWithOtp?: (data: { email: string; otp: string }) => Promise<void>;
  loginWithGoogle: (data?: any) => Promise<void>;
  register: (data: { email: string; password: string; name?: string; role?: Role; department?: string; designation?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  loginAsDemo: (role: 'admin' | 'employee') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('dayflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [profile, setProfile] = useState<EmployeeProfile | null>(() => {
    const saved = localStorage.getItem('dayflow_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('dayflow_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize and seed demo data in Firestore on initial load
  useEffect(() => {
    seedInitialHRData().catch(console.warn);
  }, []);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          localStorage.setItem('dayflow_token', idToken);
          setToken(idToken);

          const { user: uData, profile: pData } = await firestoreUserService.getOrCreateUser({
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL
          });

          setUser(uData);
          setProfile(pData);
          localStorage.setItem('dayflow_user', JSON.stringify(uData));
          localStorage.setItem('dayflow_profile', JSON.stringify(pData));
        } catch (err) {
          console.error('Error syncing Firebase user profile:', err);
        }
      } else {
        // If not authenticated in Firebase and no demo local session, clear
        const savedToken = localStorage.getItem('dayflow_token');
        if (!savedToken?.startsWith('demo_token_')) {
          setToken(null);
          setUser(null);
          setProfile(null);
          localStorage.removeItem('dayflow_token');
          localStorage.removeItem('dayflow_user');
          localStorage.removeItem('dayflow_profile');
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      // 1. Direct demo shortcut if matching demo email
      if (credentials.email === 'admin@dayflow.com' && credentials.password === 'Admin@123') {
        await loginAsDemo('admin');
        return;
      }
      if (credentials.email === 'employee@dayflow.com' && credentials.password === 'Employee@123') {
        await loginAsDemo('employee');
        return;
      }

      // 2. Firebase Email/Password Auth
      const { user: fbUser, idToken } = await fbLoginWithEmail(credentials.email, credentials.password);
      localStorage.setItem('dayflow_token', idToken);
      setToken(idToken);

      const { user: uData, profile: pData } = await firestoreUserService.getOrCreateUser({
        uid: fbUser.uid,
        email: fbUser.email || credentials.email,
        displayName: fbUser.displayName
      });

      setUser(uData);
      setProfile(pData);
      localStorage.setItem('dayflow_user', JSON.stringify(uData));
      localStorage.setItem('dayflow_profile', JSON.stringify(pData));
    } catch (err: any) {
      console.error('Firebase Email Login failed:', err);
      // If user not found in Firebase Auth yet, offer graceful fallback / auto-create
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        throw new Error('Invalid email or password. You can also sign up or use 1-Click Demo Login.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { email: string; password: string; name?: string; role?: Role; department?: string; designation?: string }) => {
    setIsLoading(true);
    try {
      const { user: fbUser, idToken } = await fbRegisterWithEmail(data.email, data.password, data.name);
      localStorage.setItem('dayflow_token', idToken);
      setToken(idToken);

      const { user: uData, profile: pData } = await firestoreUserService.getOrCreateUser({
        uid: fbUser.uid,
        email: data.email,
        displayName: data.name,
        role: data.role || 'employee'
      });

      if (data.department || data.designation) {
        const updatedProfile = await firestoreUserService.updateProfile(fbUser.uid, {
          department: data.department || pData.department,
          designation: data.designation || pData.designation
        });
        setProfile(updatedProfile);
        localStorage.setItem('dayflow_profile', JSON.stringify(updatedProfile));
      } else {
        setProfile(pData);
        localStorage.setItem('dayflow_profile', JSON.stringify(pData));
      }

      setUser(uData);
      localStorage.setItem('dayflow_user', JSON.stringify(uData));
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const res = await fbSignInWithGoogle();
      if (!res) {
        setIsLoading(false);
        return;
      }

      localStorage.setItem('dayflow_token', res.idToken);
      setToken(res.idToken);

      const { user: uData, profile: pData } = await firestoreUserService.getOrCreateUser({
        uid: res.uid,
        email: res.email,
        displayName: res.name,
        photoURL: res.photoUrl
      });

      setUser(uData);
      setProfile(pData);
      localStorage.setItem('dayflow_user', JSON.stringify(uData));
      localStorage.setItem('dayflow_profile', JSON.stringify(pData));
    } catch (error: any) {
      console.error('Firebase Google Auth error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemo = async (role: 'admin' | 'employee') => {
    setIsLoading(true);
    try {
      const demoUid = role === 'admin' ? 'emp-sarah' : 'emp-alex';
      const demoToken = `demo_token_${role}_${Date.now()}`;
      localStorage.setItem('dayflow_token', demoToken);
      setToken(demoToken);

      let pData = await firestoreUserService.getProfile(demoUid);
      if (!pData) {
        await seedInitialHRData();
        pData = await firestoreUserService.getProfile(demoUid);
      }

      const uData: User = pData?.user || {
        id: demoUid,
        uid: demoUid,
        employee_id: role === 'admin' ? 'EMP-1001' : 'EMP-1042',
        name: role === 'admin' ? 'Sarah Jenkins' : 'Alex Chen',
        email: role === 'admin' ? 'admin@dayflow.com' : 'employee@dayflow.com',
        role: role,
        is_verified: true,
        created_at: new Date().toISOString()
      };

      setUser(uData);
      setProfile(pData);
      localStorage.setItem('dayflow_user', JSON.stringify(uData));
      if (pData) localStorage.setItem('dayflow_profile', JSON.stringify(pData));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fbLogoutUser();
    } catch (e) {
      console.warn('Firebase logout notice:', e);
    }
    localStorage.removeItem('dayflow_token');
    localStorage.removeItem('dayflow_user');
    localStorage.removeItem('dayflow_profile');
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user?.id) {
      try {
        const pData = await firestoreUserService.getProfile(user.id);
        if (pData) {
          setProfile(pData);
          localStorage.setItem('dayflow_profile', JSON.stringify(pData));
        }
      } catch (e) {
        console.error('Failed to refresh profile from Firestore:', e);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: user?.role || null,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        loginWithGoogle,
        register,
        logout,
        refreshProfile,
        loginAsDemo
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
