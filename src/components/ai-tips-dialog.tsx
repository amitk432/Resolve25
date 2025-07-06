'use client';

import { useState } from 'react';
import type { Goal } from '@/lib/types';
import { getAITips } from '@/app/actions';

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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { BrainCircuit, Sparkles, Loader2 } from 'lucide-react';
import { Badge } from './ui/badge';

interface AiTipsDialogProps {
  goal: Goal;
}

export default function AiTipsDialog({ goal }: AiTipsDialogProps) {
  const [open, setOpen] = useState(false);
  const [obstacle, setObstacle] = useState('');
  const [tips, setTips] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGetTips = async () => {
    if (!obstacle.trim()) {
      toast({
        variant: 'destructive',
        title: 'Obstacle cannot be empty',
        description: 'Please describe the obstacle you are facing.',
      });
      return;
    }

    setIsLoading(true);
    setTips([]);
    const result = await getAITips({ goal: goal.title, obstacle });
    setIsLoading(false);

    if ('error' in result) {
      toast({
        variant: 'destructive',
        title: 'Error generating tips',
        description: result.error,
      });
    } else {
      setTips(result.tips);
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BrainCircuit className="text-primary" />
            AI-Powered Goal Tips
          </DialogTitle>
          <DialogDescription>
            Stuck on your goal? Describe your obstacle, and our AI will provide tailored tips to help you move forward.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="font-medium">
            Your Goal: <span className="font-normal text-muted-foreground">{goal.title}</span>
          </div>
          <Textarea
            id="obstacle"
            placeholder="e.g., I'm losing motivation to go to the gym."
            value={obstacle}
            onChange={(e) => setObstacle(e.target.value)}
            className="col-span-3"
          />
        </div>

        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {tips.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold">Here are some tips for you:</h4>
            <ul className="space-y-2 list-none">
              {tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Badge variant="secondary" className="mt-1">{index + 1}</Badge>
                  <p className="text-sm text-muted-foreground">{tip}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button onClick={handleGetTips} disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Tips'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
