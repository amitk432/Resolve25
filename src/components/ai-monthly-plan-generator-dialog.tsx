'use client';

import { useState } from 'react';
import type { AppData } from '@/lib/types';
import type { SuggestedMonthlyPlan } from '@/ai/flows/generate-monthly-plan-suggestions';
import { getAIMonthlyPlanSuggestions } from '@/app/actions';

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
import { BrainCircuit, Sparkles, Loader2, Plus, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';

interface AiMonthlyPlanGeneratorDialogProps {
  data: AppData;
  onPlanAdd: (plan: SuggestedMonthlyPlan) => void;
  children: React.ReactNode;
}

export default function AiMonthlyPlanGeneratorDialog({ data, onPlanAdd, children }: AiMonthlyPlanGeneratorDialogProps) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedMonthlyPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsLoading(true);
    setSuggestions([]);
    const result = await getAIMonthlyPlanSuggestions({ context: data });
    setIsLoading(false);

    if (result && 'error' in result) {
      toast({
        variant: 'destructive',
        title: 'Error generating plans',
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

  const handleAddPlan = (plan: SuggestedMonthlyPlan) => {
    onPlanAdd(plan);
    toast({
        title: 'Plan Added!',
        description: `Your plan for "${plan.month}" has been added.`,
    });
    setSuggestions(prev => prev.filter(s => s.month !== plan.month));
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BrainCircuit className="text-primary" />
            AI-Powered Monthly Plan Suggestions
          </DialogTitle>
          <DialogDescription>
            Based on your dashboard data, here are new monthly plans the AI thinks you could add.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-4 -mr-4">
            {isLoading && (
            <div className="flex items-center justify-center p-16">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            )}
            {!isLoading && suggestions.length > 0 && (
            <div className="space-y-4">
                {suggestions.map((plan, index) => (
                <Card key={index} className="bg-white dark:bg-card">
                    <CardHeader>
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-grow">
                                <CardTitle className="text-lg flex items-center gap-2"><CalendarDays className="h-5 w-5"/>{plan.month}</CardTitle>
                                <CardDescription className="mt-1">{plan.theme}</CardDescription>
                            </div>
                            <Button size="sm" onClick={() => handleAddPlan(plan)}>
                                <Plus className="mr-2 h-4 w-4" /> Add Plan
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <h4 className="font-semibold text-sm mb-2">Suggested tasks:</h4>
                        <ul className="space-y-1 list-none text-sm">
                            {plan.tasks.map((task, taskIndex) => (
                            <li key={taskIndex} className="flex items-center gap-2 text-muted-foreground">
                                <Sparkles className="h-3 w-3 text-primary flex-shrink-0" />
                                <span>{task}</span>
                            </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
                ))}
            </div>
            )}
            {!isLoading && suggestions.length === 0 && (
                <div className="text-center py-16">
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
