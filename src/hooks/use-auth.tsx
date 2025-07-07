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
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import { useToast } from './use-toast';
import { initialData } from '@/lib/data';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authError: ReactNode | null;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGitHub: () => Promise<void>;
  updateProfilePicture: (file: File) => Promise<void>;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const createInitialUserData = async (user: User) => {
  if (!db) return;
  const userPlanRef = doc(db, 'users', user.uid);
  const userPlanDoc = await getDoc(userPlanRef);

  if (!userPlanDoc.exists()) {
    await setDoc(userPlanRef, initialData);
  }
};


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<ReactNode | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const isConfigured = !!auth;

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
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
       const hostname = typeof window !== 'undefined' ? new URL(window.location.href).hostname : 'your-app-domain.com';
       const unauthorizedDomainFix = (
         <div className="text-left space-y-2 text-sm">
            <p className="font-semibold text-base">Action Required: Unauthorized Domain</p>
            <p>To fix this, you need to authorize your application's domain in the Firebase Console.</p>
            <ol className="list-decimal list-inside space-y-2 mt-2">
                <li>
                    Go to your Firebase project's <strong>Authentication &gt; Settings</strong> tab.
                </li>
                <li>
                    Under the <strong>Authorized domains</strong> section, click <strong>Add domain</strong>.
                </li>
                <li>
                    Enter: <code className="bg-muted px-1 py-0.5 rounded font-mono">{hostname}</code>
                </li>
                <li>
                    Click <strong>Add</strong>, then return here and try again.
                </li>
            </ol>
         </div>
       );
       setAuthError(unauthorizedDomainFix);
    } else {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  };

  const startAuthAction = () => {
    setLoading(true);
    setAuthError(null);
  }
  
  const login = async (email: string, pass: string) => {
    if (!auth) return handleAuthNotReady();
    startAuthAction();
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
    startAuthAction();
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
    startAuthAction();
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
    startAuthAction();
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

  const updateProfilePicture = async (file: File) => {
    if (!auth?.currentUser || !storage) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'User not authenticated or storage is not configured.',
        });
        return;
    }
    setLoading(true);
    try {
        const userToUpdate = auth.currentUser;
        const storageRef = ref(storage, `profile-pictures/${userToUpdate.uid}`);
        
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        await updateProfile(userToUpdate, { photoURL: downloadURL });
        
        // Force a reload of the user object to get latest profile
        await userToUpdate.reload();
        // Update state with the reloaded user object to trigger UI updates
        setUser(auth.currentUser);

        toast({
            title: 'Success!',
            description: 'Your profile picture has been updated.',
        });
    } catch (error) {
        handleAuthError(error);
    } finally {
        setLoading(false);
    }
  };


  const value = {
    user,
    loading,
    authError,
    login,
    signup,
    logout,
    loginWithGoogle,
    loginWithGitHub,
    updateProfilePicture,
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
