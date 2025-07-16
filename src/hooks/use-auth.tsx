'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { supabase } from '@/lib/supabase';
import { useToast } from './use-toast';
import { initialData } from '@/lib/data';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  error: any;
  login: () => void;
  logout: () => void;
  updateProfilePicture: (file: File) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const createInitialUserData = async (user: any) => {
  if (!user) return;
  const { data, error, status, statusText } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.sub);

  if (error || status !== 200) {
    console.error('Error checking for user:', { error, status, statusText, data });
    return;
  }

  if (data.length === 0) {
    const { error: insertError } = await supabase
      .from('users')
      .insert([{ id: user.sub, data: initialData }]);
    if (insertError) {
      console.error('Error creating user data:', insertError);
    }
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, error, isLoading } = useUser();
  const [loading, setLoading] = useState(isLoading);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setLoading(isLoading);
    if (user) {
      createInitialUserData(user);
    }
  }, [user, isLoading]);

  const login = () => {
    router.push('/api/auth/login');
  };

  const logout = () => {
    router.push('/api/auth/logout');
  };

  const updateProfilePicture = async (file: File) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'User not authenticated.',
      });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('profile-pictures')
        .upload(`${user.sub}/${file.name}`, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(data.path);

      // Auth0 user update would go here, if needed.
      // This example focuses on Supabase storage.

      toast({
        title: 'Success!',
        description: 'Your profile picture has been updated.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error updating profile picture',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    updateProfilePicture,
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
