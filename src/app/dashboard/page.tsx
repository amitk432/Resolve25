'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc, setDoc, FirestoreError } from 'firebase/firestore';
import { produce } from 'immer';
import { db } from '@/lib/firebase';
import type { AppData } from '@/lib/types';
import { initialData } from '@/lib/data';

import { Loader2 } from 'lucide-react';
import Dashboard from '@/components/dashboard';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        setLoading(true);
        setErrorState(null);
        if (!db) {
          console.error("Firestore not initialized");
          setErrorState("Firestore is not configured correctly. Please check your firebase.ts file.");
          setLoading(false);
          return;
        }
        try {
          const planRef = doc(db, 'users', user.uid);
          const planSnap = await getDoc(planRef);

          if (planSnap.exists()) {
            setData(planSnap.data() as AppData);
          } else {
            await setDoc(planRef, initialData);
            setData(initialData);
             toast({
              title: 'Welcome!',
              description: "We've set up a personalized action plan for you.",
            });
          }
        } catch (error) {
          console.error("Error fetching user data: ", error);
          if (error instanceof FirestoreError) {
             if (error.code === 'unavailable') {
                const errorMessage = "Could not connect to the database. This can happen if you are offline, or if Firestore is not enabled or has incorrect security rules in your Firebase project. Please check your project settings.";
                setErrorState(errorMessage);
                toast({ variant: 'destructive', title: 'Connection Error', description: errorMessage, duration: 15000 });
            } else if (error.code === 'permission-denied') {
                const errorMessage = "You do not have permission to read your data. Please check your Firestore security rules in the Firebase Console to allow reads for authenticated users.";
                setErrorState(errorMessage);
                toast({ variant: 'destructive', title: 'Permission Denied', description: errorMessage, duration: 15000 });
            } else {
                const errorMessage = `An unexpected error occurred: ${error.message}`;
                setErrorState(errorMessage);
                toast({ variant: 'destructive', title: 'Failed to load your plan', description: error.message });
            }
          } else {
             setErrorState('An unexpected error occurred while fetching your data.');
             toast({ variant: 'destructive', title: 'Failed to load your plan', description: 'An unknown error occurred.' });
          }
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [user, toast]);

  const updateDataInFirestore = async (updatedData: AppData) => {
    if (!user || !db) return;
    const planRef = doc(db, 'users', user.uid);
    try {
      await setDoc(planRef, updatedData, { merge: true });
    } catch (error) {
      console.error("Error updating data: ", error);
      if (error instanceof FirestoreError && error.code === 'permission-denied') {
        toast({
          variant: 'destructive',
          title: 'Permission Denied',
          description: "Could not save your changes. Please check your Firestore security rules to allow writes for authenticated users.",
          duration: 15000
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to save changes',
          description: 'Your recent changes could not be saved to the database.',
        });
      }
    }
  };
  
  const handleUpdate = (updater: (draft: AppData) => void) => {
    if (!data) return;
    const newData = produce(data, updater);
    setData(newData);
    updateDataInFirestore(newData);
  };
  
  if (authLoading || loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (errorState) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background p-8">
          <div className="max-w-2xl text-center rounded-lg border bg-card text-card-foreground shadow-sm p-8">
            <h2 className="text-xl font-bold text-destructive mb-4">Failed to Load Your Plan</h2>
            <p className="text-muted-foreground">{errorState}</p>
            <p className="text-sm text-muted-foreground mt-4">Please resolve the issue in your Firebase Console and then refresh the page.</p>
          </div>
      </div>
    );
  }

  if (!user || !data) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="w-full p-0 md:p-8">
      <Dashboard
        data={data}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
