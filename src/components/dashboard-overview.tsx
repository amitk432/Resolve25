'use client'

import React, { useMemo, useState, useEffect } from 'react';
import { AppData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, CheckCircle } from 'lucide-react';
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

    const { overallProgress, goalsCompleted, goalsInProgress, criticalTasks } = useMemo(() => {
        const allGoals = data.goals || [];
        const allTasks = allGoals.flatMap(g => g.steps || []);
        const completedTasks = allTasks.filter(t => t.completed).length;
        const totalTasks = allTasks.length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        const gCompleted = allGoals.filter(g => (g.steps || []).length > 0 && (g.steps || []).every(s => s.completed)).length;
        const gInProgress = allGoals.filter(g => !(g.steps || []).every(s => s.completed)).length;
        
        const nextTasks = allTasks.filter(t => !t.completed).slice(0, 3);
        
        return {
            overallProgress: progress,
            goalsCompleted: `${gCompleted}/${allGoals.length}`,
            goalsInProgress: `${gInProgress}/${allGoals.length}`,
            criticalTasks: nextTasks
        };
    }, [data]);

    const emergencyFundFormatted = useMemo(() => {
        const amount = parseFloat(data.emergencyFund);
        return isNaN(amount) ? '0' : amount.toLocaleString('en-IN');
    }, [data.emergencyFund]);

    return (
        <div>
            <h2 className="text-xl font-bold text-foreground mb-4">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold text-muted-foreground">Overall Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Progress value={overallProgress} className="h-3" />
                        <p className="text-2xl font-bold mt-2">{overallProgress}%</p>
                        <p className="text-xs text-muted-foreground mt-1">Based on completed steps.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold text-muted-foreground">Emergency Fund</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <p className="text-3xl font-bold text-foreground">₹{emergencyFundFormatted}</p>
                        <p className="text-sm text-green-600 dark:text-green-500 font-medium">Target: ₹40,000</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold text-muted-foreground">Goals Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-sm text-foreground">Completed</span>
                            <span className="font-bold text-green-600 dark:text-green-500">{goalsCompleted}</span>
                        </div>
                         <div className="flex justify-between items-center mt-1">
                            <span className="text-sm text-foreground">In Progress</span>
                            <span className="font-bold text-chart-4">{goalsInProgress}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold text-muted-foreground">Days Left in 2025</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-foreground">{daysLeft}</p>
                        <p className="text-xs text-muted-foreground mt-2">Let's make them count!</p>
                    </CardContent>
                </Card>
            </div>

             <div className="mt-8">
                <h3 className="text-lg font-bold text-foreground mb-4">Next 3 Critical Steps</h3>
                <div className="space-y-3">
                    {criticalTasks.length > 0 ? (
                        criticalTasks.map((task, index) => (
                           <div key={index} className="bg-muted p-3 rounded-lg flex items-center">
                                <ArrowRight className="text-primary mr-3 h-4 w-4" />
                                <span className="text-sm">{task.text}</span>
                           </div>
                        ))
                    ) : (
                         <div className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 p-3 rounded-lg flex items-center">
                            <CheckCircle className="mr-3 h-4 w-4"/>
                            <span className="text-sm font-medium">All goals and steps completed! Great job!</span>
                        </div>
                    )}
                </div>
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
