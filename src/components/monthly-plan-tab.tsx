'use client'

import { useState } from 'react';
import type { MonthlyPlan, AppData } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sparkles, Plus, Trash2 } from 'lucide-react';
import { Input } from './ui/input';
import AiMonthlyPlanGeneratorDialog from './ai-monthly-plan-generator-dialog';
import type { SuggestedMonthlyPlan } from '@/ai/flows/generate-monthly-plan-suggestions';
import AddMonthlyPlanDialog from './add-monthly-plan-dialog';
import AiMonthlyTaskSuggestionDialog from './ai-monthly-task-suggestion-dialog';

interface MonthlyPlanTabProps {
    monthlyPlan: MonthlyPlan[];
    onToggleTask: (monthIndex: number, taskIndex: number, done: boolean) => void;
    onAddTask: (monthIndex: number, taskText: string) => void;
    onDeleteTask: (monthIndex: number, taskIndex: number) => void;
    onAddPlan: (plan: SuggestedMonthlyPlan) => void;
    onManualAddPlan: (plan: { month: string; theme: string; }) => void;
    data: AppData;
}

const MonthCard = ({ monthData, monthIndex, data, onToggleTask, onAddTask, onDeleteTask }: { monthData: MonthlyPlan, monthIndex: number, data: AppData, onToggleTask: (monthIndex: number, taskIndex: number, done: boolean) => void, onAddTask: (monthIndex: number, taskText: string) => void, onDeleteTask: (monthIndex: number, taskIndex: number) => void }) => {
    const [newTaskText, setNewTaskText] = useState('');

    const handleAddTask = () => {
        if (newTaskText.trim()) {
            onAddTask(monthIndex, newTaskText);
            setNewTaskText('');
        }
    }

    const handleAiTaskAdd = (taskText: string) => {
        onAddTask(monthIndex, taskText);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-primary">{monthData.month}</CardTitle>
                <CardDescription>{monthData.theme}</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="space-y-3 mt-4">
                    {monthData.tasks.map((task, taskIndex) => (
                        <div key={taskIndex} className="flex items-center group">
                            <Checkbox
                                id={`task-${monthIndex}-${taskIndex}`}
                                checked={task.done}
                                onCheckedChange={(checked) => onToggleTask(monthIndex, taskIndex, !!checked)}
                                className="mr-3"
                            />
                            <label
                                htmlFor={`task-${monthIndex}-${taskIndex}`}
                                className={cn("text-sm text-foreground flex-grow", task.done && "line-through text-muted-foreground")}
                            >
                                {task.text}
                            </label>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => onDeleteTask(monthIndex, taskIndex)}
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                 </div>
                 <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                    <Input
                      placeholder="Add a new task..."
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                    />
                    <Button size="icon" onClick={handleAddTask}>
                        <Plus className="h-4 w-4"/>
                    </Button>
                    <AiMonthlyTaskSuggestionDialog
                        monthData={monthData}
                        data={data}
                        onTaskAdd={handleAiTaskAdd}
                    />
                </div>
            </CardContent>
        </Card>
    )
}

export default function MonthlyPlanTab({ monthlyPlan, onToggleTask, onAddTask, onDeleteTask, onAddPlan, onManualAddPlan, data }: MonthlyPlanTabProps) {
    return (
         <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Monthly Action Plan</h2>
                  <p className="text-muted-foreground mt-1">Break down your year into manageable monthly chunks.</p>
                </div>
                <div className="flex items-center gap-2">
                    <AiMonthlyPlanGeneratorDialog data={data} onPlanAdd={onAddPlan}>
                        <Button>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate with AI
                        </Button>
                    </AiMonthlyPlanGeneratorDialog>
                    <AddMonthlyPlanDialog onPlanAdd={onManualAddPlan} />
                </div>
            </div>
            
            <div className="space-y-8 mt-8">
                {monthlyPlan.map((monthData, monthIndex) => (
                    <MonthCard
                        key={monthIndex}
                        monthData={monthData}
                        monthIndex={monthIndex}
                        data={data}
                        onToggleTask={onToggleTask}
                        onAddTask={onAddTask}
                        onDeleteTask={onDeleteTask}
                    />
                ))}
            </div>
        </div>
    )
}
