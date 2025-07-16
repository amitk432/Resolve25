
'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { produce } from 'immer';

import type { AppData, JobStatus } from '@/lib/types';
import { initialData } from '@/lib/data';

import { Loader2 } from 'lucide-react';
import Dashboard from '@/components/dashboard';
import { useToast } from '@/hooks/use-toast';
import { getAIJobSuggestions } from '@/app/actions';

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

  // Supabase update function
  const updateDataInSupabase = async (updatedData: AppData) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('users')
        .update({ data: updatedData })
        .eq('id', user.sub);
      if (error) throw error;
    } catch (error: any) {
      console.error("Error updating data: ", error);
      toast({
        variant: 'destructive',
        title: 'Failed to save changes',
        description: error.message || 'Your recent changes could not be saved to the database.',
      });
    }
  };

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        setLoading(true);
        setErrorState(null);
        try {
          const { data: userRows, error, status, statusText } = await supabase
            .from('users')
            .select('data')
            .eq('id', user.sub)
            .single();
          if (error || status !== 200) {
            console.error('Error fetching user data:', { error, status, statusText, userRows });
            throw error || new Error('Failed to fetch user data');
          }
          let fetchedData = userRows?.data as AppData | undefined;
          if (!fetchedData) {
            // Create initial data for new user
            await supabase.from('users').insert([{ id: user.sub, data: initialData }]);
            setData(initialData);
            toast({
              title: 'Welcome!',
              description: "We've set up a personalized action plan for you.",
            });
            setLoading(false);
            return;
          }
          // --- START NEW AUTO-INCREMENT LOGIC ---
          const today = new Date();
          let loansWereUpdated = false;
          const updatedLoans = (fetchedData.loans || []).map(loan => {
            if (loan.status === 'Active' && loan.tenure) {
              const lastUpdate = loan.lastAutoUpdate ? new Date(loan.lastAutoUpdate) : new Date();
              const monthsSinceLastUpdate = (today.getFullYear() - lastUpdate.getFullYear()) * 12 + (today.getMonth() - lastUpdate.getMonth());
              if (monthsSinceLastUpdate > 0) {
                const currentEmisPaid = parseInt(loan.emisPaid || '0', 10);
                const totalTenure = parseInt(loan.tenure, 10);
                if (currentEmisPaid < totalTenure) {
                  const newEmisPaid = Math.min(totalTenure, currentEmisPaid + monthsSinceLastUpdate);
                  if (String(newEmisPaid) !== loan.emisPaid) {
                    loansWereUpdated = true;
                    return {
                      ...loan,
                      emisPaid: String(newEmisPaid),
                      lastAutoUpdate: today.toISOString(),
                    };
                  }
                }
              }
            }
            return loan;
          });
          if (loansWereUpdated) {
            fetchedData = { ...fetchedData, loans: updatedLoans };
          }
          // --- END NEW AUTO-INCREMENT LOGIC ---
          // Merge with initialData to ensure all fields are present for older user documents
          const completeData = { ...initialData, ...fetchedData };
          completeData.goals = completeData.goals || [];
          completeData.travelGoals = completeData.travelGoals || [];
          completeData.monthlyPlan = completeData.monthlyPlan || [];
          completeData.carSaleChecklist = completeData.carSaleChecklist || [];
          completeData.loans = completeData.loans || [];
          completeData.jobApplications = completeData.jobApplications || [];
          completeData.dailyTasks = completeData.dailyTasks || [];
          completeData.sips = completeData.sips || [];
          completeData.emergencyFundTarget = completeData.emergencyFundTarget || '40000';
          completeData.incomeSources = completeData.incomeSources && completeData.incomeSources.length > 0
            ? completeData.incomeSources
            : [{ id: 'income-1', name: 'Primary Job', amount: '50000' }];
          completeData.lastJobSuggestionCheck = completeData.lastJobSuggestionCheck || new Date(0).toISOString();
          let dataForState = completeData;
          // --- START NEW DAILY JOB CHECK ---
          const now = new Date();
          const lastCheck = new Date(dataForState.lastJobSuggestionCheck || 0);
          const today9AM = new Date();
          today9AM.setHours(9, 0, 0, 0);
          if (now >= today9AM && lastCheck < today9AM && dataForState.resume) {
            toast({
              title: "Finding new jobs for you...",
              description: "Our AI is checking for daily job recommendations.",
            });
            const suggestionsResult = await getAIJobSuggestions({ resume: dataForState.resume });
            let dataWasUpdated = false;
            if (suggestionsResult && 'suggestions' in suggestionsResult && suggestionsResult.suggestions.length > 0) {
              const newJobs = suggestionsResult.suggestions;
              const updatedDataWithNewJobs = produce(dataForState, draft => {
                newJobs.forEach(newJob => {
                  const exists = draft.jobApplications.some(
                    j => j.company === newJob.company && j.role === newJob.role
                  );
                  if (!exists) {
                    draft.jobApplications.unshift({
                      ...newJob,
                      status: 'Need to Apply',
                      date: new Date().toISOString(),
                    });
                  }
                });
                draft.lastJobSuggestionCheck = now.toISOString();
              });
              dataForState = updatedDataWithNewJobs;
              dataWasUpdated = true;
              toast({
                title: `Found ${newJobs.length} new job suggestions!`,
                description: "They've been added to your Job Search tracker.",
                duration: 7000
              });
            } else {
              const updatedDataWithCheckTime = produce(dataForState, draft => {
                draft.lastJobSuggestionCheck = now.toISOString();
              });
              dataForState = updatedDataWithCheckTime;
              dataWasUpdated = true;
            }
            if (dataWasUpdated) {
              await updateDataInSupabase(dataForState);
            }
          }
          // --- END NEW DAILY JOB CHECK ---
          setData(dataForState as AppData);
          if (loansWereUpdated) {
            await updateDataInSupabase(dataForState as AppData);
            toast({
              title: "Loan Progress Updated",
              description: "We've automatically updated your EMI payment progress."
            });
          }
        } catch (error: any) {
          console.error("Error fetching user data: ", error);
          setErrorState('An unexpected error occurred while fetching your data.');
          toast({ variant: 'destructive', title: 'Failed to load your plan', description: error.message || 'An unknown error occurred.' });
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [user, toast]);
  
  const handleUpdate = (updater: (draft: AppData) => void) => {
    if (!data) return;
    const newData = produce(data, updater);
    setData(newData);
    updateDataInSupabase(newData);
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
          <div className="max-w-2xl w-full rounded-lg border bg-card text-card-foreground shadow-sm p-8">
            <div className="text-muted-foreground">{errorState}</div>
            <p className="text-sm text-muted-foreground mt-6">If you continue to see this error, please contact support.</p>
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
    <div className="w-full p-4 md:p-8">
      <Dashboard
        data={data}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
