
'use client';

import { useState } from 'react';
import type { JobApplication, ResumeData } from '@/lib/types';
import type { SuggestedJobApplication } from '@/ai/flows/generate-job-suggestions';
import { getAIJobSuggestions } from '@/app/actions';

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
import { BrainCircuit, Sparkles, Loader2, Plus, Briefcase, MapPin, Clock, IndianRupee, ListChecks, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface AiJobSuggestionDialogProps {
  resumeData: ResumeData | null | undefined;
  onAddApplication: (application: Omit<JobApplication, 'date' | 'status'>) => void;
  children: React.ReactNode;
}

export default function AiJobSuggestionDialog({ resumeData, onAddApplication, children }: AiJobSuggestionDialogProps) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedJobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
    const result = await getAIJobSuggestions({ resume: resumeData });
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
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BrainCircuit className="text-primary" />
            AI-Powered Job Suggestions
          </DialogTitle>
          <DialogDescription>
            Based on your resume, here are a few job openings the AI thinks are a good fit.
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
                {suggestions.map((job, index) => (
                <Card key={index} className="bg-muted/50">
                    <CardHeader>
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-grow">
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <Briefcase className="h-5 w-5" />
                                  <div>
                                    {job.role}
                                    <span className="text-base font-normal text-muted-foreground"> at {job.company}</span>
                                  </div>
                                </CardTitle>
                            </div>
                            <Button size="sm" onClick={() => handleAddApplication(job)}>
                                <Plus className="mr-2 h-4 w-4" /> Add to Tracker
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4"/> {job.location}</div>
                            <div className="flex items-center gap-1.5"><Clock className="h-4 w-4"/> {job.jobType}</div>
                            {job.salaryRange && <div className="flex items-center gap-1.5"><IndianRupee className="h-4 w-4"/> {job.salaryRange}</div>}
                        </div>
                        <p className="text-sm"><strong className="text-foreground">Why it's a fit:</strong> {job.reasoning}</p>
                        
                        {(job.keyResponsibilities || job.requiredSkills) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                {job.keyResponsibilities && job.keyResponsibilities.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-1 flex items-center gap-2"><ListChecks className="h-4 w-4"/> Key Responsibilities</h4>
                                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                            {job.keyResponsibilities.map((resp, i) => <li key={i}>{resp}</li>)}
                                        </ul>
                                    </div>
                                )}
                                {job.requiredSkills && job.requiredSkills.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-1 flex items-center gap-2"><Star className="h-4 w-4"/> Required Skills</h4>
                                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                            {job.requiredSkills.map((skill, i) => <li key={i}>{skill}</li>)}
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
                <div className="text-center py-16">
                    <p className="text-muted-foreground">No new suggestions at the moment.</p>
                </div>
            )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleGenerate} disabled={isLoading || !resumeData}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Generating...</> : 'Regenerate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
