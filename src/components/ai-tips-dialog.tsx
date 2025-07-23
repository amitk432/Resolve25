'use client';

import { useState } from 'react';
import type { Goal, AppData } from '@/lib/types';
import { getAIGoalStepSuggestions } from '@/app/actions';
import type { SuggestedStep } from '@/ai/flows/generate-goal-step-suggestions';

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
import { BrainCircuit, Sparkles, Loader2, Plus, CheckCircle2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';

interface AiTipsDialogProps {
  goal: Goal;
  data?: AppData;
  onStepAdd?: (goalId: string, stepText: string) => void;
  onMultipleStepsAdd?: (goalId: string, stepTexts: string[]) => void;
}

export default function AiTipsDialog({ goal, data, onStepAdd, onMultipleStepsAdd }: AiTipsDialogProps) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<SuggestedStep & { selected: boolean }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGetSuggestions = async () => {
    if (!data) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'User data is required to generate personalized suggestions.',
      });
      return;
    }

    setIsLoading(true);
    setSuggestions([]);
    
    try {
      const result = await getAIGoalStepSuggestions({ goal, context: data });
      
      if ('error' in result) {
        toast({
          variant: 'destructive',
          title: 'Error generating suggestions',
          description: result.error,
        });
      } else {
        const suggestionsWithSelection = result.suggestions.map((suggestion, index) => ({
          ...suggestion,
          selected: false,
        }));
        setSuggestions(suggestionsWithSelection);
      }
    } catch (error) {
      console.error('AI step suggestions error:', error);
      toast({
        title: "Error",
        description: "Failed to get AI suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSuggestionSelection = (index: number) => {
    setSuggestions(prev => prev.map((suggestion, i) => 
      i === index ? { ...suggestion, selected: !suggestion.selected } : suggestion
    ));
  };

  const handleAddSelectedSuggestions = () => {
    const selectedSuggestions = suggestions.filter(s => s.selected);
    
    if (selectedSuggestions.length === 0) {
      toast({
        title: "No steps selected",
        description: "Please select at least one step to add.",
        variant: "destructive",
      });
      return;
    }

    // Use the batch handler if available, otherwise fall back to individual additions
    if (onMultipleStepsAdd) {
      const stepTexts = selectedSuggestions.map(suggestion => suggestion.text);
      onMultipleStepsAdd(goal.id, stepTexts);
    } else if (onStepAdd) {
      selectedSuggestions.forEach((suggestion, index) => {
        // Add small delay between calls to ensure unique IDs
        setTimeout(() => {
          onStepAdd(goal.id, suggestion.text);
        }, index * 10);
      });
    }
    
    toast({
      title: "Steps added!",
      description: `${selectedSuggestions.length} actionable step${selectedSuggestions.length > 1 ? 's' : ''} added to your goal.`,
    });
    
    setOpen(false);
    setSuggestions([]);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-600 border-red-200';
      case 'Medium': return 'text-yellow-600 border-yellow-200';
      case 'Low': return 'text-green-600 border-green-200';
      default: return 'text-gray-600 border-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="mr-2 h-4 w-4" />
          Get AI Tips
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BrainCircuit className="text-primary h-5 w-5" />
            AI Actionable Step Suggestions
          </DialogTitle>
          <DialogDescription>
            Get personalized actionable steps to achieve your goal based on your data and progress.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="font-medium">
            Goal: <span className="font-normal text-muted-foreground">{goal.title}</span>
          </div>
          
          {isLoading && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Generating personalized suggestions...</span>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold">AI-Suggested Actionable Steps:</h4>
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="p-4 rounded-lg border bg-white dark:bg-card hover:bg-accent/30 transition-all duration-200">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={suggestion.selected}
                        onCheckedChange={() => toggleSuggestionSelection(index)}
                        className="flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{suggestion.text}</p>
                            <p className="text-xs text-muted-foreground">{suggestion.reasoning}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={`text-xs ${getPriorityColor(suggestion.priority)}`}>
                            {suggestion.priority} Priority
                          </Badge>
                          <Badge variant="outline" className="text-xs flex items-center gap-1 text-purple-600 border-purple-200">
                            <Sparkles className="h-3 w-3" />
                            AI Generated
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => {
            setOpen(false);
            setSuggestions([]);
          }}>
            Cancel
          </Button>
          {suggestions.length === 0 ? (
            <Button onClick={handleGetSuggestions} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Step Suggestions
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleAddSelectedSuggestions}>
              <Plus className="h-4 w-4 mr-2" />
              Add Selected Steps ({suggestions.filter(s => s.selected).length})
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
