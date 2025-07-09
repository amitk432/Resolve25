'use client';

import { useState, useRef } from 'react';
import type { AppData, ResumeData } from '@/lib/types';
import { getParsedResume } from '@/app/actions';
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
import { Loader2, Upload, FileText, Download } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import ResumeTemplate from './resume-template';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ResumeBuilderDialogProps {
  data: AppData;
  onUpdate: (updater: (draft: AppData) => void) => void;
  children: React.ReactNode;
}

export default function ResumeBuilderDialog({ data, onUpdate, children }: ResumeBuilderDialogProps) {
  const [open, setOpen] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [parsedData, setParsedData] = useState<ResumeData | null>(data.resume || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumePreviewRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "text/plain") {
         const reader = new FileReader();
         reader.onload = async (e) => {
             const text = e.target?.result as string;
             setResumeText(text);
             toast({ title: "File content loaded", description: "You can now parse it with AI." });
         };
         reader.onerror = () => {
             toast({ variant: 'destructive', title: 'Error reading file' });
         };
         reader.readAsText(file);
      } else {
        toast({ variant: 'destructive', title: 'Unsupported file type', description: 'Please upload a .txt file.' });
      }
    }
  };

  const handleParse = async () => {
    if (!resumeText.trim()) {
      toast({ variant: 'destructive', title: 'Resume text is empty' });
      return;
    }
    setIsLoading(true);
    setError(null);
    const result = await getParsedResume({ resumeText });
    setIsLoading(false);

    if ('error' in result) {
      setError(result.error);
      toast({ variant: 'destructive', title: 'Error parsing resume', description: result.error });
    } else {
      setParsedData(result);
      onUpdate(draft => {
        draft.resume = result;
      });
      toast({ title: 'Resume Parsed!', description: 'Your details have been extracted.' });
    }
  };
  
  const handleDownloadPdf = async () => {
    const element = resumePreviewRef.current;
    if (!element) return;

    toast({ title: 'Generating PDF...', description: 'Please wait a moment.' });

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true, 
      logging: false,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('resume.pdf');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Resume Details</DialogTitle>
          <DialogDescription>
            Upload or paste your resume content to auto-fill details and generate a standardized resume.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow overflow-hidden">
          {/* Input Area */}
          <div className="flex flex-col gap-4 overflow-y-auto pr-4">
            <h3 className="font-semibold flex items-center gap-2"><FileText /> Resume Content</h3>
            <div className="flex items-center gap-2">
                <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste your resume content here..."
                    className="w-full h-48 p-2 border rounded-md min-h-[200px] flex-grow"
                />
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".txt" className="hidden" />
            </div>
             <div className="flex gap-2">
                <Button onClick={() => fileInputRef.current?.click()} variant="outline"><Upload className="mr-2"/> Upload .txt file</Button>
                <Button onClick={handleParse} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 animate-spin"/> : null}
                    Parse with AI
                </Button>
            </div>
            {error && <Alert variant="destructive"><AlertTitle>Parsing Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Instructions</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>For best results, upload a plain text (.txt) file or paste clean text.</li>
                <li>The AI will parse the text and structure it into the template on the right.</li>
                <li>Once parsed, you can download the formatted resume as a PDF.</li>
              </ul>
            </div>
          </div>

          {/* Preview Area */}
          <div className="flex flex-col gap-4 overflow-hidden">
             <div className="flex justify-between items-center">
                <h3 className="font-semibold">Generated Preview</h3>
                <Button onClick={handleDownloadPdf} disabled={!parsedData}>
                    <Download className="mr-2" /> Download PDF
                </Button>
            </div>
            <div ref={resumePreviewRef} className="flex-grow overflow-y-auto bg-gray-50 p-2 rounded-md">
                {parsedData ? (
                    <ResumeTemplate resume={parsedData} />
                ) : (
                    <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                        <p>Your generated resume will appear here after parsing.</p>
                    </div>
                )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
