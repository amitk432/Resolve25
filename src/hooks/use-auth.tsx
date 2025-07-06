'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  onAuthStateChanged,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from './use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGitHub: () => Promise<void>;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const isConfigured = !!auth;

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      console.warn("Firebase not configured. Auth features are disabled. Please update src/lib/firebase.ts");
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isConfigured]);

  const handleAuthNotReady = () => {
    toast({
        variant: 'destructive',
        title: 'Authentication Not Configured',
        description: "Please update your Firebase credentials in src/lib/firebase.ts.",
    });
  }

  const handleAuthError = (error: any) => {
    console.error(error);
    toast({
      variant: 'destructive',
      title: 'Authentication Error',
      description: error.message || 'An unexpected error occurred.',
    });
  };
  
  const login = async (email: string, pass: string) => {
    if (!auth) return handleAuthNotReady();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      router.push('/dashboard');
    } catch (error) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, pass: string) => {
    if (!auth) return handleAuthNotReady();
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      router.push('/dashboard');
    } catch (error) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (!auth) return handleAuthNotReady();
    setLoading(true);
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const socialLogin = async (provider: GoogleAuthProvider | GithubAuthProvider) => {
    if (!auth) return handleAuthNotReady();
    setLoading(true);
    try {
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (error) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  }

  const loginWithGoogle = () => socialLogin(new GoogleAuthProvider());
  const loginWithGitHub = () => socialLogin(new GithubAuthProvider());


  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    loginWithGoogle,
    loginWithGitHub,
    isConfigured,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
