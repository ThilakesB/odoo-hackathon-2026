import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, EmployeeProfile, Role } from '../types';
import { authService, employeeService } from '../services/api';

interface AuthContextType {
  user: User | null;
  profile: EmployeeProfile | null;
  role: Role | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  loginWithOtp: (data: { email: string; otp: string }) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('dayflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('dayflow_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentData = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
      localStorage.setItem('dayflow_user', JSON.stringify(userData));
      
      const profileData = await employeeService.getMyProfile();
      setProfile(profileData);
    } catch (err) {
      console.error('Failed to authenticate session:', err);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentData();
  }, [token]);

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const data = await authService.login(credentials);
      // TODO: Migrate to httpOnly cookie storage once backend supports cookie-based session tokens
      localStorage.setItem('dayflow_token', data.access_token);
      setToken(data.access_token);
      
      const uData: User = {
        id: data.user_id,
        employee_id: data.employee_id,
        name: data.name,
        email: data.email,
        role: data.role as Role,
        is_verified: true,
        created_at: new Date().toISOString()
      };
      setUser(uData);
      localStorage.setItem('dayflow_user', JSON.stringify(uData));

      // Refresh profile
      try {
        const pData = await employeeService.getMyProfile();
        setProfile(pData);
      } catch (e) {
        console.warn('Initial profile load warning:', e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithOtp = async (credentials: { email: string; otp: string }) => {
    setIsLoading(true);
    try {
      const data = await authService.verifyOtp(credentials.email, credentials.otp);
      // TODO: Migrate to httpOnly cookie storage once backend supports cookie-based session tokens
      localStorage.setItem('dayflow_token', data.access_token);
      setToken(data.access_token);
      
      const uData: User = {
        id: data.user_id,
        employee_id: data.employee_id,
        name: data.name,
        email: data.email,
        role: data.role as Role,
        is_verified: true,
        created_at: new Date().toISOString()
      };
      setUser(uData);
      localStorage.setItem('dayflow_user', JSON.stringify(uData));

      // Refresh profile
      try {
        const pData = await employeeService.getMyProfile();
        setProfile(pData);
      } catch (e) {
        console.warn('Initial profile load warning:', e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await authService.register(data);
      localStorage.setItem('dayflow_token', res.access_token);
      setToken(res.access_token);
      
      const uData: User = {
        id: res.user_id,
        employee_id: res.employee_id,
        name: res.name,
        email: res.email,
        role: res.role as Role,
        is_verified: true,
        created_at: new Date().toISOString()
      };
      setUser(uData);
      localStorage.setItem('dayflow_user', JSON.stringify(uData));

      const pData = await employeeService.getMyProfile();
      setProfile(pData);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('dayflow_token');
    localStorage.removeItem('dayflow_user');
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (token) {
      try {
        const pData = await employeeService.getMyProfile();
        setProfile(pData);
        if (pData?.profile_picture) {
          setUser((prev) => {
            if (!prev) return prev;
            const updated = { ...prev, avatar_url: pData.profile_picture };
            localStorage.setItem('dayflow_user', JSON.stringify(updated));
            return updated;
          });
        }
      } catch (e) {
        console.error('Failed to refresh profile', e);
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
        loginWithOtp,
        register,
        logout,
        refreshProfile
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
