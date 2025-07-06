'use client'

import type { MonthlyPlan } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface MonthlyPlanTabProps {
    monthlyPlan: MonthlyPlan[];
    onToggleTask: (monthIndex: number, taskIndex: number, done: boolean) => void;
}

export default function MonthlyPlanTab({ monthlyPlan, onToggleTask }: MonthlyPlanTabProps) {
    return (
         <div>
            <h2 className="text-xl font-bold text-foreground mb-4">Monthly Action Plan</h2>
            
            <div className="space-y-8 mt-8">
                {monthlyPlan.map((monthData, monthIndex) => (
                    <Card key={monthIndex}>
                        <CardHeader>
                            <CardTitle className="text-primary">{monthData.month}</CardTitle>
                            <CardDescription>{monthData.theme}</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="space-y-3 mt-4">
                                {monthData.tasks.map((task, taskIndex) => (
                                    <div key={taskIndex} className="flex items-center">
                                        <Checkbox
                                            id={`task-${monthIndex}-${taskIndex}`}
                                            checked={task.done}
                                            onCheckedChange={(checked) => onToggleTask(monthIndex, taskIndex, !!checked)}
                                            className="mr-3"
                                        />
                                        <label
                                            htmlFor={`task-${monthIndex}-${taskIndex}`}
                                            className={cn("text-sm text-foreground", task.done && "line-through text-muted-foreground")}
                                        >
                                            {task.text}
                                        </label>
                                    </div>
                                ))}
                             </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
