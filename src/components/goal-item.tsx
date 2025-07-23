
'use client';

import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Calendar, Check, Plus, Trash2, Briefcase, HeartPulse, BookOpenText, Pencil } from 'lucide-react';
import type { Goal, GoalCategory, AppData } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
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
import AiTipsDialog from './ai-tips-dialog';

interface GoalItemProps {
  goal: Goal;
  data: AppData;
  onStepToggle: (goalId: string, stepId: string) => void;
  onStepAdd: (goalId:string, stepText: string) => void;
  onMultipleStepsAdd: (goalId: string, stepTexts: string[]) => void;
  onStepEdit: (goalId: string, stepId: string, newText: string) => void;
  onStepDelete: (goalId: string, stepId: string) => void;
  onGoalDelete: (goalId: string) => void;
}

const categoryInfo: Record<GoalCategory, { icon: React.ReactNode; className: string }> = {
    Health: { icon: <HeartPulse className="h-5 w-5" />, className: 'bg-green-900/50 text-green-300 border-green-800' },
    Career: { icon: <Briefcase className="h-5 w-5" />, className: 'bg-blue-900/50 text-blue-300 border-blue-800' },
    Personal: { icon: <BookOpenText className="h-5 w-5" />, className: 'bg-purple-900/50 text-purple-300 border-purple-800' },
  };

export default function GoalItem({ goal, data, onStepToggle, onStepAdd, onMultipleStepsAdd, onStepEdit, onStepDelete, onGoalDelete }: GoalItemProps) {
  const [newStepText, setNewStepText] = useState('');
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editingStepText, setEditingStepText] = useState('');
  
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

  const handleEditStep = (stepId: string, currentText: string) => {
    setEditingStepId(stepId);
    setEditingStepText(currentText);
  };

  const handleSaveEdit = () => {
    if (editingStepId && editingStepText.trim()) {
      onStepEdit(goal.id, editingStepId, editingStepText);
      setEditingStepId(null);
      setEditingStepText('');
    }
  };

  const handleCancelEdit = () => {
    setEditingStepId(null);
    setEditingStepText('');
  };

  const handleDeleteStep = (stepId: string) => {
    onStepDelete(goal.id, stepId);
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={goal.id} className="border rounded-lg bg-secondary/40 shadow-sm hover:bg-secondary/60 transition-colors duration-300">
        <AccordionTrigger className="p-4 hover:no-underline">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full">
            <div className="flex-grow space-y-2 text-left">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={cn("flex items-center gap-2", info.className)}>
                  {info.icon}
                  {goal.category}
                </Badge>
                <h3 className="font-semibold text-lg text-card-foreground">{goal.title}</h3>
                {isCompleted && (
                  <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-1.5">
                      <Check className="h-4 w-4" />
                      Completed
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {isValidDate ? `Deadline: ${format(deadlineDate!, 'dd-MMM-yy')}` : 'No deadline'}
              </p>
            </div>
            <div className="w-full md:w-56 shrink-0 space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{completedSteps}/{totalSteps}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
            {goal.description && <p className="text-sm text-muted-foreground mb-4">{goal.description}</p>}
            <div className="space-y-3 mb-4">
                <h4 className="font-medium text-base">Actionable Steps</h4>
                {steps.map(step => (
                    <div key={step.id} className="flex items-center gap-3 p-3 rounded-lg border bg-white dark:bg-card hover:bg-accent/30 transition-all duration-200">
                    <Checkbox
                        id={`step-${step.id}`}
                        checked={step.completed}
                        onCheckedChange={() => onStepToggle(goal.id, step.id)}
                        className="flex-shrink-0"
                    />
                    {editingStepId === step.id ? (
                        <div className="flex-1 flex items-center gap-2">
                            <Input
                                value={editingStepText}
                                onChange={(e) => setEditingStepText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit();
                                    if (e.key === 'Escape') handleCancelEdit();
                                }}
                                className="flex-1"
                                autoFocus
                            />
                            <Button size="sm" onClick={handleSaveEdit} variant="outline">
                                <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" onClick={handleCancelEdit} variant="outline">
                                ✕
                            </Button>
                        </div>
                    ) : (
                        <>
                            <label
                                htmlFor={`step-${step.id}`}
                                className={cn('text-sm font-medium leading-none flex-1', step.completed && 'line-through text-muted-foreground')}
                            >
                                {step.text}
                            </label>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditStep(step.id, step.text)}
                                    className="h-6 w-6 text-muted-foreground hover:text-primary"
                                >
                                    <Pencil className="h-3 w-3" />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete the step "{step.text}".
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => handleDeleteStep(step.id)}
                                                className="bg-destructive hover:bg-destructive/90"
                                            >
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </>
                    )}
                    </div>
                ))}
                {steps.length === 0 && <p className="text-sm text-muted-foreground p-3 text-center border-2 border-dashed rounded-lg">No steps yet. Add one below!</p>}
            </div>
            <div className="flex items-center gap-2 border-t pt-4 border-white/10">
                <Input 
                    placeholder="Add a new step..." 
                    value={newStepText}
                    onChange={(e) => setNewStepText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddStep()}
                />
                <Button size="icon" onClick={handleAddStep}><Plus className="h-5 w-5"/></Button>
                <AiTipsDialog goal={goal} data={data} onStepAdd={onStepAdd} onMultipleStepsAdd={onMultipleStepsAdd} />
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-5 w-5" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete your goal "{goal.title}" and all its steps.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onGoalDelete(goal.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
