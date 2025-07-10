
'use client';

import { useState } from 'react';
import type { AppData, DailyTask, JobApplication, JobStatus, Loan, LoanStatus, TravelGoal, IncomeSource, SIP, Task } from '@/lib/types';
import { LayoutDashboard, Target, CalendarDays, Car, PiggyBank, Briefcase, Plane, Camera, LogOut, ListTodo, Globe, Menu } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';

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
import type { SuggestedMonthlyPlan } from '@/ai/flows/generate-monthly-plan-suggestions';
import Image from 'next/image';
import LivingAdvisorTab from './living-advisor-tab';
import { cn } from '@/lib/utils';
import { ThemeSwitcher } from './theme-switcher';


interface DashboardProps {
  data: AppData;
  onUpdate: (updater: (draft: AppData) => void) => void;
}

export default function Dashboard({ data, onUpdate }: DashboardProps) {
    const { user, logout } = useAuth();
    const [isProfileDialogOpen, setProfileDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    const { toast } = useToast();
    
    // Monthly Plan handlers
    const handleToggleMonthlyTask = (monthIndex: number, taskIndex: number, done: boolean) => {
        onUpdate(draft => {
            draft.monthlyPlan[monthIndex].tasks[taskIndex].done = done;
        });
    };
    
    const handleAddMonthlyTask = (monthIndex: number, taskText: string) => {
        onUpdate(draft => {
            draft.monthlyPlan[monthIndex].tasks.push({ text: taskText, done: false });
        });
    };
    
    const handleDeleteMonthlyTask = (monthIndex: number, taskIndex: number) => {
        onUpdate(draft => {
            draft.monthlyPlan[monthIndex].tasks.splice(taskIndex, 1);
        });
    };

    const handleAddMonthlyPlan = (plan: SuggestedMonthlyPlan) => {
        onUpdate(draft => {
            const newPlan = {
                month: plan.month,
                theme: plan.theme,
                tasks: plan.tasks.map(taskText => ({ text: taskText, done: false })),
            };
            draft.monthlyPlan.push(newPlan);
            // Sort plans by date
            draft.monthlyPlan.sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
        });
    }

    const handleManualAddMonthlyPlan = (plan: { month: string, theme: string }) => {
        onUpdate(draft => {
            const newPlan = {
                ...plan,
                tasks: [] as Task[],
            };
            draft.monthlyPlan.push(newPlan);
            draft.monthlyPlan.sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
        });
    };


    // Car Sale handlers
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

    // Finance Handlers
    const handleAddLoan = (name: string, principal: string, rate?: string, tenure?: string, emisPaid?: string) => {
        onUpdate(draft => {
            draft.loans.push({
                id: `loan-${Date.now()}-${Math.random()}`,
                name,
                principal,
                rate,
                tenure,
                emisPaid,
                status: 'Active',
                lastAutoUpdate: new Date().toISOString()
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
                loan.lastAutoUpdate = new Date().toISOString();
            }
        });
    };
    
    const handleUpdateLoanStatus = (loanId: string, status: LoanStatus) => {
        onUpdate(draft => {
            const loanToUpdate = draft.loans.find(l => l.id === loanId);
            if (loanToUpdate) {
                loanToUpdate.status = status;
            }
        })
    }
    
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

    const handleAddSip = (sip: Omit<SIP, 'id'>) => {
        onUpdate(draft => {
            draft.sips.push({ ...sip, id: `sip-${Date.now()}` });
        });
    };

    const handleUpdateSip = (updatedSip: SIP) => {
        onUpdate(draft => {
            const index = draft.sips.findIndex(s => s.id === updatedSip.id);
            if (index !== -1) {
                draft.sips[index] = updatedSip;
            }
        });
    };

    const handleDeleteSip = (sipId: string) => {
        onUpdate(draft => {
            draft.sips = draft.sips.filter(s => s.id !== sipId);
        });
    };

    const handleAddIncomeSource = (source: Omit<IncomeSource, 'id'>) => {
        onUpdate(draft => {
            draft.incomeSources.push({ ...source, id: `income-${Date.now()}` });
        });
    };

    const handleUpdateIncomeSource = (updatedSource: IncomeSource) => {
        onUpdate(draft => {
            const index = draft.incomeSources.findIndex(s => s.id === updatedSource.id);
            if (index !== -1) {
                draft.incomeSources[index] = updatedSource;
            }
        });
    };

    const handleDeleteIncomeSource = (sourceId: string) => {
        onUpdate(draft => {
            draft.incomeSources = draft.incomeSources.filter(s => s.id !== sourceId);
        });
    };

    // Job Search handlers
    const handleAddApplication = (application: Omit<JobApplication, 'date' | 'status'>) => {
        onUpdate(draft => {
            draft.jobApplications.unshift({
                ...application,
                status: 'Need to Apply',
                date: new Date().toISOString(),
            });
        });
    };

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

    // Travel Goal handlers
    const handleAddTravelGoal = (goal: Omit<TravelGoal, 'id' | 'image'> & { travelDate: Date | null }) => {
        const imageUrl = `https://placehold.co/400x250.png`;
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
    
        toast({
            title: 'Travel Goal Added!',
            description: `Your goal to travel to ${goal.destination} has been added.`,
        });
    };

    const handleDeleteTravelGoal = (id: string) => {
        onUpdate(draft => {
            draft.travelGoals = draft.travelGoals.filter(g => g.id !== id);
        });
    };

    // Daily Task Handlers
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

    const allTabs = [
      { value: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard/> },
      { value: 'goals', label: 'Goals', icon: <Target/> },
      { value: 'daily-todo', label: 'Daily To-Do', icon: <ListTodo /> },
      { value: 'monthly-plan', label: 'Monthly Plan', icon: <CalendarDays/> },
      { value: 'job-search', label: 'Job Search', icon: <Briefcase/> },
      { value: 'living-advisor', label: 'Living Advisor', icon: <Globe/> },
      { value: 'travel-goals', label: 'Travel Goals', icon: <Plane/> },
      { value: 'car-sale', label: 'Car Sale', icon: <Car/> },
      { value: 'finance', label: 'Finance Tracker', icon: <PiggyBank/> },
    ];


  return (
    <>
    <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl bg-transparent shadow-xl border border-white/10">
      <header className="flex items-center justify-between gap-4 bg-transparent p-4 sm:p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0">
                    <div className="flex flex-col h-full">
                        <div className="p-4 border-b">
                            <h2 className="text-xl font-bold">Menu</h2>
                        </div>
                        <nav className="flex-grow p-4 space-y-2">
                           {allTabs.map(tab => (
                             <SheetClose asChild key={tab.value}>
                               <Button
                                 variant={activeTab === tab.value ? 'secondary' : 'ghost'}
                                 className="w-full justify-start"
                                 onClick={() => setActiveTab(tab.value)}
                               >
                                 {tab.icon}
                                 <span>{tab.label}</span>
                               </Button>
                             </SheetClose>
                           ))}
                        </nav>
                    </div>
                </SheetContent>
              </Sheet>
            </div>
            <div className="bg-gradient-primary p-2 rounded-lg">
                <Image src="/icon.svg" alt="Resolve25 Logo" width={24} height={24} />
            </div>
            <h1 className="text-2xl font-bold md:text-3xl tracking-tight text-foreground">Resolve25</h1>
        </div>
        
        <div className="flex items-center gap-2">
            <ThemeSwitcher />
            {user && (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border-2 border-primary/50">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                    <AvatarFallback className="bg-primary/20 font-semibold text-primary">
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
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-white/10 bg-transparent hidden md:block">
          <div className="px-2">
            <TabsList className="h-auto p-2">
                  {[...allTabs].map(tab => (
                    <TabsTrigger key={tab.value} value={tab.value}>{tab.icon}{tab.label}</TabsTrigger>
                  ))}
            </TabsList>
          </div>
        </div>
        
        <div className={cn("relative p-4 md:p-8 bg-transparent transition-opacity duration-500", activeTab ? 'opacity-100' : 'opacity-0')}>
            <TabsContent value="dashboard" forceMount={activeTab === 'dashboard'}>
                <DashboardOverview data={data} />
            </TabsContent>
            <TabsContent value="goals" forceMount={activeTab === 'goals'}>
                <GoalsTab data={data} onUpdate={onUpdate} />
            </TabsContent>
            <TabsContent value="daily-todo" forceMount={activeTab === 'daily-todo'}>
                <DailyTodoTab 
                  tasks={data.dailyTasks}
                  onAddTask={handleAddDailyTask}
                  onUpdateTask={handleUpdateDailyTask}
                  onDeleteTask={handleDeleteDailyTask}
                  onToggleTask={handleToggleDailyTask}
                  data={data}
                />
            </TabsContent>
            <TabsContent value="monthly-plan" forceMount={activeTab === 'monthly-plan'}>
                <MonthlyPlanTab 
                    monthlyPlan={data.monthlyPlan} 
                    onToggleTask={handleToggleMonthlyTask}
                    onAddTask={handleAddMonthlyTask}
                    onDeleteTask={handleDeleteMonthlyTask}
                    onAddPlan={handleAddMonthlyPlan}
                    onManualAddPlan={handleManualAddMonthlyPlan}
                    data={data}
                />
            </TabsContent>
            <TabsContent value="car-sale" forceMount={activeTab === 'car-sale'}>
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
            <TabsContent value="finance" forceMount={activeTab === 'finance'}>
                <FinanceTab 
                    loans={data.loans} 
                    emergencyFund={data.emergencyFund}
                    emergencyFundTarget={data.emergencyFundTarget}
                    sips={data.sips}
                    incomeSources={data.incomeSources}
                    onUpdateLoanStatus={handleUpdateLoanStatus}
                    onUpdateEmergencyFund={handleUpdateEmergencyFund}
                    onUpdateEmergencyFundTarget={handleUpdateEmergencyFundTarget}
                    onAddSip={handleAddSip}
                    onUpdateSip={handleUpdateSip}
                    onDeleteSip={handleDeleteSip}
                    onAddLoan={handleAddLoan}
                    onUpdateLoan={handleUpdateLoan}
                    onDeleteLoan={handleDeleteLoan}
                    onAddIncomeSource={handleAddIncomeSource}
                    onUpdateIncomeSource={handleUpdateIncomeSource}
                    onDeleteIncomeSource={handleDeleteIncomeSource}
                />
            </TabsContent>
            <TabsContent value="job-search" forceMount={activeTab === 'job-search'}>
                <JobSearchTab 
                    applications={data.jobApplications}
                    onAddApplication={handleAddApplication}
                    onUpdateStatus={handleUpdateJobStatus}
                    onDelete={handleDeleteJob}
                    data={data}
                    onUpdate={onUpdate}
                />
            </TabsContent>
            <TabsContent value="living-advisor" forceMount={activeTab === 'living-advisor'}>
                <LivingAdvisorTab data={data} onUpdate={onUpdate} />
            </TabsContent>
            <TabsContent value="travel-goals" forceMount={activeTab === 'travel-goals'}>
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
