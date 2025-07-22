'use client';

import { useState } from 'react';
import type { AppData, MonthlyPlan } from '@/lib/types';
import { getModuleSuggestions } from '@/app/actions';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { BrainCircuit, Sparkles, Loader2, Plus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AiMonthlyTaskSuggestionDialogProps {
  monthData: MonthlyPlan;
  data: AppData;
  onTaskAdd: (taskText: string) => void;
}

export default function AiMonthlyTaskSuggestionDialog({ monthData, data, onTaskAdd }: AiMonthlyTaskSuggestionDialogProps) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsLoading(true);
    setSuggestions([]);
    const result = await getModuleSuggestions({
      module: 'MonthlyPlan',
      context: data,
      focusedMonth: monthData.month,
    });
    setIsLoading(false);

    if (result && 'error' in result) {
      toast({
        variant: 'destructive',
        title: 'Error generating tasks',
        description: result.error,
      });
    } else if (result) {
      setSuggestions(result.suggestions);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      handleGenerate();
    }
  };

  const handleAddTask = (taskText: string) => {
    onTaskAdd(taskText);
    toast({
        title: 'Task Added!',
        description: `"${taskText}" has been added to ${monthData.month}.`,
    });
    setSuggestions(prev => prev.filter(s => s !== taskText));
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                    <Sparkles className="h-4 w-4" />
                </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Suggest tasks with AI</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BrainCircuit className="text-primary" />
            AI Task Suggestions for {monthData.month}
          </DialogTitle>
          <DialogDescription>
            Based on your overall goals, here are a few tasks our AI thinks would fit well this month.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-4 -mr-4 min-h-[150px] max-h-60">
            {isLoading && (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
            )}
            {!isLoading && suggestions.length > 0 && (
            <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-center justify-between gap-2 p-2 rounded-md bg-white dark:bg-card">
                        <p className="text-sm text-foreground">{suggestion}</p>
                        <Button size="sm" onClick={() => handleAddTask(suggestion)}>
                            <Plus className="mr-2 h-4 w-4" /> Add
                        </Button>
                    </div>
                ))}
            </div>
            )}
            {!isLoading && suggestions.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-muted-foreground">No new suggestions at the moment.</p>
                </div>
            )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Generating...</> : 'Regenerate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
