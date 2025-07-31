import React, { useState } from 'react';
import type { ResumeData, JobApplication } from '@/lib/types';
import ResumeTemplatePreview from './resume-template-preview';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2 } from 'lucide-react';

interface AiResumePreviewProps {
  resumeData: ResumeData;
  jobApplication?: JobApplication;
  baseResume?: ResumeData;
  onRegenerate?: (newResumeData: ResumeData) => void;
  showButtons?: boolean;
}

const AiResumePreview: React.FC<AiResumePreviewProps> = ({ 
  resumeData, 
  jobApplication, 
  baseResume,
  onRegenerate,
  showButtons = true 
}) => {
  const { toast } = useToast();
  const [isRegenerating, setIsRegenerating] = useState(false);

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

      onRegenerate?.(result);
      
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

  const handleDownloadPdf = async () => {
    if (!resumeData) {
      console.error("No resume data available.");
      toast({
        title: "Error",
        description: "No resume data available to download.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Use the high-quality PDF generator instead of html2pdf
      const { HighQualityPDFGenerator } = await import('@/lib/pdf-generator');
      
      const fileName = `${resumeData.contactInfo?.name?.replace(/\s+/g, '_') || 'AI_Generated'}_Resume.pdf`;
      await HighQualityPDFGenerator.downloadResume(resumeData, fileName);

      toast({
        title: "Download Complete",
        description: "Your AI-generated resume has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download the resume. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!resumeData) {
    return <div className="bg-white text-black p-8">No resume data available</div>;
  }

  return (
    <div className="w-full flex flex-col items-center">
      <div style={{
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
      }}>
        <div 
          data-resume-preview
          data-ai-resume-preview 
          className="ai-resume-preview bg-white p-8 rounded-lg shadow-lg"
        >
          <ResumeTemplatePreview resumeData={resumeData} />
        </div>
      </div>
      {showButtons && (
        <div className="flex gap-4 mt-6">
          {jobApplication && baseResume && onRegenerate && (
            <Button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              variant="outline"
              className="px-6 py-2"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate
                </>
              )}
            </Button>
          )}
          <button
            className="px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 text-base font-semibold"
            onClick={handleDownloadPdf}
          >
            Download PDF
          </button>
        </div>
      )}
    </div>
  );
};

export default AiResumePreview;
