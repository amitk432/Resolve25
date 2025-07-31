'use client';

import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Download, Sparkles, FileText, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ResumeData, JobApplication } from '@/lib/types';
import ResumeTemplatePreview from './resume-template-preview';
import { HighQualityPDFGenerator } from '@/lib/pdf-generator';
import { generateJobSpecificResumeAction } from '@/app/actions';

interface CustomResumeGeneratorDialogProps {
  children: React.ReactNode;
  originalResumeData: ResumeData | null;
}

export default function CustomResumeGeneratorDialog({ children, originalResumeData }: CustomResumeGeneratorDialogProps) {
  const [open, setOpen] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [roleName, setRoleName] = useState('');
  const [customResumeData, setCustomResumeData] = useState<ResumeData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const customResumeRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!originalResumeData) {
      toast({
        variant: 'destructive',
        title: 'Resume Data Missing',
        description: 'Please add your resume details first.',
      });
      return;
    }

    if (!jobDescription.trim()) {
      toast({
        variant: 'destructive',
        title: 'Job Description Required',
        description: 'Please provide a job description to customize your resume.',
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Create a mock job application for the generateJobSpecificResumeAction
      const mockJobApplication: JobApplication = {
        date: new Date().toISOString(),
        company: companyName.trim() || 'Target Company',
        role: roleName.trim() || 'Target Role',
        status: 'Applied',
        source: 'AI',
        location: 'Remote',
        jobType: 'Full-time',
        salaryRange: ''
      };

      const result = await generateJobSpecificResumeAction(
        originalResumeData,
        mockJobApplication,
        jobDescription.trim()
      );

      if ('error' in result) {
        throw new Error(result.error);
      }

      setCustomResumeData(result);
      toast({
        title: 'Resume Customized!',
        description: 'Your resume has been tailored for this specific job.',
      });
    } catch (error) {
      console.error('Error generating custom resume:', error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate custom resume. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!customResumeData) {
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: 'No custom resume available to download.',
      });
      return;
    }

    setIsDownloading(true);
    try {
      const fileName = `${customResumeData.contactInfo.name?.replace(/\s+/g, '_') || 'Custom'}_Resume.pdf`;
      await HighQualityPDFGenerator.downloadResume(customResumeData, fileName);

      toast({
        title: 'Download Complete',
        description: 'Your custom resume has been downloaded successfully.',
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: 'Failed to download the resume. Please try again.',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleReset = () => {
    setJobDescription('');
    setCompanyName('');
    setRoleName('');
    setCustomResumeData(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Custom Resume Generator
          </DialogTitle>
          <DialogDescription>
            Generate a tailored resume based on a specific job description using AI
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
          {/* Left Panel - Input Form */}
          <Card className="bg-white dark:bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <FileText className="h-4 w-4" />
                Job Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company" className="text-gray-900">Company Name (Optional)</Label>
                <input
                  id="company"
                  type="text"
                  placeholder="e.g., Google, Microsoft, Meta..."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:border-red-500 focus:outline-none"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role" className="text-gray-900">Role/Position (Optional)</Label>
                <input
                  id="role"
                  type="text"
                  placeholder="e.g., Software Engineer, Product Manager..."
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:border-red-500 focus:outline-none"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="jobDescription" className="text-gray-900">Job Description *</Label>
                <Textarea
                  id="jobDescription"
                  placeholder="Paste the complete job description here. Include requirements, responsibilities, and preferred qualifications..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[300px] bg-white border-gray-300 text-gray-900 focus:border-red-500"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating || !originalResumeData || !jobDescription.trim()}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Custom Resume
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleReset} className="bg-white text-gray-900 border-gray-300">
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Right Panel - Resume Preview */}
          <Card className="bg-white dark:bg-white border border-gray-200 overflow-hidden">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <FileText className="h-4 w-4" />
                  Resume Preview
                </CardTitle>
                {customResumeData && (
                  <Button 
                    onClick={handleDownloadPdf} 
                    disabled={isDownloading}
                    size="sm"
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-3 w-3" />
                        Download PDF
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-2 overflow-auto max-h-[600px]">
              {customResumeData ? (
                <div className="flex justify-center">
                  <div 
                    ref={customResumeRef}
                    className="transform scale-50 origin-top"
                    style={{
                      width: '210mm',
                      height: '297mm',
                      background: 'white',
                      boxShadow: '0 0 8px rgba(0,0,0,0.1)',
                    }}
                  >
                    <ResumeTemplatePreview resumeData={customResumeData} />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Custom resume will appear here after generation</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="bg-white text-gray-900 border-gray-300">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
