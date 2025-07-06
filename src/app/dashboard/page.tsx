
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        setLoading(true);
        if (!db) {
          console.error("Firestore not initialized");
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
          toast({
            variant: 'destructive',
            title: 'Failed to load your plan',
            description: 'Could not retrieve your plan from the database.'
          });
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
      toast({
        variant: 'destructive',
        title: 'Failed to save changes',
        description: 'Your recent changes could not be saved to the database.',
      });
    }
  };
  
  const handleUpdate = (updater: (draft: AppData) => void) => {
    if (!data) return;
    const newData = produce(data, updater);
    setData(newData);
    updateDataInFirestore(newData);
  };
  
  if (authLoading || loading || !user || !data) {
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
