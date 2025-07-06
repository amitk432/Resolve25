'use client';

import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Calendar, Check, Plus, Trash2, Briefcase, HeartPulse, BookOpenText } from 'lucide-react';
import type { Goal, Step, GoalCategory } from '@/lib/types';
import { cn } from '@/lib/utils';
import AiTipsDialog from './ai-tips-dialog';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface GoalCardProps {
  goal: Goal;
  onStepToggle: (goalId: string, stepId: string) => void;
  onStepAdd: (goalId:string, stepText: string) => void;
  onGoalDelete: (goalId: string) => void;
}

const categoryInfo: Record<GoalCategory, { icon: React.ReactNode; className: string }> = {
  Health: { icon: <HeartPulse className="h-4 w-4" />, className: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' },
  Career: { icon: <Briefcase className="h-4 w-4" />, className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' },
  Personal: { icon: <BookOpenText className="h-4 w-4" />, className: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' },
};

export default function GoalCard({ goal, onStepToggle, onStepAdd, onGoalDelete }: GoalCardProps) {
  const [newStepText, setNewStepText] = useState('');
  const completedSteps = goal.steps.filter(step => step.completed).length;
  const totalSteps = goal.steps.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  const isCompleted = progress === 100 && totalSteps > 0;

  const handleAddStep = () => {
    if (newStepText.trim()) {
      onStepAdd(goal.id, newStepText);
      setNewStepText('');
    }
  };

  return (
    <Card className={cn('transition-all', isCompleted && 'bg-muted/50')}>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className={cn("flex items-center gap-1.5", categoryInfo[goal.category].className)}>
                        {categoryInfo[goal.category].icon}
                        {goal.category}
                    </Badge>
                    {isCompleted && (
                        <Badge className="bg-primary/20 text-primary-foreground hover:bg-primary/30 flex items-center gap-1.5 border-primary/50">
                            <Check className="h-4 w-4" />
                            Completed!
                        </Badge>
                    )}
                </div>
                <CardTitle>{goal.title}</CardTitle>
                <CardDescription className="mt-1">{goal.description}</CardDescription>
            </div>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => onGoalDelete(goal.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Delete Goal</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
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
                {goal.steps.map(step => (
                  <div key={step.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                    <Checkbox
                      id={`step-${step.id}`}
                      checked={step.completed}
                      onCheckedChange={() => onStepToggle(goal.id, step.id)}
                    />
                    <label
                      htmlFor={`step-${step.id}`}
                      className={cn('text-sm font-medium leading-none', step.completed && 'line-through text-muted-foreground')}
                    >
                      {step.text}
                    </label>
                  </div>
                ))}
                {goal.steps.length === 0 && <p className="text-sm text-muted-foreground p-2">No steps yet. Add one below!</p>}
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
      <CardFooter className="flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="mr-2 h-4 w-4" />
          <span>Deadline: {format(goal.deadline, 'PPP')} ({formatDistanceToNow(goal.deadline, { addSuffix: true })})</span>
        </div>
        <AiTipsDialog goal={goal} />
      </CardFooter>
    </Card>
  );
}
