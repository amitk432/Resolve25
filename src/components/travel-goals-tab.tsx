
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import type { AppData, Goal, TravelGoal, GenerateTravelItineraryOutput } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Trash2, CalendarIcon, Wand2, Loader2, ArrowRight, Plane, CheckCircle, Sparkles, Lightbulb, Target } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import AiSuggestionSection from './ai-suggestion-section';
import { getTravelItinerary, getAITravelSuggestion } from '@/app/actions';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

interface TravelGoalsTabProps {
  travelGoals: TravelGoal[];
  onAddGoal: (goal: Omit<TravelGoal, 'id'> & { travelDate: Date | null }) => void;
  onDeleteGoal: (id: string) => void;
  onUpdate: (updater: (draft: AppData) => void) => void;
}

const AISuggestionDialog = ({ onAddSuggestion }: { onAddSuggestion: (destination: string, notes: string) => void }) => {
    const [open, setOpen] = useState(false);
    const [suggestion, setSuggestion] = useState<{ destination: string; reasoning: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleGenerate = async () => {
        setIsLoading(true);
        const result = await getAITravelSuggestion({ exclude: suggestion?.destination });
        setIsLoading(false);

        if (result && 'error' in result) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else if (result) {
            setSuggestion(result);
        }
    };

    const handleAddToWishlist = () => {
        if (suggestion) {
            onAddSuggestion(suggestion.destination, `AI Suggestion: ${suggestion.reasoning}`);
            setOpen(false);
        }
    };

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (isOpen) {
            // Clear previous suggestion and fetch a new one when opening
            setSuggestion(null);
            handleGenerate();
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Sparkles className="mr-2 h-4 w-4" /> Suggest with AI
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>AI Travel Suggestion</DialogTitle>
                    <DialogDescription>
                        Let our AI suggest a destination for you based on the current season.
                    </DialogDescription>
                </DialogHeader>
                <div className="min-h-[150px] flex items-center justify-center">
                    {isLoading ? (
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    ) : suggestion ? (
                        <div className="text-center space-y-4">
                            <p className="text-2xl font-bold text-primary">{suggestion.destination}</p>
                            <p className="text-muted-foreground flex items-center justify-center gap-2">
                                <Lightbulb className="h-4 w-4 text-yellow-400" />
                                {suggestion.reasoning}
                            </p>
                        </div>
                    ) : (
                        <p>Could not generate a suggestion.</p>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleGenerate} disabled={isLoading}>
                        {isLoading ? 'Thinking...' : 'Suggest Another'}
                    </Button>
                    <Button onClick={handleAddToWishlist} disabled={!suggestion || isLoading}>
                        <Plus className="mr-2 h-4 w-4" /> Add to Wishlist
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const travelGoalSchema = z.object({
  destination: z.string().min(3, 'Destination must be at least 3 characters.'),
  status: z.enum(['Completed', 'Planned']),
  travelDate: z.date().nullable().optional(),
  duration: z.string().optional(),
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


const TravelGoalItem = ({ goal, onDeleteGoal, onGetItinerary }: { goal: TravelGoal, onDeleteGoal: (id: string) => void, onGetItinerary: (destination: string, duration: number) => void }) => {
    const imageUrl = `https://source.unsplash.com/400x250/?${encodeURIComponent(goal.destination.split(',')[0])}`;

    return (
        <div className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg bg-background hover:bg-muted/30 transition-colors">
            <div className="w-full md:w-1/3 lg:w-1/4 shrink-0">
                <Image 
                    src={imageUrl} 
                    alt={goal.destination} 
                    width={400} 
                    height={250} 
                    className="rounded-lg object-cover w-full aspect-[16/10]" 
                    data-ai-hint={goal.destination.split(',')[0].toLowerCase().replace(/\s+/g, '%20')} 
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
                             <div className="text-sm text-muted-foreground mt-1 space-x-4">
                                {goal.travelDate && <span><span className="font-semibold text-primary">Planned for:</span> {format(new Date(goal.travelDate), 'dd-MMMM-yyyy')}</span>}
                                {goal.duration && <span><span className="font-semibold text-primary">Duration:</span> {goal.duration} days</span>}
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
                        <Button variant="outline" size="sm" onClick={() => onGetItinerary(goal.destination, parseInt(goal.duration || '3'))}>
                            <Wand2 className="mr-2 h-4 w-4" />
                            AI Itinerary
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

const ItineraryView = ({ itinerary, destination, onAddItineraryGoal }: { itinerary: GenerateTravelItineraryOutput, destination: string, onAddItineraryGoal: (attraction: string) => void }) => {
    return (
        <Card className="mt-8">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Target />
                    AI-Powered Itinerary for {destination}
                </CardTitle>
                <CardDescription>
                    Your personalized, budget-friendly travel plan. You can add activities to your main goals.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <Accordion type="multiple" defaultValue={["General Tips", "Day 1"]} className="w-full space-y-4">
                         <AccordionItem value="General Tips" className="border rounded-lg bg-background">
                            <AccordionTrigger className="p-4 hover:no-underline text-lg">
                                General Tips
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6">
                                <ul className="space-y-3 list-disc list-outside pl-5 text-muted-foreground">
                                    {itinerary.generalTips.map((tip, i) => (
                                        <li key={i}>{tip}</li>
                                    ))}
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                        
                        {itinerary.dailyPlan.map((day, index) => (
                             <AccordionItem value={day.title} key={index} className="border rounded-lg bg-background">
                                <AccordionTrigger className="p-4 hover:no-underline text-lg">
                                    <div className="flex items-center gap-3">
                                        {day.title}
                                        <span className="text-sm font-normal text-muted-foreground"> - {day.theme}</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-6">
                                    <ul className="space-y-2 list-none text-muted-foreground">
                                        {day.activities.map((activity, i) => (
                                            <li key={i} className="flex items-start justify-between gap-3 group p-2 rounded-md hover:bg-muted/50">
                                                <div className="flex-grow">
                                                  <p className="font-semibold text-foreground">{activity.activity}</p>
                                                  <p className="text-sm">{activity.description}</p>
                                                </div>
                                                <Button size="sm" variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onAddItineraryGoal(activity.activity)}>
                                                    <Plus className="mr-2 h-4 w-4" /> Add Goal
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </CardContent>
        </Card>
    );
};


export default function TravelGoalsTab({ travelGoals, onAddGoal, onDeleteGoal, onUpdate }: TravelGoalsTabProps) {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const [minDate, setMinDate] = useState<Date | undefined>(undefined);
  
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [itinerary, setItinerary] = useState<GenerateTravelItineraryOutput | null>(null);
  const [isItineraryLoading, setIsItineraryLoading] = useState(false);


  useEffect(() => {
    setMinDate(new Date());
  }, []);

  const form = useForm<z.infer<typeof travelGoalSchema>>({
    resolver: zodResolver(travelGoalSchema),
    defaultValues: {
      destination: '',
      status: 'Planned',
      travelDate: null,
      duration: '3',
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
        duration: '3',
        notes: '',
      });
    }
  }, [isDialogOpen, form]);

  const onSubmit = (values: z.infer<typeof travelGoalSchema>) => {
    onAddGoal({
        destination: values.destination,
        status: values.status,
        notes: values.notes,
        travelDate: values.status === 'Planned' ? values.travelDate! : null,
        duration: values.duration
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

  const handleGetItinerary = async (destination: string, duration: number) => {
    setSelectedDestination(destination);
    setItinerary(null);
    setIsItineraryLoading(true);

    const result = await getTravelItinerary({ destination, duration });
    setIsItineraryLoading(false);

    if (result && 'error' in result) {
      toast({ variant: 'destructive', title: 'Error generating itinerary', description: result.error });
    } else if (result) {
      setItinerary(result);
    }
  };
  
  const handleAddSuggestionToWishlist = (destination: string, notes: string) => {
    onAddGoal({
        destination,
        notes,
        status: 'Planned',
        travelDate: new Date(new Date().setMonth(new Date().getMonth() + 1)), // Default to next month
        duration: '5' // Default duration for suggestions
    });
    toast({
        title: 'Suggestion Added!',
        description: `${destination} has been added to your planned trips.`
    });
  };

  return (
    <div>
      <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
            <h2 className="text-2xl font-bold text-foreground">Travel Goals & Wishlist</h2>
            <p className="mt-1 text-muted-foreground">Dream, plan, and cherish your adventures.</p>
        </div>
        <div className="flex w-full shrink-0 gap-2 sm:w-auto">
            <AISuggestionDialog onAddSuggestion={handleAddSuggestionToWishlist} />
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
                      <div className="grid grid-cols-2 gap-4">
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
                        <FormField control={form.control} name="duration" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration (days)</FormLabel>
                            <FormControl><Input type="number" placeholder="e.g., 5" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
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
                    onGetItinerary={handleGetItinerary}
                />
            ))}
        </div>
      )}
      
      {isItineraryLoading && (
        <div className="flex items-center justify-center p-8 mt-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Building your itinerary for {selectedDestination}...</p>
        </div>
      )}

      {itinerary && selectedDestination && (
        <ItineraryView 
            itinerary={itinerary} 
            destination={selectedDestination} 
            onAddItineraryGoal={handleAddItineraryAsGoal}
        />
      )}

    </div>
  );
}
