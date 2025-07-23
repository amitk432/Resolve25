
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { AppData, RoadmapMilestone, RelocationQuestionnaire, CountryRecommendation, RelocationRoadmapOutput } from '@/lib/types';
import { getRelocationAdvice, getRelocationRoadmap } from '@/app/actions';
import { RelocationQuestionnaireSchema } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Wand2, Star, ThumbsUp, ThumbsDown, ArrowRight, FileText, CheckCircle, Info, Home, Briefcase, Users, Languages, Map, Target, Plus, Send } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Checkbox } from './ui/checkbox';


const RoadmapView = ({ roadmap, country, onAddToGoals }: { roadmap: RelocationRoadmapOutput, country: string, onAddToGoals: (milestone: RoadmapMilestone) => void }) => {
    return (
        <div className="space-y-6">
            <Accordion type="multiple" defaultValue={['item-0', 'item-1']} className="w-full space-y-4">
                {[roadmap.visa, roadmap.career, roadmap.housing, roadmap.cultural, roadmap.resources].map((section, index) => (
                    <AccordionItem value={`item-${index}`} key={index} className="border rounded-lg bg-background">
                        <AccordionTrigger className="p-4 hover:no-underline text-lg">
                            <div className="flex items-center gap-3">
                                {section.title.includes("Visa") && <FileText className="h-5 w-5" />}
                                {(section.title.includes("Career") || section.title.includes("Study")) && <Briefcase className="h-5 w-5" />}
                                {section.title.includes("Housing") && <Home className="h-5 w-5" />}
                                {section.title.includes("Cultural") && <Users className="h-5 w-5" />}
                                {section.title.includes("Resources") && <Info className="h-5 w-5" />}
                                {section.title}
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                             <ul className="space-y-3">
                                {'points' in section && section.points.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-muted-foreground">
                                        <ArrowRight className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                                {'milestones' in section && section.milestones.map((item, i) => (
                                     <li key={i} className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-accent/30">
                                        <div className="flex-grow">
                                            <span className="font-semibold text-foreground">{item.milestone}</span>
                                            <p className="text-xs">Timeline: {item.timeline}</p>
                                            <p className="text-xs mt-1">Resources: {item.resources}</p>
                                        </div>
                                        <Button size="sm" variant="outline" onClick={() => onAddToGoals(item)}>
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
    );
};


export default function LivingAdvisorTab({ data, onUpdate }: { data: AppData; onUpdate: (updater: (draft: AppData) => void) => void; }) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [recommendations, setRecommendations] = useState<CountryRecommendation[]>([]);
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
    const [roadmap, setRoadmap] = useState<RelocationRoadmapOutput | null>(null);
    const [isRoadmapLoading, setRoadmapLoading] = useState(false);

    const form = useForm<RelocationQuestionnaire>({
        resolver: zodResolver(RelocationQuestionnaireSchema),
        defaultValues: data.livingAdvisor?.questionnaire || {
            reasonForRelocation: 'Jobs',
            familySize: 1,
            lifestyle: 'City',
            languageSkills: '',
            climatePreference: 'No Preference',
            workLifeBalance: 'Balanced',
            careerGoals: '',
        },
    });

    const onSubmit = async (values: RelocationQuestionnaire) => {
        setIsLoading(true);
        setRecommendations([]);
        setSelectedCountry(null);
        setRoadmap(null);

        onUpdate(draft => {
            draft.livingAdvisor.questionnaire = values;
        });

        const result = await getRelocationAdvice({
            resume: data.resume,
            questionnaire: values,
        });

        setIsLoading(false);

        if (result && 'error' in result) {
            toast({
                variant: 'destructive',
                title: 'Error Generating Advice',
                description: result.error,
            });
        } else if (result) {
            setRecommendations(result.recommendations);
            toast({
                title: 'Recommendations Ready!',
                description: 'We have generated a list of suitable countries for you.',
            });
        }
    };
    
    const handleGetRoadmap = async (country: string) => {
        setSelectedCountry(country);
        setRoadmap(null);
        setRoadmapLoading(true);

        const result = await getRelocationRoadmap({
            country,
            profile: {
                resume: data.resume,
                questionnaire: form.getValues(),
            },
        });
        
        setRoadmapLoading(false);
        if (result && 'error' in result) {
            toast({ variant: 'destructive', title: 'Error Generating Roadmap', description: result.error });
        } else if (result) {
            setRoadmap(result);
        }
    };
    
    const handleAddGoal = (milestone: RoadmapMilestone) => {
        onUpdate(draft => {
            draft.goals.push({
                id: `goal-roadmap-${Date.now()}-${Math.random()}`,
                title: milestone.milestone,
                description: `A step towards relocating. Timeline: ${milestone.timeline}. Resources: ${milestone.resources}`,
                category: 'Career',
                deadline: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString(), // Default 6 month deadline
                steps: [
                    { id: `step-${Date.now()}-1`, text: `Research: ${milestone.resources}`, completed: false },
                    { id: `step-${Date.now()}-2`, text: `Take initial action for '${milestone.milestone}'`, completed: false },
                ]
            });
        });
        toast({
            title: `Goal Added: "${milestone.milestone}"`,
            description: "Check your 'Goals' tab to track your progress.",
        });
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-foreground">Global Living Advisor</h2>
                <p className="mt-1 text-base text-muted-foreground">Discover your next home abroad with AI-powered relocation advice.</p>
            </div>
            
            <Card className="bg-white dark:bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-primary">Your Relocation Profile</CardTitle>
                    <CardDescription className="text-base text-muted-foreground">Fill out this questionnaire to get personalized country recommendations. Your resume details will be used automatically.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="reasonForRelocation" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Primary Reason for Relocation</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="Jobs">Jobs / Career</SelectItem>
                                                <SelectItem value="Study">Study / Education</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="familySize" render={({ field }) => (
                                    <FormItem><FormLabel>Family Size (including yourself)</FormLabel><FormControl><Input type="number" min="1" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 1)}/></FormControl><FormMessage /></FormItem>
                                )} />
                                 <FormField control={form.control} name="lifestyle" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Preferred Lifestyle</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="City">Bustling City</SelectItem>
                                                <SelectItem value="Suburban">Quiet Suburban</SelectItem>
                                                <SelectItem value="Rural">Peaceful Rural</SelectItem>
                                                <SelectItem value="Flexible">Flexible</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="climatePreference" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Climate Preference</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="Warm">Warm</SelectItem>
                                                <SelectItem value="Cold">Cold</SelectItem>
                                                <SelectItem value="Temperate">Temperate / Four Seasons</SelectItem>
                                                <SelectItem value="No Preference">No Preference</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="workLifeBalance" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Work-Life Balance</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="Priority">Top Priority</SelectItem>
                                                <SelectItem value="Important">Important</SelectItem>
                                                <SelectItem value="Balanced">Balanced</SelectItem>
                                                <SelectItem value="Flexible">Flexible</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="languageSkills" render={({ field }) => (
                                    <FormItem><FormLabel>Language Skills</FormLabel><FormControl><Input placeholder="e.g., English (Fluent), French (Basic)" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                            
                            <FormField control={form.control} name="careerGoals" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Primary Goals for Relocation</FormLabel>
                                    <FormControl><Textarea placeholder="e.g., Leadership roles in fintech, pursuing a Master's degree, higher earning potential..." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <Button type="submit" disabled={isLoading || !data.resume}>
                                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Analyzing...</> : <><Wand2 className="mr-2 h-4 w-4"/>Get Recommendations</>}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {isLoading && (
                <div className="flex items-center justify-center p-16">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="ml-4 text-muted-foreground">Analyzing your profile to find the best countries...</p>
                </div>
            )}

            {recommendations.length > 0 && (
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-foreground">Top Country Recommendations</h3>
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {recommendations.map((rec, index) => (
                            <AccordionItem value={`item-${index}`} key={index} className="border rounded-lg bg-background">
                                <AccordionTrigger className="p-4 hover:no-underline">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4">
                                        <div className="flex items-start sm:items-center gap-4 flex-1">
                                            <Map className="h-8 w-8 text-primary mt-1 sm:mt-0 flex-shrink-0"/>
                                            <div className="text-left">
                                                <h4 className="text-lg font-semibold">{rec.country}</h4>
                                                <p className="text-sm text-muted-foreground">{rec.summary}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 self-start sm:self-center ml-12 sm:ml-0">
                                            <Star className="h-5 w-5 text-yellow-500"/>
                                            <span className="text-xl font-bold">{rec.suitabilityScore}</span>
                                            <span className="text-xs text-muted-foreground">/100</span>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-4 pt-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div className="space-y-2">
                                            <h5 className="font-semibold flex items-center gap-2 text-green-600"><ThumbsUp/>Pros</h5>
                                            <ul className="list-disc list-outside pl-5 space-y-1 text-sm text-muted-foreground">
                                                {rec.pros.map((pro, i) => <li key={i}>{pro}</li>)}
                                            </ul>
                                        </div>
                                        <div className="space-y-2">
                                            <h5 className="font-semibold flex items-center gap-2 text-red-600"><ThumbsDown/>Cons</h5>
                                            <ul className="list-disc list-outside pl-5 space-y-1 text-sm text-muted-foreground">
                                                {rec.cons.map((con, i) => <li key={i}>{con}</li>)}
                                            </ul>
                                        </div>
                                    </div>
                                    
                                    {selectedCountry !== rec.country && (
                                        <Button onClick={() => handleGetRoadmap(rec.country)} disabled={isRoadmapLoading}>
                                            {isRoadmapLoading && selectedCountry === rec.country ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                            Create Relocation Roadmap <ArrowRight className="ml-2 h-4 w-4"/>
                                        </Button>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                    
                    {selectedCountry && (
                        <Card className="mt-8">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                  <Target />
                                  Relocation Roadmap for {selectedCountry}
                                </CardTitle>
                                <CardDescription>Your personalized step-by-step guide to moving to {selectedCountry}. Select milestones to add them to your goals.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isRoadmapLoading && (
                                    <div className="flex items-center justify-center p-8">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <p className="ml-4 text-muted-foreground">Building your roadmap...</p>
                                    </div>
                                )}
                                {roadmap && <RoadmapView roadmap={roadmap} country={selectedCountry} onAddToGoals={handleAddGoal} />}
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
            
            {!isLoading && !data.resume && (
                <Alert variant="default" className="mt-8">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Get Even Better Recommendations!</AlertTitle>
                  <AlertDescription>
                    The AI can provide more accurate relocation advice if you add your resume. Go to the "Job Search" tab to upload or fill out your resume details.
                  </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
