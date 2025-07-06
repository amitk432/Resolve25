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
  UserCredential,
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
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

const createInitialUserData = async (user: User) => {
  if (!db) return;
  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    // Document for the user doesn't exist, create it
    const goalsCollectionRef = doc(db, 'users', user.uid, 'goals', 'initial-goal');
    
    await setDoc(goalsCollectionRef, {
      title: 'Complete your first goal!',
      description: 'This is an example goal. You can edit or delete it.',
      category: 'Personal',
      deadline: Timestamp.fromDate(new Date(new Date().setDate(new Date().getDate() + 7))),
      steps: [
        { id: 'step1', text: 'Add another step to this goal', completed: false },
        { id: 'step2', text: 'Create a new goal', completed: false },
      ]
    });
  }
};


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

  const handleAuthResult = async (userCredential: UserCredential) => {
    await createInitialUserData(userCredential.user);
    router.push('/dashboard');
  }

  const handleAuthNotReady = () => {
    toast({
        variant: 'destructive',
        title: 'Authentication Not Configured',
        description: "Please update your Firebase credentials in src/lib/firebase.ts.",
    });
  }

  const handleAuthError = (error: any) => {
    console.error(error);
    if (error.code === 'auth/unauthorized-domain') {
       toast({
          variant: 'destructive',
          title: 'Action Required: Unauthorized Domain',
          description: `To fix this, go to your Firebase project > Authentication > Settings and add this domain to the 'Authorized domains' list: ${window.location.origin}`,
          duration: 20000,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: error.message || 'An unexpected error occurred.',
      });
    }
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      await handleAuthResult(userCredential);
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
      const userCredential = await signInWithPopup(auth, provider);
      await handleAuthResult(userCredential);
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
