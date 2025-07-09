
'use client';

import { useState } from 'react';
import type { JobApplication, ResumeData } from '@/lib/types';
import { getAIEmailTemplate } from '@/app/actions';

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
import { BrainCircuit, Loader2, Mail, Clipboard, ClipboardCheck } from 'lucide-react';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

interface GenerateEmailDialogProps {
  jobApplication: JobApplication;
  resumeData: ResumeData;
  children: React.ReactNode;
}

export default function GenerateEmailDialog({ jobApplication, resumeData, children }: GenerateEmailDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<{ subject: string; body: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState<'subject' | 'body' | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsLoading(true);
    setEmail(null);
    const result = await getAIEmailTemplate({ resume: resumeData, jobApplication });
    setIsLoading(false);

    if (result && 'error' in result) {
      toast({
        variant: 'destructive',
        title: 'Error Generating Email',
        description: result.error,
      });
    } else if (result) {
      setEmail(result);
    }
  };
  
  const handleCopyToClipboard = (text: string, type: 'subject' | 'body') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast({ title: `${type === 'subject' ? 'Subject' : 'Body'} copied to clipboard!` });
    setTimeout(() => setCopied(null), 2000);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      handleGenerate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="text-primary" />
            AI-Generated Application Email
          </DialogTitle>
          <DialogDescription>
            A tailored email for the "{jobApplication.role}" role at {jobApplication.company}. Review and copy the content below.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center p-16">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          )}
          {!isLoading && email && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <div className="flex items-center gap-2">
                    <Input id="subject" readOnly value={email.subject} />
                    <Button variant="outline" size="icon" onClick={() => handleCopyToClipboard(email.subject, 'subject')}>
                        {copied === 'subject' ? <ClipboardCheck className="h-4 w-4 text-green-500" /> : <Clipboard className="h-4 w-4" />}
                    </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="body">Body</Label>
                <div className="relative">
                    <Textarea id="body" readOnly value={email.body} className="h-64 sm:h-80" />
                    <Button variant="outline" size="icon" className="absolute top-2 right-2" onClick={() => handleCopyToClipboard(email.body, 'body')}>
                        {copied === 'body' ? <ClipboardCheck className="h-4 w-4 text-green-500" /> : <Clipboard className="h-4 w-4" />}
                    </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</> : 'Regenerate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
