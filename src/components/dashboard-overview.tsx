
'use client'

import React, { useMemo, useState, useEffect } from 'react';
import { AppData, CriticalStep } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, CheckCircle, Target, PiggyBank, CalendarClock, Brain, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AiSuggestionSection from './ai-suggestion-section';
import { getOrGenerateCriticalSteps } from '@/app/actions';

interface DashboardOverviewProps {
    data: AppData;
    onUpdate?: (updater: (draft: AppData) => void) => void;
}

export default function DashboardOverview({ data, onUpdate }: DashboardOverviewProps) {
    const [daysLeft, setDaysLeft] = useState(0);
    const [aiCriticalSteps, setAiCriticalSteps] = useState<CriticalStep[]>([]);
    const [isLoadingCriticalSteps, setIsLoadingCriticalSteps] = useState(false);
    const [criticalStepsGenerated, setCriticalStepsGenerated] = useState(false);

    useEffect(() => {
        const endOfYear = new Date('2025-12-31');
        const now = new Date();
        const diffTime = endOfYear.getTime() - now.getTime();
        const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        setDaysLeft(diffDays);
    }, []);

    // Track only specific data that should trigger critical steps regeneration
    const criticalDataHash = useMemo(() => {
        if (!data) return '';
        return JSON.stringify({
            goals: data.goals,
            monthlyPlan: data.monthlyPlan,
            jobApplications: data.jobApplications,
            loans: data.loans,
            emergencyFund: data.emergencyFund,
            sips: data.sips,
            incomeSources: data.incomeSources,
        });
    }, [data?.goals, data?.monthlyPlan, data?.jobApplications, data?.loans, data?.emergencyFund, data?.sips, data?.incomeSources]);

    // Load critical steps from cache or generate new ones
    useEffect(() => {
        const loadCriticalSteps = async () => {
            if (!data || isLoadingCriticalSteps) return;
            
            // Check if we already have cached critical steps with the same data hash
            if (data.criticalSteps && data.criticalSteps.dataHash === criticalDataHash) {
                setAiCriticalSteps(data.criticalSteps.steps);
                setCriticalStepsGenerated(true);
                return;
            }
            
            // Only generate if we haven't generated yet or data has changed
            if (criticalStepsGenerated && data.criticalSteps?.dataHash === criticalDataHash) return;
            
            setIsLoadingCriticalSteps(true);
            try {
                const result = await getOrGenerateCriticalSteps(data);
                if ('error' in result) {
                    console.error('Failed to get critical steps:', result.error);
                    setAiCriticalSteps([]);
                } else {
                    setAiCriticalSteps(result.steps);
                    
                    // Save the critical steps to the backend if we have an onUpdate function
                    if (onUpdate && (!data.criticalSteps || data.criticalSteps.dataHash !== result.dataHash)) {
                        onUpdate((draft) => {
                            draft.criticalSteps = result;
                        });
                    }
                }
                setCriticalStepsGenerated(true);
            } catch (error) {
                console.error('Failed to load critical steps:', error);
                setAiCriticalSteps([]);
            } finally {
                setIsLoadingCriticalSteps(false);
            }
        };

        loadCriticalSteps();
    }, [data, criticalDataHash, criticalStepsGenerated, isLoadingCriticalSteps, onUpdate]);

    const {
        overallProgress,
        goalsCompletedCount,
        totalGoals,
        goalsInProgress,
        criticalTasks,
        emergencyFundProgress,
        yearProgress,
        completedGoalsProgress,
    } = useMemo(() => {
        const allGoals = data.goals || [];
        const allTasks = allGoals.flatMap(g => g.steps || []);
        const completedTasks = allTasks.filter(t => t.completed).length;
        const totalTasks = allTasks.length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        const gCompleted = allGoals.filter(g => (g.steps || []).length > 0 && (g.steps || []).every(s => s.completed)).length;
        const gInProgress = allGoals.filter(g => !(g.steps || []).every(s => s.completed)).length;
        
        // Priority-based critical tasks generation (concise AI suggestions)
        const prioritizedTasks = [];
        
        // 1. Finance Tracker priorities (highest priority) - Keep short and actionable
        const loans = data.loans || [];
        const activeLoan = loans.find(loan => loan.status === 'Active');
        if (activeLoan) {
            const principal = parseFloat(activeLoan.principal) || 0;
            const rate = parseFloat(activeLoan.rate || '0') || 0;
            const tenure = parseFloat(activeLoan.tenure || '0') || 0;
            const emisPaid = parseFloat(activeLoan.emisPaid || '0') || 0;
            
            if (principal > 0 && tenure > 0) {
                const monthlyRate = rate / 12 / 100;
                const emi = monthlyRate > 0 ? 
                    principal * monthlyRate * Math.pow(1 + monthlyRate, tenure) / (Math.pow(1 + monthlyRate, tenure) - 1) : 
                    principal / tenure;
                prioritizedTasks.push({ text: `Pay ${activeLoan.name} EMI ₹${Math.round(emi)}`, priority: 1 });
            }
        }
        
        const emergencyFund = parseFloat(data.emergencyFund) || 0;
        const emergencyTarget = parseFloat(data.emergencyFundTarget) || 40000;
        if (emergencyFund < emergencyTarget * 0.3) {
            const needed = Math.round(emergencyTarget * 0.3 - emergencyFund);
            prioritizedTasks.push({ text: `Build Emergency Fund +₹${needed}`, priority: 1 });
        }
        
        // Check SIP investments - short suggestion
        const sips = data.sips || [];
        if (sips.length === 0 && prioritizedTasks.length < 2) {
            prioritizedTasks.push({ text: `Start monthly SIP investment`, priority: 1 });
        }
        
        // 2. Daily To-Do tasks (high priority) - concise format
        const dailyTasks = data.dailyTasks || [];
        const overdueDailyTask = dailyTasks.find(task => {
            const dueDate = new Date(task.dueDate);
            const today = new Date();
            return !task.completed && dueDate < today;
        });
        if (overdueDailyTask && prioritizedTasks.length < 3) {
            const shortTitle = overdueDailyTask.title.length > 25 ? 
                overdueDailyTask.title.substring(0, 25) + '...' : 
                overdueDailyTask.title;
            prioritizedTasks.push({ text: `Complete: ${shortTitle}`, priority: 2 });
        }
        
        const todayTasks = dailyTasks.filter(task => {
            const dueDate = new Date(task.dueDate);
            const today = new Date();
            return !task.completed && dueDate.toDateString() === today.toDateString();
        });
        if (todayTasks.length > 0 && prioritizedTasks.length < 3) {
            prioritizedTasks.push({ text: `Complete ${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} today`, priority: 2 });
        }
        
        // 3. Monthly Plan tasks (medium priority) - short format
        const monthlyPlans = data.monthlyPlan || [];
        const currentMonth = new Date().toLocaleString('default', { month: 'long' });
        const currentPlan = monthlyPlans.find(plan => plan.month.includes(currentMonth));
        if (currentPlan && currentPlan.tasks && prioritizedTasks.length < 3) {
            const incompleteTasks = currentPlan.tasks.filter(task => !task.done);
            if (incompleteTasks.length > 0) {
                prioritizedTasks.push({ text: `${incompleteTasks.length} monthly task${incompleteTasks.length > 1 ? 's' : ''} pending`, priority: 3 });
            }
        }
        
        // 4. Goals tasks (lower priority) - concise goal step
        if (prioritizedTasks.length < 3) {
            const nextGoalTasks = allTasks.filter(t => !t.completed).slice(0, 1);
            if (nextGoalTasks.length > 0) {
                const shortStep = nextGoalTasks[0].text.length > 30 ? 
                    nextGoalTasks[0].text.substring(0, 30) + '...' : 
                    nextGoalTasks[0].text;
                prioritizedTasks.push({ text: `Goal: ${shortStep}`, priority: 4 });
            }
        }
        
        // Fill remaining slots with motivational/productivity suggestions
        if (prioritizedTasks.length < 3) {
            const motivationalTasks = [
                "Review weekly progress",
                "Plan tomorrow's priorities", 
                "Update your goals status",
                "Check financial dashboard",
                "Schedule important calls"
            ];
            
            const remainingSlots = 3 - prioritizedTasks.length;
            for (let i = 0; i < remainingSlots; i++) {
                if (motivationalTasks[i]) {
                    prioritizedTasks.push({ text: motivationalTasks[i], priority: 5 });
                }
            }
        }
        
        // Sort by priority and take top 3
        const nextTasks = prioritizedTasks
            .sort((a, b) => a.priority - b.priority)
            .slice(0, 3)
            .map(task => ({ text: task.text }));
        
        const fund = parseFloat(data.emergencyFund) || 0;
        const target = parseFloat(data.emergencyFundTarget) || 40000;
        const fundProgress = target > 0 ? Math.min((fund / target) * 100, 100) : 0;
        
        const totalDaysInYear = 365;
        const yrProgress = totalDaysInYear > 0 ? ((totalDaysInYear - daysLeft) / totalDaysInYear) * 100 : 0;

        const goalsProgress = allGoals.length > 0 ? (gCompleted / allGoals.length) * 100 : 0;
        
        return {
            overallProgress: progress,
            goalsCompletedCount: gCompleted,
            totalGoals: allGoals.length,
            goalsInProgress: `${gInProgress}/${allGoals.length}`,
            criticalTasks: nextTasks,
            emergencyFundProgress: fundProgress,
            yearProgress: yrProgress,
            completedGoalsProgress: goalsProgress,
        };
    }, [data, daysLeft]);

    const emergencyFundFormatted = useMemo(() => {
        const totalAmount = parseFloat(data.emergencyFund) || 0;
        return isNaN(totalAmount) ? '0' : totalAmount.toLocaleString('en-IN');
    }, [data.emergencyFund]);
    
    const emergencyFundTargetFormatted = useMemo(() => {
        const amount = parseFloat(data.emergencyFundTarget);
        return isNaN(amount) ? '0' : amount.toLocaleString('en-IN');
    }, [data.emergencyFundTarget]);

    return (
        <div className="space-y-8">
            <div className="mb-6">
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-foreground">Dashboard Overview</h2>
                <p className="mt-2 text-sm md:text-base text-muted-foreground">A high-level look at your progress and key metrics.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
                <Card className="bg-white dark:bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 px-3 pt-3 xs:pb-2 xs:px-6 xs:pt-6">
                        <CardTitle className="text-[10px] xs:text-xs sm:text-sm font-medium text-muted-foreground">
                            <span className="hidden xs:inline">Overall Progress</span>
                            <span className="xs:hidden">Progress</span>
                        </CardTitle>
                        <Target className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent className="px-3 pb-3 xs:px-6 xs:pb-6">
                        <p className="text-sm sm:text-base md:text-lg font-bold text-foreground">{overallProgress}%</p>
                        <p className="text-xs text-muted-foreground mt-1 truncate">Based on all steps</p>
                         <Progress value={overallProgress} className="h-2 mt-4" />
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 px-3 pt-3 xs:pb-2 xs:px-6 xs:pt-6">
                        <CardTitle className="text-[10px] xs:text-xs sm:text-sm font-medium text-muted-foreground">
                            <span className="hidden xs:inline">Emergency Fund</span>
                            <span className="xs:hidden">Emergency</span>
                        </CardTitle>
                        <PiggyBank className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent className="px-3 pb-3 xs:px-6 xs:pb-6">
                         <p className="text-sm sm:text-base md:text-lg font-bold text-foreground">₹{emergencyFundFormatted}</p>
                        <p className="text-xs text-muted-foreground mt-1 truncate">Target: ₹{emergencyFundTargetFormatted}</p>
                        <Progress value={emergencyFundProgress} className="h-2 mt-4" />
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 px-3 pt-3 xs:pb-2 xs:px-6 xs:pt-6">
                        <CardTitle className="text-[10px] xs:text-xs sm:text-sm font-medium text-muted-foreground">
                            <span className="hidden xs:inline">Goals Status</span>
                            <span className="xs:hidden">Goals</span>
                        </CardTitle>
                        <CheckCircle className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent className="px-3 pb-3 xs:px-6 xs:pb-6">
                        <p className="text-sm sm:text-base md:text-lg font-bold text-foreground">{goalsCompletedCount} / {totalGoals}</p>
                        <p className="text-xs text-muted-foreground mt-1 truncate">Completed Goals</p>
                        <Progress value={completedGoalsProgress} className="h-2 mt-4" />
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 px-3 pt-3 xs:pb-2 xs:px-6 xs:pt-6">
                        <CardTitle className="text-[10px] xs:text-xs sm:text-sm font-medium text-muted-foreground">
                            <span className="hidden xs:inline">Days Left '25</span>
                            <span className="xs:hidden">Days '25</span>
                        </CardTitle>
                        <CalendarClock className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent className="px-3 pb-3 xs:px-6 xs:pb-6">
                        <p className="text-sm sm:text-base md:text-lg font-bold text-foreground">{daysLeft}</p>
                        <p className="text-xs text-muted-foreground mt-1 truncate">{Math.round(100 - yearProgress)}% of year left</p>
                        <Progress value={yearProgress} className="h-2 mt-4" />
                    </CardContent>
                </Card>
            </div>

             <div className="mt-2">
                <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-xs sm:text-sm md:text-base font-medium text-primary flex items-center gap-2">
                            <Brain className="h-5 w-5 text-primary" />
                            Next 3 Critical Steps
                        </CardTitle>
                        {isLoadingCriticalSteps && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="h-4 w-4 animate-spin" />
                                Analyzing...
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {aiCriticalSteps.length > 0 ? (
                            aiCriticalSteps.map((step, index) => (
                               <div key={index} className="bg-background border border-border p-3 rounded-md flex items-start gap-2">
                                    <ArrowRight className="text-primary h-3 w-3 flex-shrink-0 mt-0.5" />
                                    <span className="text-xs sm:text-sm font-medium text-foreground leading-tight">{step.text}</span>
                               </div>
                            ))
                        ) : !isLoadingCriticalSteps ? (
                            // Fallback to static critical tasks if AI fails
                            criticalTasks.length > 0 ? (
                                criticalTasks.map((task, index) => (
                                   <div key={index} className="bg-background border border-border p-3 rounded-md flex items-start gap-2">
                                        <ArrowRight className="text-primary h-3 w-3 flex-shrink-0 mt-0.5" />
                                        <span className="text-xs sm:text-sm text-foreground leading-tight">{task.text}</span>
                                   </div>
                                ))
                            ) : (
                                 <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 p-3 rounded-md flex items-center">
                                    <CheckCircle className="mr-2 h-3 w-3"/>
                                    <span className="text-xs sm:text-sm font-medium">All critical tasks completed!</span>
                                </div>
                            )
                        ) : null}
                    </CardContent>
                </Card>
            </div>

            <AiSuggestionSection
                moduleName="DashboardOverview"
                title="AI Insights for your Dashboard"
                description="Get comprehensive insights based on your goals, career, finances, and life data to optimize your personal growth."
                contextData={data}
                showInput={true}
            />
        </div>
    )
}
