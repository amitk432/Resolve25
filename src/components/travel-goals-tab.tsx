
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import type { TravelGoal } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Trash2, CalendarIcon, CheckCircle, MapPin, Plane } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import AiSuggestionSection from './ai-suggestion-section';

interface TravelGoalsTabProps {
  travelGoals: TravelGoal[];
  onAddGoal: (goal: Omit<TravelGoal, 'id' | 'image'> & { travelDate: Date | null }) => void;
  onDeleteGoal: (id: string) => void;
}

const travelGoalSchema = z.object({
  destination: z.string().min(3, 'Destination must be at least 3 characters.'),
  status: z.enum(['Completed', 'Planned']),
  travelDate: z.date().nullable().optional(),
  notes: z.string().optional(),
}).refine(data => {
    if (data.status === 'Planned' && !data.travelDate) {
        return false;
    }
    return true;
}, {
    message: 'A travel date is required for planned trips.',
    path: ['travelDate'],
});

export default function TravelGoalsTab({ travelGoals, onAddGoal, onDeleteGoal }: TravelGoalsTabProps) {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const [minDate, setMinDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    // Set minDate for calendar only on client-side to prevent hydration errors
    setMinDate(new Date());
  }, []);

  const form = useForm<z.infer<typeof travelGoalSchema>>({
    resolver: zodResolver(travelGoalSchema),
    defaultValues: {
      destination: '',
      status: 'Planned',
      travelDate: null, // Initialize with null to prevent hydration mismatch
      notes: '',
    },
  });
  
  const status = form.watch('status');

  // When dialog opens, reset form with fresh values on the client
  useEffect(() => {
    if (isDialogOpen) {
      form.reset({
        destination: '',
        status: 'Planned',
        travelDate: new Date(),
        notes: '',
      });
    }
  }, [isDialogOpen, form]);

  const onSubmit = (values: z.infer<typeof travelGoalSchema>) => {
    onAddGoal({
        destination: values.destination,
        status: values.status,
        notes: values.notes,
        travelDate: values.status === 'Planned' ? values.travelDate! : null
    });
    setDialogOpen(false);
    form.reset();
  };

  return (
    <div>
      <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
            <h2 className="text-2xl font-bold text-foreground">Travel Goals & Wishlist</h2>
            <p className="mt-1 text-muted-foreground">Dream, plan, and cherish your adventures.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto"><Plus className="mr-2" /> Add Travel Goal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a New Travel Goal</DialogTitle>
              <DialogDescription>
                Add a past adventure or plan your next one.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="destination" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination</FormLabel>
                    <FormControl><Input placeholder="e.g., Goa, India" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                        <FormItem className="flex items-center space-x-2">
                          <FormControl><RadioGroupItem value="Planned" id="planned" /></FormControl>
                          <FormLabel htmlFor="planned" className="font-normal">Planned</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2">
                          <FormControl><RadioGroupItem value="Completed" id="completed" /></FormControl>
                          <FormLabel htmlFor="completed" className="font-normal">Completed</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )} />

                {status === 'Planned' && (
                  <FormField control={form.control} name="travelDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Travel Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "dd-MMMM-yyyy") : <span>Pick a date</span>}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={field.value ?? undefined} onSelect={field.onChange} initialFocus disabled={minDate ? { before: minDate } : true} />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}

                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl><Textarea placeholder="e.g., Book flights, check visa requirements..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button type="submit">Add Goal</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {travelGoals.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <Plane className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-lg font-medium">No Travel Goals Yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Click "Add Travel Goal" to start your wishlist.</p>
        </div>
      ) : (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {travelGoals.map(goal => (
                <Card key={goal.id} className="flex flex-col overflow-hidden">
                <CardHeader className="relative p-0">
                    <Image src={goal.image} alt={goal.destination} width={400} height={250} className="rounded-t-lg object-cover aspect-[16/10]" data-ai-hint={goal.destination.split(',')[0].toLowerCase()} />
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Travel Goal?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete your goal to travel to "{goal.destination}".
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDeleteGoal(goal.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardHeader>
                <CardContent className="pt-4 flex-grow">
                    <CardTitle>{goal.destination}</CardTitle>
                    {goal.status === 'Completed' ? (
                    <div className="text-sm font-medium text-green-600 dark:text-green-500 flex items-center mt-1">
                        <CheckCircle className="mr-1.5 h-4 w-4" />
                        Completed
                    </div>
                    ) : (
                    goal.travelDate && <div className="text-sm text-muted-foreground mt-1">
                        <span className="font-semibold text-primary">Planned for:</span> {format(new Date(goal.travelDate), 'dd-MMMM-yyyy')}
                    </div>
                    )}
                    {goal.notes && <CardDescription className="mt-2 text-sm">{goal.notes}</CardDescription>}
                </CardContent>
                </Card>
            ))}
            </div>
        </>
      )}
      <AiSuggestionSection
          moduleName="Travel"
          title="AI Travel Assistant"
          description="Discover new destinations or get tips for your planned trips."
          contextData={{ travelGoals }}
          showInput={true}
      />
    </div>
  );
}
