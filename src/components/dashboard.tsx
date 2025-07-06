'use client';

import { useState, useMemo, useEffect } from 'react';
import { produce } from 'immer';
import { initialData } from '@/lib/data';
import type { AppData, GoalStatus, JobStatus, LoanStatus } from '@/lib/types';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, LayoutDashboard, Target, Calendar, Car, PiggyBank, Briefcase } from 'lucide-react';

import DashboardOverview from './dashboard-overview';
import GoalsTab from './goals-tab';
import MonthlyPlanTab from './monthly-plan-tab';
import CarSaleTab from './car-sale-tab';
import FinanceTab from './finance-tab';
import JobSearchTab from './job-search-tab';

export default function Dashboard() {
  const [data, setData] = useState<AppData>(initialData);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem('careerPlanTracker');
    if (savedData) {
      setData(JSON.parse(savedData));
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('careerPlanTracker', JSON.stringify(data));
    }
  }, [data, isLoaded]);

  const handleUpdateGoalStatus = (goalToUpdate: string, newStatus: GoalStatus) => {
    setData(produce(draft => {
      const goal = draft.goals.find(g => g.goal === goalToUpdate);
      if (goal) goal.status = newStatus;
    }));
  };

  const handleToggleMonthlyTask = (monthIndex: number, taskIndex: number, done: boolean) => {
    setData(produce(draft => {
      draft.monthlyPlan[monthIndex].tasks[taskIndex].done = done;
    }));
  };

  const handleToggleCarSaleTask = (taskIndex: number, done: boolean) => {
    setData(produce(draft => {
      draft.carSaleChecklist[taskIndex].done = done;
    }));
  };
  
  const handleUpdateLoanStatus = (loanName: string, status: LoanStatus) => {
     setData(produce(draft => {
        const loan = draft.loans.find(l => l.name === loanName);
        if(loan) loan.status = status;
     }))
  }

  const handleUpdateEmergencyFund = (amount: string) => {
    setData(produce(draft => {
      draft.emergencyFund = amount;
    }));
  };
  
  const handleToggleSip = (started: boolean) => {
      setData(produce(draft => {
          draft.sipStarted = started;
      }))
  }

  const handleAddJobApplication = (company: string, role: string) => {
      setData(produce(draft => {
          draft.jobApplications.unshift({
              company,
              role,
              status: 'Applied',
              date: new Date().toLocaleDateString('en-CA')
          });
      }));
  }

  const handleUpdateJobStatus = (index: number, status: JobStatus) => {
      setData(produce(draft => {
          draft.jobApplications[index].status = status;
      }));
  }

  const handleDeleteJob = (index: number) => {
      setData(produce(draft => {
          draft.jobApplications.splice(index, 1);
      }));
  }


  if (!isLoaded) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
    <div className="max-w-7xl mx-auto bg-card rounded-xl shadow-lg overflow-hidden border">
        <Tabs defaultValue="dashboard" className="w-full">
            <div className="border-b bg-muted/40">
                <TabsList className="flex-wrap h-auto sm:h-10 p-1 px-4 -mb-px bg-transparent border-b-0 justify-start">
                    <TabsTrigger value="dashboard"><LayoutDashboard />Dashboard</TabsTrigger>
                    <TabsTrigger value="goals"><Target />Goals</TabsTrigger>
                    <TabsTrigger value="monthly-plan"><Calendar />Monthly Plan</TabsTrigger>
                    <TabsTrigger value="car-sale"><Car />Car Sale</TabsTrigger>
                    <TabsTrigger value="finance"><PiggyBank />Finance Tracker</TabsTrigger>
                    <TabsTrigger value="job-search"><Briefcase />Job Search</TabsTrigger>
                </TabsList>
            </div>
            <div className="p-4 md:p-8">
                <TabsContent value="dashboard">
                    <DashboardOverview data={data} />
                </TabsContent>
                <TabsContent value="goals">
                    <GoalsTab goals={data.goals} onUpdateGoalStatus={handleUpdateGoalStatus} />
                </TabsContent>
                <TabsContent value="monthly-plan">
                    <MonthlyPlanTab monthlyPlan={data.monthlyPlan} onToggleTask={handleToggleMonthlyTask} />
                </TabsContent>
                <TabsContent value="car-sale">
                    <CarSaleTab checklist={data.carSaleChecklist} onToggleTask={handleToggleCarSaleTask} />
                </TabsContent>
                <TabsContent value="finance">
                    <FinanceTab 
                        loans={data.loans} 
                        emergencyFund={data.emergencyFund}
                        sipStarted={data.sipStarted}
                        onUpdateLoanStatus={handleUpdateLoanStatus}
                        onUpdateEmergencyFund={handleUpdateEmergencyFund}
                        onToggleSip={handleToggleSip}
                    />
                </TabsContent>
                <TabsContent value="job-search">
                    <JobSearchTab 
                      applications={data.jobApplications}
                      onAddApplication={handleAddJobApplication}
                      onUpdateStatus={handleUpdateJobStatus}
                      onDelete={handleDeleteJob}
                    />
                </TabsContent>
            </div>
        </Tabs>
    </div>
    </div>
  );
}
