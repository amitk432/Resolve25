'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, CalendarPlus } from 'lucide-react';
import type { MonthlyPlan } from '@/lib/types';

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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const planSchema = z.object({
  month: z.string().min(3, 'Month and year must be at least 3 characters long. e.g. "July 2025"'),
  theme: z.string().min(3, 'Theme must be at least 3 characters long.'),
});

interface AddMonthlyPlanDialogProps {
  onPlanAdd: (plan: Omit<MonthlyPlan, 'tasks'>) => void;
}

export default function AddMonthlyPlanDialog({ onPlanAdd }: AddMonthlyPlanDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof planSchema>>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      month: '',
      theme: '',
    },
  });

  const onSubmit = (values: z.infer<typeof planSchema>) => {
    onPlanAdd(values);
    toast({
      title: 'Monthly Plan added!',
      description: `Your plan for "${values.month}" has been created.`,
    });
    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="mr-2 h-4 w-4" /> Add Plan
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus />
            Create a New Monthly Plan
          </DialogTitle>
          <DialogDescription>
            Set up a new monthly plan. You can add specific tasks after creating it.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="month"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Month & Year</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., September 2025" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Theme</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Focus on Fitness" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="mt-4">
              <Button type="submit">Create Plan</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
