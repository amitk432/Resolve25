
'use client';

import { useState } from 'react';
import type { AppData, DailyTask, JobStatus, Loan, LoanStatus, TravelGoal } from '@/lib/types';
import { LayoutDashboard, Target, CalendarDays, Car, PiggyBank, Briefcase, Plane, Camera, LogOut, Loader2, ListTodo } from 'lucide-react';
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
import TravelGoalsTab from './travel-goals-tab';
import DailyTodoTab from './daily-todo-tab';
import { EditProfileDialog } from './edit-profile-dialog';
import { useToast } from '@/hooks/use-toast';
import { generateTravelImage } from '@/ai/flows/generate-travel-image';

interface DashboardProps {
  data: AppData;
  onUpdate: (updater: (draft: AppData) => void) => void;
}

export default function Dashboard({ data, onUpdate }: DashboardProps) {
    const { user, logout } = useAuth();
    const [isProfileDialogOpen, setProfileDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    const { toast } = useToast();
    
    // Handlers for updating state
    const handleToggleMonthlyTask = (monthIndex: number, taskIndex: number, done: boolean) => {
        onUpdate(draft => {
            draft.monthlyPlan[monthIndex].tasks[taskIndex].done = done;
        });
    };
    
    const handleToggleCarSaleTask = (id: string, done: boolean) => {
        onUpdate(draft => {
            const task = draft.carSaleChecklist.find(t => t.id === id);
            if(task) task.done = done;
        })
    }

     const handleAddCarSaleTask = (text: string) => {
        onUpdate(draft => {
            draft.carSaleChecklist.push({
                id: `car-task-${Date.now()}`,
                text,
                done: false
            });
        });
    };

    const handleDeleteCarSaleTask = (id: string) => {
        onUpdate(draft => {
            draft.carSaleChecklist = draft.carSaleChecklist.filter(t => t.id !== id);
        });
    };
    
    const handleUpdateCarSaleDetails = (price: string, payoff: string) => {
        onUpdate(draft => {
            draft.carSalePrice = price;
            draft.carLoanPayoff = payoff;
        });
    };

    const handleUpdateLoanStatus = (loanId: string, status: LoanStatus) => {
        onUpdate(draft => {
            const loanToUpdate = draft.loans.find(l => l.id === loanId);
            if (loanToUpdate) loanToUpdate.status = status;
        })
    }
    
    const handleAddLoan = (name: string, principal: string, rate?: string, tenure?: string, emisPaid?: string) => {
        onUpdate(draft => {
            draft.loans.push({
                id: `loan-${Date.now()}-${Math.random()}`,
                name,
                principal,
                rate,
                tenure,
                emisPaid,
                status: 'Active'
            });
        });
    };

    const handleUpdateLoan = (id: string, name: string, principal: string, rate?: string, tenure?: string, emisPaid?: string) => {
        onUpdate(draft => {
            const loan = draft.loans.find(l => l.id === id);
            if (loan) {
                loan.name = name;
                loan.principal = principal;
                loan.rate = rate;
                loan.tenure = tenure;
                loan.emisPaid = emisPaid;
            }
        });
    };

    const handleDeleteLoan = (id: string) => {
        onUpdate(draft => {
            draft.loans = draft.loans.filter(l => l.id !== id);
        });
    };

    const handleUpdateEmergencyFund = (amount: string) => {
        onUpdate(draft => {
            draft.emergencyFund = amount;
        })
    }
    
    const handleUpdateEmergencyFundTarget = (target: string) => {
        onUpdate(draft => {
            draft.emergencyFundTarget = target;
        });
    };

    const handleUpdateSipTotalInvestment = (amount: string) => {
      onUpdate(draft => {
          draft.sipTotalInvestment = amount;
      });
    };
    
    const handleToggleSip = (started: boolean) => {
        onUpdate(draft => {
            draft.sipStarted = started;
        })
    }

    const handleUpdateSipDetails = (amount: string, mutualFund: string, platform: string) => {
        onUpdate(draft => {
            draft.sipAmount = amount;
            draft.sipMutualFund = mutualFund;
            draft.sipPlatform = platform;
        });
    };

    const handleUpdateMonthlyIncome = (amount: string) => {
      onUpdate(draft => {
          draft.monthlyIncome = amount;
      });
    };

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

    const handleAddTravelGoal = async (goal: Omit<TravelGoal, 'id' | 'image'> & { travelDate: Date | null }) => {
        const { update, dismiss } = toast({
          title: (
            <div className="flex items-center gap-2">
              <Loader2 className="animate-spin" />
              <span>Generating Image...</span>
            </div>
          ),
          description: `Creating a custom image for ${goal.destination}. Please wait.`,
          duration: 90000,
        });
    
        let imageUrl = 'https://placehold.co/400x250.png';
    
        try {
          const result = await generateTravelImage({ destination: goal.destination });
          if (result.imageDataUri) {
            imageUrl = result.imageDataUri;
            update({
              id: 'image-generated',
              title: 'Image Generated!',
              description: 'Your new travel goal has been added.',
            });
          } else {
            throw new Error('No image data received from AI.');
          }
        } catch (error) {
          console.error("Error generating travel image:", error);
          update({
            id: 'image-failed',
            variant: 'destructive',
            title: 'Image Generation Failed',
            description: 'Using a placeholder image. The AI may be busy, please try again later.',
          });
        } finally {
            setTimeout(() => dismiss(), 5000);
        }
    
        onUpdate((draft) => {
          draft.travelGoals.push({
            id: `travel-${Date.now()}`,
            destination: goal.destination,
            status: goal.status,
            notes: goal.notes || '',
            travelDate: goal.travelDate ? goal.travelDate.toISOString() : null,
            image: imageUrl,
          });
        });
      };

    const handleDeleteTravelGoal = (id: string) => {
        onUpdate(draft => {
            draft.travelGoals = draft.travelGoals.filter(g => g.id !== id);
        });
    };

    const handleAddDailyTask = (task: Omit<DailyTask, 'id' | 'completed'>) => {
        onUpdate(draft => {
            draft.dailyTasks.push({
                ...task,
                id: `task-${Date.now()}`,
                completed: false,
            });
        });
    };

    const handleUpdateDailyTask = (updatedTask: DailyTask) => {
        onUpdate(draft => {
            const index = draft.dailyTasks.findIndex(t => t.id === updatedTask.id);
            if (index !== -1) {
                draft.dailyTasks[index] = updatedTask;
            }
        });
    };

    const handleDeleteDailyTask = (taskId: string) => {
        onUpdate(draft => {
            draft.dailyTasks = draft.dailyTasks.filter(t => t.id !== taskId);
        });
    };

    const handleToggleDailyTask = (taskId: string, completed: boolean) => {
        onUpdate(draft => {
            const task = draft.dailyTasks.find(t => t.id === taskId);
            if (task) {
                task.completed = completed;
            }
        });
    };

  return (
    <>
    <div className="max-w-7xl mx-auto bg-card rounded-2xl shadow-lg overflow-hidden">
      <header className="bg-primary text-primary-foreground p-6 flex justify-between items-center">
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
                  <AvatarFallback className="bg-primary-foreground text-primary font-semibold">
                    {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
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
               <DropdownMenuItem onSelect={() => setProfileDialogOpen(true)}>
                <Camera className="mr-2 h-4 w-4" />
                <span>Change Picture</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>

      <Tabs defaultValue="dashboard" className="w-full" onValueChange={setActiveTab}>
        <div className="border-b bg-muted/50">
            <TabsList className="flex-wrap h-auto p-2 -mb-px bg-transparent w-full justify-start gap-2">
                <TabsTrigger value="dashboard"><LayoutDashboard/>Dashboard</TabsTrigger>
                <TabsTrigger value="goals"><Target/>Goals</TabsTrigger>
                <TabsTrigger value="daily-todo"><ListTodo />Daily To-Do</TabsTrigger>
                <TabsTrigger value="monthly-plan"><CalendarDays/>Monthly Plan</TabsTrigger>
                <TabsTrigger value="car-sale"><Car/>Car Sale</TabsTrigger>
                <TabsTrigger value="finance"><PiggyBank/>Finance Tracker</TabsTrigger>
                <TabsTrigger value="job-search"><Briefcase/>Job Search</TabsTrigger>
                <TabsTrigger value="travel-goals"><Plane/>Travel Goals</TabsTrigger>
            </TabsList>
        </div>
        
        <div className="relative p-4 md:p-8">
            <TabsContent value="dashboard">
                <DashboardOverview data={data} />
            </TabsContent>
            <TabsContent value="goals">
                <GoalsTab goals={data.goals} onUpdate={onUpdate} />
            </TabsContent>
            <TabsContent value="daily-todo">
                <DailyTodoTab 
                  tasks={data.dailyTasks}
                  onAddTask={handleAddDailyTask}
                  onUpdateTask={handleUpdateDailyTask}
                  onDeleteTask={handleDeleteDailyTask}
                  onToggleTask={handleToggleDailyTask}
                />
            </TabsContent>
            <TabsContent value="monthly-plan">
                <MonthlyPlanTab monthlyPlan={data.monthlyPlan} onToggleTask={handleToggleMonthlyTask}/>
            </TabsContent>
            <TabsContent value="car-sale">
                 <CarSaleTab 
                    checklist={data.carSaleChecklist}
                    salePrice={data.carSalePrice}
                    loanPayoff={data.carLoanPayoff}
                    onToggleTask={handleToggleCarSaleTask}
                    onAddTask={handleAddCarSaleTask}
                    onDeleteTask={handleDeleteCarSaleTask}
                    onUpdateDetails={handleUpdateCarSaleDetails}
                />
            </TabsContent>
            <TabsContent value="finance">
                <FinanceTab 
                    loans={data.loans} 
                    emergencyFund={data.emergencyFund}
                    emergencyFundTarget={data.emergencyFundTarget}
                    sipStarted={data.sipStarted}
                    sipAmount={data.sipAmount}
                    sipMutualFund={data.sipMutualFund}
                    sipPlatform={data.sipPlatform}
                    sipTotalInvestment={data.sipTotalInvestment || '0'}
                    monthlyIncome={data.monthlyIncome || '50000'}
                    onUpdateLoanStatus={handleUpdateLoanStatus}
                    onUpdateEmergencyFund={handleUpdateEmergencyFund}
                    onUpdateEmergencyFundTarget={handleUpdateEmergencyFundTarget}
                    onToggleSip={handleToggleSip}
                    onUpdateSipDetails={handleUpdateSipDetails}
                    onAddLoan={handleAddLoan}
                    onUpdateLoan={handleUpdateLoan}
                    onDeleteLoan={handleDeleteLoan}
                    onUpdateSipTotalInvestment={handleUpdateSipTotalInvestment}
                    onUpdateMonthlyIncome={handleUpdateMonthlyIncome}
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
            <TabsContent value="travel-goals">
                <TravelGoalsTab 
                    travelGoals={data.travelGoals}
                    onAddGoal={handleAddTravelGoal}
                    onDeleteGoal={handleDeleteTravelGoal}
                />
            </TabsContent>
        </div>
      </Tabs>
    </div>
    <EditProfileDialog open={isProfileDialogOpen} onOpenChange={setProfileDialogOpen} />
    </>
  );
}
