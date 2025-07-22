
'use client';

import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Calendar, Check, Plus, Trash2, Briefcase, HeartPulse, BookOpenText } from 'lucide-react';
import type { Goal, Step, GoalCategory } from '@/lib/types';
import { cn } from '@/lib/utils';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


interface GoalCardProps {
  goal: Goal;
  onStepToggle: (goalId: string, stepId: string) => void;
  onStepAdd: (goalId:string, stepText: string) => void;
  onGoalDelete: (goalId: string) => void;
}

const categoryInfo: Record<string, { icon: React.ReactNode; className: string }> = {
  Health: { icon: <HeartPulse className="h-4 w-4" />, className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800' },
  Career: { icon: <Briefcase className="h-4 w-4" />, className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800' },
  Personal: { icon: <BookOpenText className="h-4 w-4" />, className: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-800' },
};


export default function GoalCard({ goal, onStepToggle, onStepAdd, onGoalDelete }: GoalCardProps) {
  const [newStepText, setNewStepText] = useState('');
  
  const steps = goal.steps || [];
  const completedSteps = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  const isCompleted = progress === 100 && totalSteps > 0;
  
  const deadlineDate = goal.deadline ? new Date(goal.deadline) : null;
  const isValidDate = deadlineDate && !isNaN(deadlineDate.getTime());

  const info = categoryInfo[goal.category] || categoryInfo['Personal'];

  const handleAddStep = () => {
    if (newStepText.trim()) {
      onStepAdd(goal.id, newStepText);
      setNewStepText('');
    }
  };

  return (
    <Card className={cn('transition-all duration-300 ease-in-out hover:shadow-xl flex flex-col', isCompleted ? 'bg-white dark:bg-card' : 'bg-card')}>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className={cn("flex items-center gap-1.5", info.className)}>
                        {info.icon}
                        {goal.category || 'Personal'}
                    </Badge>
                    {isCompleted && (
                        <Badge className="bg-green-500 text-white flex items-center gap-1.5 border-green-600">
                            <Check className="h-4 w-4" />
                            Completed!
                        </Badge>
                    )}
                </div>
                <CardTitle>{goal.title}</CardTitle>
                {goal.description && <CardDescription className="mt-1">{goal.description}</CardDescription>}
            </div>
             <AlertDialog>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Delete Goal</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your goal "{goal.title}" and all its steps.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onGoalDelete(goal.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium text-foreground">{completedSteps} / {totalSteps} steps</span>
        </div>
        <Progress value={progress} className="h-2" />
        
        <Accordion type="single" collapsible className="w-full mt-4">
          <AccordionItem value="item-1">
            <AccordionTrigger>Actionable Steps</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {steps.map(step => (
                  <div key={step.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/30">
                    <Checkbox
                      id={`step-${step.id}`}
                      checked={step.completed}
                      onCheckedChange={() => onStepToggle(goal.id, step.id)}
                    />
                    <label
                      htmlFor={`step-${step.id}`}
                      className={cn('text-sm font-medium leading-none flex-1', step.completed && 'line-through text-muted-foreground')}
                    >
                      {step.text}
                    </label>
                  </div>
                ))}
                {steps.length === 0 && <p className="text-sm text-muted-foreground p-2 text-center">No steps yet. Add one below!</p>}
              </div>
              <div className="flex gap-2 mt-4">
                <Input 
                  placeholder="Add a new step" 
                  value={newStepText}
                  onChange={(e) => setNewStepText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddStep()}
                />
                <Button size="icon" onClick={handleAddStep}><Plus className="h-4 w-4"/></Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="mr-2 h-4 w-4" />
            {isValidDate && deadlineDate ? (
                <span>Deadline: {format(deadlineDate, 'dd-MMMM-yyyy')} ({formatDistanceToNow(deadlineDate, { addSuffix: true })})</span>
            ) : (
                <span>No deadline set</span>
            )}
        </div>
      </CardFooter>
    </Card>
  );
}
