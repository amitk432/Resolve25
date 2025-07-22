'use client';

import { useState } from 'react';
import type { AppData } from '@/lib/types';
import type { SuggestedTask } from '@/ai/flows/generate-task-suggestions';
import { getAITaskSuggestions } from '@/app/actions';

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

interface AiTaskGeneratorDialogProps {
  data: AppData;
  onTaskAdd: (task: SuggestedTask) => void;
  children: React.ReactNode;
}

export default function AiTaskGeneratorDialog({ data, onTaskAdd, children }: AiTaskGeneratorDialogProps) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsLoading(true);
    setSuggestions([]);
    const result = await getAITaskSuggestions({ context: data });
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

  const handleAddTask = (task: SuggestedTask) => {
    onTaskAdd(task);
    toast({
        title: 'Task Added!',
        description: `"${task.title}" has been added to your to-do list.`,
    });
    // Remove the added task from the suggestion list
    setSuggestions(prev => prev.filter(s => s.title !== task.title));
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
            AI-Powered Task Suggestions
          </DialogTitle>
          <DialogDescription>
            Based on your goals and plans, here are a few tasks the AI suggests for today.
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
                {suggestions.map((task, index) => (
                <Card key={index} className="bg-white dark:bg-card">
                    <CardHeader>
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-grow">
                                <div className="flex gap-2">
                                  <Badge variant="secondary" className="mb-2">{task.category}</Badge>
                                  <Badge variant="outline" className="mb-2">{task.priority} Priority</Badge>
                                </div>
                                <CardTitle className="text-lg">{task.title}</CardTitle>
                            </div>
                            <Button size="sm" onClick={() => handleAddTask(task)}>
                                <Plus className="mr-2 h-4 w-4" /> Add Task
                            </Button>
                        </div>
                    </CardHeader>
                    {task.description && (
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{task.description}</p>
                        </CardContent>
                    )}
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
