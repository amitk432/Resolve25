
import React, { useState, useEffect } from 'react';
import type { AppData, DailyTask, Goal, JobApplication, JobStatus, Loan, LoanStatus, TravelGoal, IncomeSource, SIP, Task } from '@/lib/types';
import { LayoutDashboard, Target, CalendarDays, Car, PiggyBank, Briefcase, Plane, LogOut, ListTodo, Globe, Menu, Bot } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

import DashboardOverview from './dashboard-overview';
import GoalsTab from './goals-tab';
import MonthlyPlanTab from './monthly-plan-tab';
import CarSaleTab from './car-sale-tab';
import FinanceTab from './finance-tab';
import JobSearchTab from './job-search-tab';
import TravelGoalsTab from './travel-goals-tab';
import DailyTodoTab from './daily-todo-tab';
import AITaskManager from './ai-task-manager';
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
    const { user, signOut } = useAuth();
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
    const handleAddTravelGoal = (goal: Omit<TravelGoal, 'id'>) => {
        onUpdate((draft) => {
            draft.travelGoals.push({
                id: `travel-${Date.now()}`,
                ...goal,
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

    const handleMoveToNextDay = (taskId: string) => {
        onUpdate(draft => {
            const task = draft.dailyTasks.find(t => t.id === taskId);
            if (task) {
                const nextDay = new Date(task.dueDate);
                nextDay.setDate(nextDay.getDate() + 1);
                task.dueDate = nextDay.toISOString();
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
      { value: 'ai-task-manager', label: 'AI Task Manager', icon: <Bot/> },
    ];

    // Filter tabs based on user's enabled features
    const userEnabledFeatures = user?.user_metadata?.enabled_features;
    
    // If no user is available, only show dashboard
    if (!user) {
      return (
        <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl bg-background/95 backdrop-blur-md shadow-2xl border border-border/50">
          <div className="p-8 text-center">
            <p>Loading user data...</p>
          </div>
        </div>
      );
    }
    
    const visibleTabs = allTabs.filter(tab => {
      // Dashboard is always visible (mandatory)
      if (tab.value === 'dashboard') {
        return true;
      }
      
      // If no preferences set, only show dashboard tab until user configures features
      if (!userEnabledFeatures || !Array.isArray(userEnabledFeatures)) {
        return false;
      }
      
      // Show tabs that are in user's enabled features
      return userEnabledFeatures.includes(tab.value);
    });

    // Ensure activeTab is always valid - if current tab is not visible, switch to first visible tab
    useEffect(() => {
      if (visibleTabs.length > 0 && !visibleTabs.some(tab => tab.value === activeTab)) {
        setActiveTab(visibleTabs[0].value);
      }
    }, [visibleTabs, activeTab]);


  return (
    <>
    <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl bg-background/95 backdrop-blur-md shadow-2xl border border-border/50">
      <header className="flex items-center justify-between gap-4 bg-gradient-to-r from-background via-background/95 to-background p-4 sm:p-6 border-b border-border/30 backdrop-blur-md">
        <div className="flex items-center gap-3">
            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full border border-border/20 bg-background/50 backdrop-blur-sm hover:bg-muted/80 active:scale-95 transition-all duration-200">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 flex flex-col w-80 bg-background/95 backdrop-blur-md">
                    <SheetHeader className="p-5 border-b border-border/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
                         <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 ring-2 ring-primary/30 shadow-lg">
                                <AvatarImage src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture || undefined} alt={user?.user_metadata?.name || user?.user_metadata?.full_name || 'User'} />
                                <AvatarFallback className="bg-gradient-primary text-white font-bold text-lg">{(user?.user_metadata?.name || user?.user_metadata?.full_name)?.charAt(0)?.toUpperCase() ?? user?.email?.charAt(0)?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <SheetTitle className="text-left text-lg font-bold truncate">Welcome back!</SheetTitle>
                                <p className="text-sm text-muted-foreground text-left truncate">{user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">Online</span>
                                </div>
                            </div>
                        </div>
                    </SheetHeader>
                    <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
                        {visibleTabs.map(tab => (
                            <SheetClose asChild key={tab.value}>
                            <Button
                                variant={activeTab === tab.value ? 'default' : 'ghost'}
                                className={cn(
                                    "w-full justify-start text-base py-4 px-4 gap-4 transition-all duration-200 rounded-xl",
                                    activeTab === tab.value 
                                        ? "bg-gradient-primary text-white shadow-lg shadow-primary/25 scale-[0.98] hover:bg-gradient-primary/90" 
                                        : "hover:bg-muted/80 hover:translate-x-1 active:scale-95"
                                )}
                                onClick={() => setActiveTab(tab.value)}
                            >
                                <div className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
                                    activeTab === tab.value ? "bg-white/20" : "bg-muted/50"
                                )}>
                                    {tab.icon}
                                </div>
                                <span className="font-medium">{tab.label}</span>
                                {activeTab === tab.value && (
                                    <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                )}
                            </Button>
                            </SheetClose>
                        ))}
                    </nav>
                    <SheetFooter className="p-4 mt-auto border-t border-border/30 bg-gradient-to-r from-background/50 to-background flex flex-col gap-3">
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <ThemeSwitcher />
                            </div>
                            <Button variant="outline" onClick={signOut} className="flex-1 bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive hover:text-white transition-all duration-200">
                                <LogOut className="mr-2 h-4 w-4"/>
                                Sign Out
                            </Button>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground">Resolve25 v1.0</p>
                        </div>
                    </SheetFooter>
                </SheetContent>
              </Sheet>
            </div>
            <div className="bg-gradient-primary p-2.5 rounded-xl shadow-lg">
                <Image src="/icon.svg" alt="Resolve25 Logo" width={28} height={28} className="brightness-0 invert" />
            </div>
            <h1 className="text-2xl font-bold md:text-3xl tracking-tight text-foreground bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">Resolve25</h1>
        </div>
        
        <div className="flex items-center gap-2">
            <ThemeSwitcher />
            {user && (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-primary/20 hover:ring-primary/40 transition-all duration-200 hover:scale-105">
                    <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-md">
                    <AvatarImage src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture || undefined} alt={user?.user_metadata?.name || user?.user_metadata?.full_name || 'User'} />
                    <AvatarFallback className="bg-gradient-primary text-white font-semibold shadow-inner">
                        {(user?.user_metadata?.name || user?.user_metadata?.full_name)?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                    </Avatar>
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.user_metadata?.name || user?.user_metadata?.full_name || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                    </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setProfileDialogOpen(true)}>
                    <span>Edit Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            )}
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-border/30 bg-background/80 backdrop-blur-sm hidden lg:block">
          <div className="px-4">
            <ScrollArea className="w-full whitespace-nowrap">
              <TabsList className="h-auto p-3 bg-transparent">
                    {visibleTabs.map(tab => (
                      <TabsTrigger key={tab.value} value={tab.value} className="mx-1">{tab.icon}{tab.label}</TabsTrigger>
                    ))}
              </TabsList>
            </ScrollArea>
          </div>
        </div>
        
        <div className={cn("relative p-4 md:p-8 bg-gradient-to-br from-background via-background/98 to-background/95 transition-all duration-500 min-h-[600px]", activeTab ? 'opacity-100' : 'opacity-0')}>
            <TabsContent value="dashboard">
                <DashboardOverview data={data} />
                
                {/* Show message if no additional features are enabled */}
                {(!userEnabledFeatures || !Array.isArray(userEnabledFeatures) || userEnabledFeatures.length === 0 || (userEnabledFeatures.length === 1 && userEnabledFeatures[0] === 'dashboard')) && (
                    <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">🎯 Customize Your Experience</h3>
                        <p className="text-blue-700 dark:text-blue-300 mb-4">
                            You haven't selected any additional features yet. Click "Edit Profile" in the user menu to choose which modules you'd like to use, including AI Task Manager, Goals, Finance Tracker, and more.
                        </p>
                        <Button 
                            onClick={() => setProfileDialogOpen(true)}
                            variant="outline" 
                            className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                        >
                            Select Features
                        </Button>
                    </div>
                )}
            </TabsContent>
            <TabsContent value="goals">
                <GoalsTab data={data} onUpdate={onUpdate} />
            </TabsContent>
            <TabsContent value="daily-todo">
                <DailyTodoTab 
                  tasks={data.dailyTasks}
                  onAddTask={handleAddDailyTask}
                  onUpdateTask={handleUpdateDailyTask}
                  onDeleteTask={handleDeleteDailyTask}
                  onToggleTask={handleToggleDailyTask}
                  onMoveToNextDay={handleMoveToNextDay}
                  data={data}
                />
            </TabsContent>
            <TabsContent value="monthly-plan">
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
            <TabsContent value="job-search">
                <JobSearchTab 
                    applications={data.jobApplications}
                    onAddApplication={handleAddApplication}
                    onUpdateStatus={handleUpdateJobStatus}
                    onDelete={handleDeleteJob}
                    data={data}
                    onUpdate={onUpdate}
                />
            </TabsContent>
            <TabsContent value="living-advisor">
                <LivingAdvisorTab data={data} onUpdate={onUpdate} />
            </TabsContent>
            <TabsContent value="travel-goals">
                <TravelGoalsTab 
                    travelGoals={data.travelGoals}
                    onAddGoal={handleAddTravelGoal}
                    onDeleteGoal={handleDeleteTravelGoal}
                    onUpdate={onUpdate}
                    data={data}
                />
            </TabsContent>
            <TabsContent value="ai-task-manager">
                <AITaskManager />
            </TabsContent>
        </div>
      </Tabs>
    </div>
    <EditProfileDialog open={isProfileDialogOpen} onOpenChange={setProfileDialogOpen} />
    </>
  );
}
