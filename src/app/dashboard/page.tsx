'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc, setDoc, Timestamp, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { produce } from 'immer';
import { db } from '@/lib/firebase';
import type { Goal, Step } from '@/lib/types';

import { Loader2 } from 'lucide-react';
import Dashboard from '@/components/dashboard';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      const fetchGoals = async () => {
        setLoading(true);
        if (!db) {
          console.error("Firestore not initialized");
          setLoading(false);
          return;
        }
        try {
          const goalsCol = collection(db, 'users', user.uid, 'goals');
          const goalsSnapshot = await getDocs(goalsCol);
          const userGoals = goalsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              deadline: (data.deadline as Timestamp).toDate(),
            } as Goal;
          });
          setGoals(userGoals);
        } catch (error) {
          console.error("Error fetching goals: ", error);
          toast({
            variant: 'destructive',
            title: 'Failed to load goals',
            description: 'Could not retrieve your goals from the database.'
          });
        } finally {
          setLoading(false);
        }
      };
      fetchGoals();
    }
  }, [user, toast]);
  
  const handleGoalAdd = async (newGoalData: Omit<Goal, 'id' | 'steps'>) => {
    if (!user || !db) return;
    const newId = doc(collection(db, 'users', user.uid, 'goals')).id;
    const newGoal: Goal = {
      ...newGoalData,
      id: newId,
      steps: [],
    };
    
    try {
      await setDoc(doc(db, 'users', user.uid, 'goals', newId), {
        ...newGoalData,
        deadline: Timestamp.fromDate(newGoalData.deadline),
      });

      setGoals(produce(draft => {
        draft.push(newGoal);
      }));
    } catch (error) {
      console.error("Error adding goal: ", error);
      toast({
        variant: 'destructive',
        title: 'Failed to add goal',
        description: 'There was a problem saving your new goal.',
      });
    }
  };

  const handleGoalDelete = async (goalId: string) => {
    if (!user || !db) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'goals', goalId));
      setGoals(produce(draft => {
        return draft.filter(g => g.id !== goalId);
      }));
       toast({
        title: 'Goal Deleted!',
        description: 'Your goal has been successfully removed.',
      });
    } catch (error) {
       console.error("Error deleting goal: ", error);
       toast({
        variant: 'destructive',
        title: 'Failed to delete goal',
        description: 'There was a problem deleting your goal.',
      });
    }
  };

  const updateGoalInFirestore = async (goal: Goal) => {
    if (!user || !db) return;
    const goalRef = doc(db, 'users', user.uid, 'goals', goal.id);
    const { id, ...goalData } = goal;
    await setDoc(goalRef, {
      ...goalData,
      deadline: Timestamp.fromDate(goal.deadline),
    });
  };

  const handleStepToggle = (goalId: string, stepId: string) => {
    const updatedGoals = produce(goals, draft => {
      const goal = draft.find(g => g.id === goalId);
      if (goal) {
        const step = goal.steps.find(s => s.id === stepId);
        if (step) {
          step.completed = !step.completed;
        }
      }
    });
    setGoals(updatedGoals);
    const updatedGoal = updatedGoals.find(g => g.id === goalId);
    if (updatedGoal) updateGoalInFirestore(updatedGoal);
  };

  const handleStepAdd = (goalId: string, stepText: string) => {
    const newStep: Step = {
      id: doc(collection(db, 'users')).id, // Just for a unique client-side ID
      text: stepText,
      completed: false
    };

    const updatedGoals = produce(goals, draft => {
      const goal = draft.find(g => g.id === goalId);
      if (goal) {
        goal.steps.push(newStep);
      }
    });
    setGoals(updatedGoals);
    const updatedGoal = updatedGoals.find(g => g.id === goalId);
    if (updatedGoal) updateGoalInFirestore(updatedGoal);
  };

  if (authLoading || loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <Dashboard
      goals={goals}
      onGoalAdd={handleGoalAdd}
      onGoalDelete={handleGoalDelete}
      onStepToggle={handleStepToggle}
      onStepAdd={handleStepAdd}
    />
  );
}
