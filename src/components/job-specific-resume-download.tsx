'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, FileText, Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { generateJobSpecificResumeAction } from '@/app/actions';
import EditableResumeDialog from './editable-resume-dialog';
import type { ResumeData, JobApplication } from '@/lib/types';

interface JobSpecificResumeDownloadProps {
  jobApplication: JobApplication;
  baseResume: ResumeData;
  children?: React.ReactNode;
}

export default function JobSpecificResumeDownload({ 
  jobApplication, 
  baseResume,
  children 
}: JobSpecificResumeDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [customizedResume, setCustomizedResume] = useState<ResumeData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Add safety check for baseResume
  if (!baseResume) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              disabled
              size="sm"
              className="h-7 text-xs bg-gray-400 text-white border-0 cursor-not-allowed"
            >
              No Resume Data
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Please upload your resume first in the profile section
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const handleGenerateAndEdit = async () => {
    setIsGenerating(true);
    
    try {
      console.log('🔍 Base resume data:', baseResume);
      
      // Create job description from available data
      const jobDescription = [
        jobApplication.requiredSkills ? `Required Skills: ${jobApplication.requiredSkills.join(', ')}` : '',
        jobApplication.keyResponsibilities ? `Key Responsibilities: ${jobApplication.keyResponsibilities.join(', ')}` : '',
        jobApplication.salaryRange ? `Salary Range: ${jobApplication.salaryRange}` : '',
        jobApplication.jobType ? `Job Type: ${jobApplication.jobType}` : '',
      ].filter(Boolean).join('\n');

      const result = await generateJobSpecificResumeAction(
        baseResume,
        jobApplication,
        jobDescription || undefined
      );

      if ('error' in result) {
        throw new Error(result.error);
      }

      console.log('🔍 Generated resume data:', result);
      setCustomizedResume(result);
      setIsDialogOpen(true);

      toast({
        title: "Resume Generated",
        description: `AI has customized your resume for ${jobApplication.company}. You can now edit and download it.`,
      });
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {children ? (
              <div onClick={handleGenerateAndEdit}>
                {children}
              </div>
            ) : (
              <Button
                onClick={handleGenerateAndEdit}
                disabled={isGenerating}
                size="icon"
                className="h-8 w-8 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <div className="relative">
                    <FileText className="w-4 h-4" />
                    <Sparkles className="w-2 h-2 absolute -top-1 -right-1 text-teal-300" />
                  </div>
                )}
              </Button>
            )}
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs max-w-48">
            Generate and edit a job-specific resume tailored for this position
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Editable Resume Dialog */}
      {customizedResume && (
        <EditableResumeDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          initialResume={customizedResume}
          jobApplication={jobApplication}
          baseResume={baseResume}
        />
      )}
    </>
  );
}
