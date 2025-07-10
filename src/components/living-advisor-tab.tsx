
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { AppData } from '@/lib/types';
import { getRelocationAdvice, getRelocationRoadmap } from '@/app/actions';
import { RelocationQuestionnaireSchema, type RelocationQuestionnaire, type CountryRecommendation, type RelocationRoadmapOutput } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Wand2, Star, ThumbsUp, ThumbsDown, ArrowRight, FileText, CheckCircle, Info, Home, Briefcase, Users, Languages, Map } from 'lucide-react';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface LivingAdvisorTabProps {
  data: AppData;
  onUpdate: (updater: (draft: AppData) => void) => void;
}

const RelocationRoadmapView = ({ roadmap }: { roadmap: RelocationRoadmapOutput }) => {
    const sections = [
        { icon: <FileText className="h-5 w-5" />, data: roadmap.visa, type: 'steps' },
        { icon: <Home className="h-5 w-5" />, data: roadmap.housing, type: 'options' },
        { icon: <Briefcase className="h-5 w-5" />, data: roadmap.jobSearch, type: 'strategies' },
        { icon: <Users className="h-5 w-5" />, data: roadmap.culturalAdaptation, type: 'tips' },
        { icon: <Info className="h-5 w-5" />, data: roadmap.localResources, type: 'resources' },
    ];

    return (
        <div className="space-y-4 mt-6">
            {sections.map((section, index) => (
                <Card key={index}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            {section.icon} {section.data.title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc list-outside pl-5 space-y-2 text-muted-foreground">
                            {section.data[section.type as keyof typeof section.data].map((item: string, i: number) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};


export default function LivingAdvisorTab({ data, onUpdate }: LivingAdvisorTabProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [recommendations, setRecommendations] = useState<CountryRecommendation[]>(data.livingAdvisor?.recommendations || []);
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
    const [roadmap, setRoadmap] = useState<RelocationRoadmapOutput | null>(null);
    const [isRoadmapLoading, setRoadmapLoading] = useState(false);
    const [feedback, setFeedback] = useState('');

    const form = useForm<RelocationQuestionnaire>({
        resolver: zodResolver(RelocationQuestionnaireSchema),
        defaultValues: data.livingAdvisor?.questionnaire || {
            currentProfession: '',
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
            if (!draft.livingAdvisor) {
                draft.livingAdvisor = { questionnaire: values, recommendations: [] };
            } else {
                draft.livingAdvisor.questionnaire = values;
            }
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
            onUpdate(draft => {
                if (draft.livingAdvisor) {
                    draft.livingAdvisor.recommendations = result.recommendations;
                }
            });
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
    
    const handleFeedbackSubmit = () => {
        // This is where you would send the feedback to your backend/analytics
        console.log("Feedback submitted:", feedback);
        toast({ title: 'Thank you for your feedback!' });
        setFeedback('');
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-foreground">Global Living Advisor</h2>
                <p className="mt-1 text-muted-foreground">Discover your next home abroad with AI-powered relocation advice.</p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Your Relocation Profile</CardTitle>
                    <CardDescription>Fill out this questionnaire to get personalized country recommendations. Your resume details will also be used if available.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="currentProfession" render={({ field }) => (
                                    <FormItem><FormLabel>Current Profession</FormLabel><FormControl><Input placeholder="e.g., Software Engineer" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="familySize" render={({ field }) => (
                                    <FormItem><FormLabel>Family Size (including yourself)</FormLabel><FormControl><Input type="number" min="1" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))}/></FormControl><FormMessage /></FormItem>
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
                                <FormField control={form.control} name="languageSkills" render={({ field }) => (
                                    <FormItem><FormLabel>Language Skills</FormLabel><FormControl><Input placeholder="e.g., English (Fluent), French (Basic)" {...field} /></FormControl><FormMessage /></FormItem>
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
                            </div>
                            <FormField control={form.control} name="careerGoals" render={({ field }) => (
                                <FormItem><FormLabel>Primary Career Goals for Relocation</FormLabel><FormControl><Textarea placeholder="e.g., Leadership roles in fintech, starting my own consultancy, higher earning potential..." {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <Button type="submit" disabled={isLoading}>
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
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-4">
                                            <Map className="h-8 w-8 text-primary"/>
                                            <div>
                                                <h4 className="text-lg font-semibold text-left">{rec.country}</h4>
                                                <p className="text-sm text-muted-foreground text-left">{rec.summary}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 pr-4">
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
                                            {isRoadmapLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
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
                                <CardTitle>Relocation Roadmap for {selectedCountry}</CardTitle>
                                <CardDescription>Your personalized step-by-step guide to moving to {selectedCountry}.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isRoadmapLoading && (
                                    <div className="flex items-center justify-center p-8">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <p className="ml-4 text-muted-foreground">Building your roadmap...</p>
                                    </div>
                                )}
                                {roadmap && <RelocationRoadmapView roadmap={roadmap} />}
                            </CardContent>
                        </Card>
                    )}

                    <Card className="mt-8 bg-muted/50">
                        <CardHeader>
                            <CardTitle>Improve Our Recommendations</CardTitle>
                            <CardDescription>Your feedback helps our AI get smarter. Was this advice helpful? What could be better?</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="e.g., The recommendations were great, but I'd love to see more about visa costs..."/>
                                <Button onClick={handleFeedbackSubmit} disabled={!feedback.trim()}>Submit Feedback</Button>
                            </div>
                        </CardContent>
                    </Card>

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
