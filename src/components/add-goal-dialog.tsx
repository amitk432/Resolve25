
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Plus, Briefcase, HeartPulse, BookOpenText, Sparkles } from 'lucide-react';
import type { Goal, GoalCategory } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const goalSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long.'),
  description: z.string().optional(),
  deadline: z.date({ required_error: 'A deadline is required.' }),
  category: z.enum(['Health', 'Career', 'Personal']),
});

interface AddGoalDialogProps {
  onGoalAdd: (goal: Omit<Goal, 'id' | 'steps'>) => void;
}

const categoryIcons: Record<GoalCategory, React.ReactNode> = {
  Health: <HeartPulse className="mr-2 h-4 w-4" />,
  Career: <Briefcase className="mr-2 h-4 w-4" />,
  Personal: <BookOpenText className="mr-2 h-4 w-4" />,
};

export default function AddGoalDialog({ onGoalAdd }: AddGoalDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [minDate, setMinDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    // Set minDate for calendar only on client-side to prevent hydration errors
    setMinDate(new Date());
  }, []);
  
  const form = useForm<z.infer<typeof goalSchema>>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'Personal',
    },
  });

  const onSubmit = (values: z.infer<typeof goalSchema>) => {
    onGoalAdd(values);
    toast({
      title: 'Goal added!',
      description: `Your new goal "${values.title}" has been created.`,
    });
    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-2">
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add New Goal
          </Button>
        </DialogTrigger>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toast({
                    title: 'Coming Soon!',
                    description: 'AI-powered goal generation will be available here.',
                  });
                }}
              >
                <Sparkles className="h-4 w-4" />
                <span className="sr-only">Generate with AI</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Generate with AI</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Create a New Goal</DialogTitle>
          <DialogDescription>
            Set up a new goal to start your journey. Be specific for the best results!
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Run a 5k marathon" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe why this goal is important to you." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Deadline</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={minDate ? { before: minDate } : true}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Object.keys(categoryIcons) as GoalCategory[]).map(cat => (
                           <SelectItem key={cat} value={cat}>
                           <div className="flex items-center">{categoryIcons[cat]} {cat}</div>
                         </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="mt-4">
              <Button type="submit">Create Goal</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
