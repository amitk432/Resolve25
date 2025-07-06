
'use client';

import type { AppData, GoalStatus, JobStatus, LoanStatus } from '@/lib/types';
import { produce } from 'immer';
import { LayoutDashboard, Target, CalendarDays, Car, PiggyBank, Briefcase } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import DashboardOverview from './dashboard-overview';
import GoalsTab from './goals-tab';
import MonthlyPlanTab from './monthly-plan-tab';
import CarSaleTab from './car-sale-tab';
import FinanceTab from './finance-tab';
import JobSearchTab from './job-search-tab';

interface DashboardProps {
  data: AppData;
  onUpdate: (updater: (draft: AppData) => void) => void;
}

export default function Dashboard({ data, onUpdate }: DashboardProps) {
    const { user, logout } = useAuth();
    
    // Handlers for updating state
    const handleUpdateGoalStatus = (goal: string, newStatus: GoalStatus) => {
        onUpdate(draft => {
            const goalToUpdate = draft.goals.find(g => g.goal === goal);
            if (goalToUpdate) goalToUpdate.status = newStatus;
        });
    };

    const handleToggleMonthlyTask = (monthIndex: number, taskIndex: number, done: boolean) => {
        onUpdate(draft => {
            draft.monthlyPlan[monthIndex].tasks[taskIndex].done = done;
        });
    };
    
    const handleToggleCarSaleTask = (taskIndex: number, done: boolean) => {
        onUpdate(draft => {
            draft.carSaleChecklist[taskIndex].done = done;
        })
    }

    const handleUpdateLoanStatus = (loanName: string, status: LoanStatus) => {
        onUpdate(draft => {
            const loanToUpdate = draft.loans.find(l => l.name === loanName);
            if (loanToUpdate) loanToUpdate.status = status;
        })
    }

    const handleUpdateEmergencyFund = (amount: string) => {
        onUpdate(draft => {
            draft.emergencyFund = amount;
        })
    }
    
    const handleToggleSip = (started: boolean) => {
        onUpdate(draft => {
            draft.sipStarted = started;
        })
    }

    const handleAddApplication = (company: string, role: string) => {
        onUpdate(draft => {
            draft.jobApplications.unshift({
                company,
                role,
                status: 'Applied',
                date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD
            });
        });
    }

    const handleUpdateJobStatus = (index: number, status: JobStatus) => {
        onUpdate(draft => {
            draft.jobApplications[index].status = status;
        });
    }

    const handleDeleteJob = (index: number) => {
        onUpdate(draft => {
            draft.jobApplications.splice(index, 1);
        });
    }

  return (
    <div className="max-w-7xl mx-auto bg-card rounded-2xl shadow-lg overflow-hidden">
      <header className="bg-foreground text-primary-foreground p-6 flex justify-between items-center">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold">Personalized Action Plan: 2025</h1>
            <p className="text-muted-foreground mt-1">Your interactive dashboard to track career, financial, and skill goals.</p>
        </div>
        {user && (
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10 border-2 border-primary-foreground/50">
                  <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                  <AvatarFallback>{user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>

      <Tabs defaultValue="dashboard" className="w-full">
        <div className="border-b bg-muted/50">
            <TabsList className="flex-wrap h-auto p-2 -mb-px bg-transparent w-full justify-start gap-2">
                <TabsTrigger value="dashboard"><LayoutDashboard/>Dashboard</TabsTrigger>
                <TabsTrigger value="goals"><Target/>Goals</TabsTrigger>
                <TabsTrigger value="monthly-plan"><CalendarDays/>Monthly Plan</TabsTrigger>
                <TabsTrigger value="car-sale"><Car/>Car Sale</TabsTrigger>
                <TabsTrigger value="finance"><PiggyBank/>Finance Tracker</TabsTrigger>
                <TabsTrigger value="job-search"><Briefcase/>Job Search</TabsTrigger>
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
                <MonthlyPlanTab monthlyPlan={data.monthlyPlan} onToggleTask={handleToggleMonthlyTask}/>
            </TabsContent>
            <TabsContent value="car-sale">
                <CarSaleTab checklist={data.carSaleChecklist} onToggleTask={handleToggleCarSaleTask}/>
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
                    onAddApplication={handleAddApplication}
                    onUpdateStatus={handleUpdateJobStatus}
                    onDelete={handleDeleteJob}
                />
            </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
