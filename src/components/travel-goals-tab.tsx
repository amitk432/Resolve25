
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import type { AppData, Goal, TravelGoal } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Trash2, CalendarIcon, Wand2, Loader2, ArrowRight, Plane, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import AiSuggestionSection from './ai-suggestion-section';
import type { GenerateTravelItineraryOutput } from '@/lib/types';
import { getTravelItinerary } from '@/app/actions';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

interface TravelGoalsTabProps {
  travelGoals: TravelGoal[];
  onAddGoal: (goal: Omit<TravelGoal, 'id' | 'image'> & { travelDate: Date | null }) => void;
  onDeleteGoal: (id: string) => void;
  onUpdate: (updater: (draft: AppData) => void) => void;
}

const ItineraryDialog = ({ destination, onAddItineraryGoal }: { destination: string, onAddItineraryGoal: (attraction: string) => void }) => {
    const [open, setOpen] = useState(false);
    const [itinerary, setItinerary] = useState<GenerateTravelItineraryOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleGenerate = async () => {
        setIsLoading(true);
        setItinerary(null);
        const result = await getTravelItinerary({ destination });
        setIsLoading(false);

        if (result && 'error' in result) {
            toast({ variant: 'destructive', title: 'Error generating itinerary', description: result.error });
        } else if (result) {
            setItinerary(result);
        }
    };

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (isOpen && !itinerary) {
            handleGenerate();
        }
    };
    
    const itinerarySections = itinerary ? [itinerary.flights, itinerary.accommodation, itinerary.attractions, itinerary.budgetTips] : [];

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Wand2 className="mr-2 h-4 w-4" />
                    AI Itinerary
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>AI-Powered Itinerary for {destination}</DialogTitle>
                    <DialogDescription>
                        Here's a budget-friendly travel plan to get you started. You can add attractions to your main goals.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-grow overflow-y-auto pr-4 -mr-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-16">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        </div>
                    ) : itinerary ? (
                        <Accordion type="multiple" defaultValue={itinerarySections.map(s => s.title)} className="w-full space-y-4">
                            {itinerarySections.map((section, sectionIndex) => (
                                <AccordionItem key={sectionIndex} value={section.title} className="border rounded-lg bg-muted/50">
                                    <AccordionTrigger className="p-4 hover:no-underline text-lg">
                                        {section.title}
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-6">
                                        <ul className="space-y-2 list-none text-muted-foreground">
                                        {(section.tips || section.places).map((item: string, i: number) => (
                                             <li key={i} className="flex items-start justify-between gap-3 group">
                                                <div className="flex items-start gap-3 flex-grow">
                                                    <ArrowRight className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                                                    <span>{item}</span>
                                                </div>
                                                {section.title.includes("Attractions") && (
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => onAddItineraryGoal(item)}>
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </li>
                                        ))}
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <p className="text-center text-muted-foreground py-16">Could not generate an itinerary.</p>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleGenerate} disabled={isLoading}>
                        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Generating...</> : 'Regenerate'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
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


const TravelGoalItem = ({ goal, onDeleteGoal, onAddItineraryGoal }: { goal: TravelGoal, onDeleteGoal: (id: string) => void, onAddItineraryGoal: (attraction: string) => void }) => {
    return (
        <div className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg bg-background hover:bg-muted/30 transition-colors">
            <div className="w-full md:w-1/3 lg:w-1/4 shrink-0">
                <Image 
                    src={goal.image} 
                    alt={goal.destination} 
                    width={400} 
                    height={250} 
                    className="rounded-lg object-cover w-full aspect-[16/10]" 
                    data-ai-hint={goal.destination.split(',')[0].toLowerCase()} 
                />
            </div>
            <div className="flex-grow flex flex-col">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-semibold">{goal.destination}</h3>
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
                    </div>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
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
                </div>
                {goal.notes && <p className="mt-2 text-sm text-muted-foreground flex-grow">{goal.notes}</p>}
                {goal.status === 'Planned' && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                        <ItineraryDialog destination={goal.destination} onAddItineraryGoal={onAddItineraryGoal} />
                    </div>
                )}
            </div>
        </div>
    );
}

export default function TravelGoalsTab({ travelGoals, onAddGoal, onDeleteGoal, onUpdate }: TravelGoalsTabProps) {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const [minDate, setMinDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    setMinDate(new Date());
  }, []);

  const form = useForm<z.infer<typeof travelGoalSchema>>({
    resolver: zodResolver(travelGoalSchema),
    defaultValues: {
      destination: '',
      status: 'Planned',
      travelDate: null,
      notes: '',
    },
  });
  
  const status = form.watch('status');

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
  
  const handleAddItineraryAsGoal = (attraction: string) => {
    onUpdate(draft => {
        const newGoal: Goal = {
            id: `goal-itinerary-${Date.now()}`,
            title: attraction,
            description: 'An activity from a planned trip.',
            category: 'Personal',
            deadline: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString(),
            steps: [
                { id: `step-${Date.now()}-1`, text: 'Research details and booking options', completed: false },
                { id: `step-${Date.now()}-2`, text: 'Book or schedule the activity', completed: false },
            ]
        };
        draft.goals.push(newGoal);
    });
    toast({
      title: 'Goal Added!',
      description: `"${attraction}" has been added to your goals.`,
    });
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
        <div className="space-y-4">
            {travelGoals.map(goal => (
                <TravelGoalItem 
                    key={goal.id} 
                    goal={goal} 
                    onDeleteGoal={onDeleteGoal}
                    onAddItineraryGoal={handleAddItineraryAsGoal}
                />
            ))}
        </div>
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
