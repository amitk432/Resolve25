
'use client'

import React, { useMemo, useState, useEffect } from 'react';
import { AppData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, CheckCircle, Target, PiggyBank, CalendarClock } from 'lucide-react';
import AiSuggestionSection from './ai-suggestion-section';

interface DashboardOverviewProps {
    data: AppData;
}

export default function DashboardOverview({ data }: DashboardOverviewProps) {
    const [daysLeft, setDaysLeft] = useState(0);

    useEffect(() => {
        const endOfYear = new Date('2025-12-31');
        const now = new Date();
        const diffTime = endOfYear.getTime() - now.getTime();
        const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        setDaysLeft(diffDays);
    }, []);

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
        
        const nextTasks = allTasks.filter(t => !t.completed).slice(0, 3);
        
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
                <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
                <p className="mt-1 text-muted-foreground">A high-level look at your progress and key metrics.</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground">Overall Progress</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{overallProgress}%</p>
                        <p className="text-xs text-muted-foreground mt-1 truncate">Based on all steps</p>
                         <Progress value={overallProgress} className="h-2 mt-4" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground">Emergency Fund</CardTitle>
                        <PiggyBank className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                         <p className="text-2xl font-bold text-foreground">₹{emergencyFundFormatted}</p>
                        <p className="text-xs text-muted-foreground mt-1 truncate">Target: ₹{emergencyFundTargetFormatted}</p>
                        <Progress value={emergencyFundProgress} className="h-2 mt-4" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground">Goals Status</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{goalsCompletedCount} / {totalGoals}</p>
                        <p className="text-xs text-muted-foreground mt-1 truncate">Completed Goals</p>
                        <Progress value={completedGoalsProgress} className="h-2 mt-4" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground">Days Left '25</CardTitle>
                        <CalendarClock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{daysLeft}</p>
                        <p className="text-xs text-muted-foreground mt-1 truncate">{Math.round(100 - yearProgress)}% of year left</p>
                        <Progress value={yearProgress} className="h-2 mt-4" />
                    </CardContent>
                </Card>
            </div>

             <div className="mt-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Next 3 Critical Steps</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {criticalTasks.length > 0 ? (
                            criticalTasks.map((task, index) => (
                               <div key={index} className="bg-muted/50 p-3 rounded-lg flex items-center">
                                    <ArrowRight className="text-primary mr-3 h-4 w-4 flex-shrink-0" />
                                    <span className="text-sm">{task.text}</span>
                               </div>
                            ))
                        ) : (
                             <div className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 p-3 rounded-lg flex items-center">
                                <CheckCircle className="mr-3 h-4 w-4"/>
                                <span className="text-sm font-medium">All goals and steps completed! Great job!</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <AiSuggestionSection
                moduleName="DashboardOverview"
                title="AI Insights for your Dashboard"
                description="Get personalized suggestions based on your overall progress and goals."
                contextData={data}
            />
        </div>
    )
}
