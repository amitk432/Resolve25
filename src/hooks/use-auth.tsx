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
  updateProfile: (updates: { name?: string; avatar_url?: string }) => Promise<void>;
  loading: boolean | string;
  error: AuthError | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean | string>(true);
  const [error, setError] = useState<AuthError | null>(null);
  const router = useRouter();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (event === 'SIGNED_IN' && session) {
          // Add a small delay to ensure the session is fully established
          await new Promise(resolve => setTimeout(resolve, 100))
          router.push('/dashboard');
        }
        
        if (event === 'SIGNED_OUT') {
          router.push('/login');
        }
      }
    );

    // Initial session fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });


    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

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

  const updateProfile = async (updates: { name?: string; avatar_url?: string }) => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({
      data: updates,
    });
    if (error) setError(error);
    setLoading(false);
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    router.push('/login');
    setLoading(false);
  };

  const value = {
    session,
    user,
    signInWithEmail,
    signUpWithEmail,
    signInWithProvider,
    signOut,
    updateProfile,
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
