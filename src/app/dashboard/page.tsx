
'use client';

import { useState, useEffect, ReactNode } from 'react';
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
  const [errorState, setErrorState] = useState<ReactNode | null>(null);

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
             const rulesFix = (
                <div className="text-left space-y-3">
                    <p>This is a common setup issue. To fix it, please update your Firestore security rules in the Firebase Console for project <strong className="font-mono bg-muted/50 px-1 py-0.5 rounded">{`resolve25-9e336`}</strong>:</p>
                    <ol className="list-decimal list-inside space-y-2 pl-2">
                        <li>Go to <strong>Build &gt; Firestore Database</strong> and select the "Rules" tab.</li>
                        <li>
                            Copy and paste these rules to allow authenticated users to read and write their own documents:
                            <pre className="mt-2 p-3 bg-muted rounded-md text-xs w-full overflow-x-auto">
                                <code>{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`}</code>
                            </pre>
                        </li>
                    </ol>
                </div>
             );

             if (error.code === 'unavailable') {
                setErrorState(
                    <div className="text-left space-y-3">
                        <p>This means your app can't connect to the database. In the Firebase Console for project <strong className="font-mono bg-muted/50 px-1 py-0.5 rounded">{`resolve25-9e336`}</strong>, please:</p>
                        <ol className="list-decimal list-inside space-y-2 pl-2">
                             <li>Go to <strong>Build &gt; Firestore Database</strong> and click <strong>Create database</strong>.</li>
                             <li>Ensure your security rules are set up correctly (see below).</li>
                        </ol>
                        {rulesFix}
                    </div>
                );
            } else if (error.code === 'permission-denied') {
                setErrorState(rulesFix);
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
          <div className="max-w-2xl w-full text-center rounded-lg border bg-card text-card-foreground shadow-sm p-8">
            <h2 className="text-xl font-bold text-destructive mb-4">Failed to Load Your Plan</h2>
            <div className="text-muted-foreground">{errorState}</div>
            <p className="text-sm text-muted-foreground mt-6">After resolving the issue in your Firebase Console, please refresh the page.</p>
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
