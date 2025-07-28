'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Download, Loader2, Save, Plus, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// ...existing code...
// ...existing code...
import ResumeTemplatePreview from './resume-template-preview';
import AiResumePreview from './ai-resume-preview';
import type { ResumeData, JobApplication } from '@/lib/types';

interface EditableResumeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialResume: ResumeData;
  jobApplication: JobApplication;
  baseResume?: ResumeData;
}

export default function EditableResumeDialog({ 
  isOpen, 
  onClose, 
  initialResume, 
  jobApplication,
  baseResume 
}: EditableResumeDialogProps) {
  // Create a fallback resume structure to prevent crashes
  const fallbackResume: ResumeData = {
    contactInfo: {
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: '+1 (555) 123-4567',
      location: 'City, State',
      linkedin: 'linkedin.com/in/johndoe',
      github: 'github.com/johndoe'
    },
    summary: {
      title: 'Professional Title',
      text: 'Professional summary text...'
    },
    skills: {
      'Technical Skills': 'Programming languages, frameworks',
      'Soft Skills': 'Communication, leadership',
      'Tools & Technologies': 'Software tools, platforms'
    },
    workExperience: [],
    projects: [],
    education: []
  };

  const [resumeData, setResumeData] = useState<ResumeData>(initialResume || fallbackResume);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const resumeRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Add safety check and update state when initialResume changes
  React.useEffect(() => {
    if (initialResume) {
      setResumeData(initialResume);
    }
  }, [initialResume]);

  // Don't render if no resume data
  if (!initialResume) {
    return null;
  }

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Find the resume preview element
      const element = document.querySelector('[data-resume-preview]') as HTMLElement;
      if (!element) {
        console.error('Resume preview element not found');
        toast({
          title: "Download Failed",
          description: "Resume preview not found. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Dynamically import html2pdf only on client side
      const html2pdf = (await import('html2pdf.js')).default;
      
      const fileName = `resume-${jobApplication?.company || 'download'}.pdf`;
      
      await html2pdf()
        .set({
          margin: 0,
          filename: fileName,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2,
            useCORS: true,
            allowTaint: true 
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        })
        .from(element)
        .save();

      toast({
        title: "Resume Downloaded",
        description: `Job-specific resume for ${jobApplication.company} has been downloaded successfully.`,
      });
      onClose();
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download the resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!jobApplication || !baseResume) {
      toast({
        title: "Error",
        description: "Cannot regenerate without job application and base resume data.",
        variant: "destructive"
      });
      return;
    }

    setIsRegenerating(true);

    try {
      // Dynamically import the action to avoid SSR issues
      const { generateJobSpecificResumeAction } = await import('@/app/actions');
      
      const result = await generateJobSpecificResumeAction(baseResume, jobApplication);
      
      if ('error' in result) {
        throw new Error(result.error);
      }

      setResumeData(result);
      
      toast({
        title: "Success",
        description: "Resume has been regenerated successfully!",
      });
    } catch (error) {
      console.error('Error regenerating resume:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to regenerate resume. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleRegenerateFromPreview = (newResumeData: ResumeData) => {
    setResumeData(newResumeData);
  };

  const updateSummary = (field: 'title' | 'text', value: string) => {
    setResumeData(prev => ({
      ...prev,
      summary: {
        ...prev.summary,
        [field]: value
      }
    }));
  };

  const updateSkills = (category: string, skills: string) => {
    setResumeData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: skills
      }
    }));
  };

  const addSkillCategory = () => {
    const newCategory = prompt('Enter skill category name:');
    if (newCategory && !resumeData.skills[newCategory]) {
      setResumeData(prev => ({
        ...prev,
        skills: {
          ...prev.skills,
          [newCategory]: ''
        }
      }));
    }
  };

  const removeSkillCategory = (category: string) => {
    setResumeData(prev => {
      const newSkills = { ...prev.skills };
      delete newSkills[category];
      return {
        ...prev,
        skills: newSkills
      };
    });
  };

  const updateWorkExperience = (index: number, field: keyof ResumeData['workExperience'][0], value: any) => {
    setResumeData(prev => ({
      ...prev,
      workExperience: prev.workExperience.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const updateDescriptionPoint = (expIndex: number, pointIndex: number, value: string) => {
    setResumeData(prev => ({
      ...prev,
      workExperience: prev.workExperience.map((exp, i) => 
        i === expIndex ? {
          ...exp,
          descriptionPoints: exp.descriptionPoints.map((point, j) => 
            j === pointIndex ? value : point
          )
        } : exp
      )
    }));
  };

  const addDescriptionPoint = (expIndex: number) => {
    setResumeData(prev => ({
      ...prev,
      workExperience: prev.workExperience.map((exp, i) => 
        i === expIndex ? {
          ...exp,
          descriptionPoints: [...exp.descriptionPoints, '']
        } : exp
      )
    }));
  };

  const removeDescriptionPoint = (expIndex: number, pointIndex: number) => {
    setResumeData(prev => ({
      ...prev,
      workExperience: prev.workExperience.map((exp, i) => 
        i === expIndex ? {
          ...exp,
          descriptionPoints: exp.descriptionPoints.filter((_, j) => j !== pointIndex)
        } : exp
      )
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pr-10">
          <div>
            <DialogTitle className="text-lg font-semibold">
              Edit Resume for {jobApplication.company} - {jobApplication.role}
            </DialogTitle>
            <DialogDescription>
              Customize your resume for this specific job application. The AI has pre-filled relevant content.
            </DialogDescription>
          </div>
          <div className="flex gap-2 mr-4">
            {baseResume && (
              <Button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                variant="outline"
                size="sm"
              >
                {isRegenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Regenerate
                  </>
                )}
              </Button>
            )}
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              size="sm"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Edit Panel */}
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Professional Summary */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Professional Summary</Label>
              <div className="space-y-2">
                <Input
                  placeholder="Professional Title"
                  value={resumeData.summary.title}
                  onChange={(e) => updateSummary('title', e.target.value)}
                  className="text-sm"
                />
                <Textarea
                  placeholder="Professional summary..."
                  value={resumeData.summary.text}
                  onChange={(e) => updateSummary('text', e.target.value)}
                  className="text-sm min-h-[80px]"
                />
              </div>
            </div>

            <Separator />

            {/* Skills */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Skills</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSkillCategory}
                  className="h-7 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Category
                </Button>
              </div>
              <div className="space-y-2">
                {Object.entries(resumeData.skills).map(([category, skills]) => (
                  <div key={category} className="flex gap-2">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs text-muted-foreground">{category}</Label>
                      <Textarea
                        placeholder={`${category} skills...`}
                        value={skills}
                        onChange={(e) => updateSkills(category, e.target.value)}
                        className="text-sm min-h-[60px]"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeSkillCategory(category)}
                      className="h-7 w-7 p-0 self-end mb-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Work Experience */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Work Experience</Label>
              <div className="space-y-4">
                {resumeData.workExperience.map((exp, expIndex) => (
                  <div key={expIndex} className="border rounded-lg p-3 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Company</Label>
                        <Input
                          value={exp.company}
                          onChange={(e) => updateWorkExperience(expIndex, 'company', e.target.value)}
                          className="text-sm h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Role</Label>
                        <Input
                          value={exp.role}
                          onChange={(e) => updateWorkExperience(expIndex, 'role', e.target.value)}
                          className="text-sm h-8"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-xs text-muted-foreground">Description Points</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addDescriptionPoint(expIndex)}
                          className="h-6 text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Point
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {exp.descriptionPoints.map((point, pointIndex) => (
                          <div key={pointIndex} className="flex gap-2">
                            <Textarea
                              placeholder="Achievement or responsibility..."
                              value={point}
                              onChange={(e) => updateDescriptionPoint(expIndex, pointIndex, e.target.value)}
                              className="text-sm min-h-[50px]"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeDescriptionPoint(expIndex, pointIndex)}
                              className="h-7 w-7 p-0 self-start mt-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Resume Preview</Label>
            <div className="overflow-auto flex justify-center rounded-lg" style={{ 
              height: '70vh',
              padding: '20px'
            }}>
              <div style={{
                transform: 'scale(0.6)',
                transformOrigin: 'top center',
                width: '210mm',
                minHeight: '297mm'
              }}>
                <AiResumePreview 
                  resumeData={resumeData} 
                  jobApplication={jobApplication}
                  baseResume={baseResume}
                  onRegenerate={handleRegenerateFromPreview}
                  showButtons={false}
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
