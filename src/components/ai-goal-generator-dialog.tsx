'use client';

import { useState } from 'react';
import type { AppData } from '@/lib/types';
import type { SuggestedGoal } from '@/ai/flows/generate-goal-suggestions';
import { getAIGoalSuggestions } from '@/app/actions';

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
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface AiGoalGeneratorDialogProps {
  data: AppData;
  onGoalAdd: (goal: SuggestedGoal) => void;
  children: React.ReactNode;
}

export default function AiGoalGeneratorDialog({ data, onGoalAdd, children }: AiGoalGeneratorDialogProps) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedGoal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsLoading(true);
    setSuggestions([]);
    const result = await getAIGoalSuggestions({ context: data });
    setIsLoading(false);

    if ('error' in result) {
      toast({
        variant: 'destructive',
        title: 'Error generating goals',
        description: result.error,
      });
    } else {
      setSuggestions(result.suggestions);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      handleGenerate();
    }
  };

  const handleAddGoal = (goal: SuggestedGoal) => {
    onGoalAdd(goal);
    toast({
        title: 'Goal Added!',
        description: `"${goal.title}" has been added to your goals.`,
    });
    // Remove the added goal from the suggestion list
    setSuggestions(prev => prev.filter(s => s.title !== goal.title));
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
            AI-Powered Goal Suggestions
          </DialogTitle>
          <DialogDescription>
            Based on your dashboard data, here are a few goals our AI thinks you might find useful.
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
                {suggestions.map((goal, index) => (
                <Card key={index} className="bg-white dark:bg-card">
                    <CardHeader>
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-grow">
                                <Badge variant="secondary" className="mb-2">{goal.category}</Badge>
                                <CardTitle className="text-lg">{goal.title}</CardTitle>
                            </div>
                            <Button size="sm" onClick={() => handleAddGoal(goal)}>
                                <Plus className="mr-2 h-4 w-4" /> Add Goal
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">{goal.description}</p>
                        <h4 className="font-semibold text-sm mb-2">Suggested first steps:</h4>
                        <ul className="space-y-1 list-none text-sm">
                            {goal.steps.map((step, stepIndex) => (
                            <li key={stepIndex} className="flex items-center gap-2 text-muted-foreground">
                                <Sparkles className="h-3 w-3 text-primary flex-shrink-0" />
                                <span>{step}</span>
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
