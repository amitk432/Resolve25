'use client';

import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, AuthError } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

type AuthContextType = {
  session: Session | null;
  user: any;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  signInWithProvider: (provider: 'google' | 'github') => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: { name?: string; avatar_url?: string; enabled_features?: string[] }) => Promise<void>;
  clearAuthError: () => void;
  loading: boolean | string;
  error: AuthError | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean | string>(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Handle token refresh errors
        if (event === 'TOKEN_REFRESHED' && !session) {
          // If token refresh failed, clear auth state and redirect to login
          setSession(null);
          setUser(null);
          setHasInitialized(false);
          setError(null);
          router.push('/login');
          return;
        }
        
        // Only redirect to dashboard on the first SIGNED_IN event after initialization
        // This prevents redirects when switching browser tabs or when already navigating
        if (event === 'SIGNED_IN' && session && !hasInitialized && !isNavigating) {
          setHasInitialized(true);
          setIsNavigating(true);
          // Add a small delay to ensure the session is fully established
          await new Promise(resolve => setTimeout(resolve, 100));
          router.push('/dashboard');
          // Reset navigation flag after a short delay
          setTimeout(() => setIsNavigating(false), 1000);
        }
        
        if (event === 'SIGNED_OUT') {
          setHasInitialized(false);
          setIsNavigating(true);
          router.push('/login');
          setTimeout(() => setIsNavigating(false), 1000);
        }
      }
    );

    // Initial session fetch with error handling
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error && error.message.includes('refresh')) {
        // Handle refresh token errors by clearing auth state
        setSession(null);
        setUser(null);
        setLoading(false);
        setError(null);
        router.push('/login');
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      // Mark as initialized if we already have a session
      if (session) {
        setHasInitialized(true);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router, hasInitialized, isNavigating]);

  const signInWithEmail = async (email: string, password: string) => {
    setLoading('email');
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error);
    setLoading(false);
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    setLoading('email');
    setError(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        data: {
          name: name || '',
        },
      },
    });
    if (error) setError(error);
    setLoading(false);
  };

  const signInWithProvider = async (provider: 'google' | 'github') => {
    setLoading(provider);
    setError(null);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    
    if (error) {
      setError(error);
      setLoading(false);
    }
    // Don't set loading to false here since we're redirecting
  };

  const updateProfile = async (updates: { name?: string; avatar_url?: string; enabled_features?: string[] }) => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.updateUser({
      data: updates,
    });
    
    if (error) {
      setError(error);
    } else if (data?.user) {
      // Update the local user state immediately
      setUser(data.user);
    }
    
    setLoading(false);
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setError(null);
    setHasInitialized(false);
    
    // Clear any remaining auth data from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
    }
    
    router.push('/login');
    setLoading(false);
  };

  const clearAuthError = () => {
    setError(null);
  };

  const value = {
    session,
    user,
    signInWithEmail,
    signUpWithEmail,
    signInWithProvider,
    signOut,
    updateProfile,
    clearAuthError,
    loading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
