
'use client';

import { useState } from 'react';
import type { JobApplication, ResumeData } from '@/lib/types';
import type { SuggestedJobApplication } from '@/ai/flows/generate-job-suggestions';
import { getAIJobSuggestions } from '@/app/actions';
import { useUserPreferences } from '@/contexts/user-preferences-context';

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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { BrainCircuit, Sparkles, Loader2, Plus, Briefcase, MapPin, Clock, IndianRupee, ListChecks, Star, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface AiJobSuggestionDialogProps {
  resumeData: ResumeData | null | undefined;
  onAddApplication: (application: Omit<JobApplication, 'status'>) => void;
  children: React.ReactNode;
  existingApplications?: JobApplication[];
}

export default function AiJobSuggestionDialog({ resumeData, onAddApplication, children, existingApplications = [] }: AiJobSuggestionDialogProps) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedJobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { preferences } = useUserPreferences(); // Add user preferences
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!resumeData) {
        toast({
            variant: 'destructive',
            title: 'Resume Data Missing',
            description: 'Please add your resume details first to get AI suggestions.',
        });
        return;
    }
    setIsLoading(true);
    setSuggestions([]);
    const result = await getAIJobSuggestions({ 
      resume: resumeData, 
      userPreferences: preferences,
      existingApplications: existingApplications
    });
    setIsLoading(false);

    if (result && 'error' in result) {
      toast({
        variant: 'destructive',
        title: 'Error Generating Suggestions',
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

  const handleAddApplication = (job: SuggestedJobApplication) => {
    onAddApplication({
        ...job,
        date: new Date().toISOString(), // Add current date for AI suggestions
        source: 'AI'
    });
    toast({
        title: 'Job Added!',
        description: `"${job.role} at ${job.company}" has been added to your tracker.`,
    });
    setSuggestions(prev => prev.filter(s => s.company !== job.company || s.role !== job.role));
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <BrainCircuit className="text-primary h-5 w-5" />
            AI Job Suggestions
            {preferences.jobLocationPreference === 'worldwide' && (
              <Badge variant="secondary" className="ml-2">
                <Globe className="h-3 w-3 mr-1" />
                Global Search
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-sm">
            AI-curated job matches based on your resume and preferences
            {preferences.jobLocationPreference === 'worldwide' && (
              <span className="block mt-1 text-blue-600">
                🌍 Searching worldwide for international opportunities with visa sponsorship
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-4 -mr-4">
            {isLoading && (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            )}
            {!isLoading && suggestions.length > 0 && (
            <div className="space-y-3">
                {suggestions.map((job, index) => (
                <Card key={index} className="bg-white dark:bg-card">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start gap-3">
                            <div className="flex-grow">
                                <CardTitle className="text-base flex items-center gap-2">
                                  <Briefcase className="h-4 w-4" />
                                  <div>
                                    {job.role}
                                    <span className="text-sm font-normal text-muted-foreground"> at {job.company}</span>
                                  </div>
                                </CardTitle>
                            </div>
                            <Button size="sm" onClick={() => handleAddApplication(job)} className="h-7 text-xs">
                                <Plus className="mr-1.5 h-3 w-3" /> Add
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1 whitespace-nowrap">
                              <MapPin className="h-3 w-3 flex-shrink-0"/> 
                              <span className="truncate">{job.location}</span>
                              {job.country && job.country !== 'India' && (
                                <Badge variant="secondary" className="ml-1 text-xs flex-shrink-0">
                                  🌍 {job.country}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 whitespace-nowrap"><Clock className="h-3 w-3 flex-shrink-0"/> {job.jobType}</div>
                            {job.workArrangement && (
                              <div className="flex items-center gap-1 whitespace-nowrap">
                                <Briefcase className="h-3 w-3 flex-shrink-0"/> {job.workArrangement}
                              </div>
                            )}
                            {job.salaryRange && (
                              <div className="flex items-center gap-1 whitespace-nowrap">
                                <IndianRupee className="h-3 w-3 flex-shrink-0"/> 
                                <span className="truncate">{job.salaryRange}</span>
                              </div>
                            )}
                        </div>
                        
                        {/* Visa Sponsorship Information */}
                        {job.visaSponsorship?.available && (
                          <div className="p-2 bg-green-50 dark:bg-green-950 rounded border border-green-200 dark:border-green-800">
                            <p className="text-xs text-green-700 dark:text-green-300 font-medium">
                              ✅ Visa Sponsorship Available
                              {job.visaSponsorship.types && (
                                <span className="block mt-1">
                                  Types: {job.visaSponsorship.types.join(', ')}
                                </span>
                              )}
                            </p>
                          </div>
                        )}
                        
                        <p className="text-xs"><strong className="text-foreground">Match reason:</strong> {job.reasoning}</p>
                        
                        {(job.keyResponsibilities || job.requiredSkills) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                {job.keyResponsibilities && job.keyResponsibilities.length > 0 && (
                                    <div>
                                        <h4 className="font-medium mb-1 flex items-center gap-1.5 text-xs"><ListChecks className="h-3 w-3"/> Responsibilities</h4>
                                        <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                                            {job.keyResponsibilities.slice(0, 3).map((resp, i) => <li key={i}>{resp}</li>)}
                                            {job.keyResponsibilities.length > 3 && <li className="text-xs opacity-70">+{job.keyResponsibilities.length - 3} more</li>}
                                        </ul>
                                    </div>
                                )}
                                {job.requiredSkills && job.requiredSkills.length > 0 && (
                                    <div>
                                        <h4 className="font-medium mb-1 flex items-center gap-1.5 text-xs"><Star className="h-3 w-3"/> Skills</h4>
                                        <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                                            {job.requiredSkills.slice(0, 3).map((skill, i) => <li key={i}>{skill}</li>)}
                                            {job.requiredSkills.length > 3 && <li className="text-xs opacity-70">+{job.requiredSkills.length - 3} more</li>}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
                ))}
            </div>
            )}
            {!isLoading && suggestions.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground text-sm">No new suggestions available</p>
                </div>
            )}
        </div>
        <DialogFooter className="pt-3">
          <Button variant="outline" onClick={handleGenerate} disabled={isLoading || !resumeData} size="sm" className="h-8 text-sm">
            {isLoading ? <><Loader2 className="mr-1.5 h-3 w-3 animate-spin"/>Generating...</> : 'Regenerate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
