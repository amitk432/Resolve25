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
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <BrainCircuit className="text-primary h-5 w-5" />
            AI Tasks for {monthData.month}
          </DialogTitle>
          <DialogDescription className="text-sm">
            AI-suggested tasks based on your goals
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-4 -mr-4 min-h-[120px] max-h-48">
            {isLoading && (
            <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
            )}
            {!isLoading && suggestions.length > 0 && (
            <div className="space-y-1.5">
                {suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-center justify-between gap-2 p-2 rounded-md bg-white dark:bg-card border">
                        <p className="text-xs text-foreground leading-relaxed">{suggestion}</p>
                        <Button size="sm" onClick={() => handleAddTask(suggestion)} className="h-6 text-xs">
                            <Plus className="mr-1 h-3 w-3" /> Add
                        </Button>
                    </div>
                ))}
            </div>
            )}
            {!isLoading && suggestions.length === 0 && (
                <div className="text-center py-6">
                    <p className="text-muted-foreground text-sm">No suggestions available</p>
                </div>
            )}
        </div>
        <DialogFooter className="pt-3">
          <Button variant="outline" onClick={handleGenerate} disabled={isLoading} size="sm" className="h-8 text-sm">
            {isLoading ? <><Loader2 className="mr-1.5 h-3 w-3 animate-spin"/>Generating...</> : 'Regenerate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
