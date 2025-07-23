'use client'

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parseISO } from 'date-fns';
import type { JobApplication, JobStatus, AppData, JobType } from '@/lib/types';
import { initialData } from '@/lib/data';
import { produce } from 'immer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Trash2, Plus, FileText, Download, Sparkles, ChevronDown, Clock, IndianRupee, Star, ListChecks, LinkIcon, MapPin, Rocket, Mail, CheckCircle, MoreVertical } from 'lucide-react';
import AiSuggestionSection from './ai-suggestion-section';
import ResumeBuilderDialog from './resume-builder-dialog';
import ResumeTemplate from './resume-template';
import html2canvas from 'html2canvas';
import jspdf from 'jspdf';
import AiJobSuggestionDialog from './ai-job-suggestion-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Badge } from './ui/badge';
import { useToast } from '@/hooks/use-toast';
import GenerateEmailDialog from './generate-email-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { ScrollArea } from './ui/scroll-area';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Briefcase } from 'lucide-react';

interface JobSearchTabProps {
    applications?: JobApplication[];
    onAddApplication?: (application: Omit<JobApplication, 'status'>) => void;
    onUpdateStatus?: (index: number, status: JobStatus) => void;
    onDelete?: (index: number) => void;
    data?: AppData;
    onUpdate?: (updater: (draft: AppData) => void) => void;
}

const appSchema = z.object({
  company: z.string().min(1, 'Company name is required.'),
  role: z.string().min(1, 'Role is required.'),
  dateApplied: z.string().min(1, 'Date applied is required.'),
  location: z.string().optional(),
  applyLink: z.string().url({ message: "Please enter a valid URL."}).optional().or(z.literal('')),
  jobType: z.enum(['Full-time', 'Part-time', 'Contract', 'Internship']).optional(),
  salaryRange: z.string().optional(),
  keyResponsibilities: z.string().optional(),
  requiredSkills: z.string().optional(),
});


export default function JobSearchTab({ 
    applications: propApplications, 
    onAddApplication: propOnAddApplication, 
    onUpdateStatus: propOnUpdateStatus, 
    onDelete: propOnDelete, 
    data: propData, 
    onUpdate: propOnUpdate 
}: JobSearchTabProps) {
    // Use provided props or manage local state
    const [localData, setLocalData] = useState<AppData>(propData || initialData);
    const data = propData || localData;
    const applications = propApplications || data.jobApplications || [];
    
    const onUpdate = propOnUpdate || ((updater: (draft: AppData) => void) => {
        setLocalData(prevData => produce(prevData, updater));
    });
    
    const onAddApplication = propOnAddApplication || ((application: Omit<JobApplication, 'status'>) => {
        onUpdate(draft => {
            if (!draft.jobApplications) {
                draft.jobApplications = [];
            }
            draft.jobApplications.push({
                ...application,
                status: 'Applied' as JobStatus // Set to 'Applied' since they're providing a date
            });
        });
    });
    
    const onUpdateStatus = propOnUpdateStatus || ((index: number, status: JobStatus) => {
        onUpdate(draft => {
            if (draft.jobApplications && draft.jobApplications[index]) {
                draft.jobApplications[index].status = status;
            }
        });
    });
    
    const onDelete = propOnDelete || ((index: number) => {
        onUpdate(draft => {
            if (draft.jobApplications) {
                draft.jobApplications.splice(index, 1);
            }
        });
    });

    const [isDialogOpen, setDialogOpen] = useState(false);
    const resumeRef = useRef<HTMLDivElement>(null);
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof appSchema>>({
        resolver: zodResolver(appSchema),
        defaultValues: { 
            company: '', 
            role: '', 
            dateApplied: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
            applyLink: '',
            location: '',
            salaryRange: '',
            keyResponsibilities: '',
            requiredSkills: '',
         },
    });

    const onSubmit = (values: z.infer<typeof appSchema>) => {
        onAddApplication({
            company: values.company,
            role: values.role,
            date: new Date(values.dateApplied).toISOString(), // Convert to ISO string
            applyLink: values.applyLink,
            location: values.location,
            jobType: values.jobType,
            salaryRange: values.salaryRange,
            keyResponsibilities: values.keyResponsibilities?.split('\n').filter(s => s.trim()),
            requiredSkills: values.requiredSkills?.split('\n').filter(s => s.trim()),
        });
        setDialogOpen(false);
        form.reset();
    }
    
    const handleDownloadPdf = () => {
        const input = resumeRef.current;
        if (!input) {
            console.error("Resume preview element not found.");
            return;
        }

        html2canvas(input, {
            scale: 2, // Higher scale for better quality
            useCORS: true,
            scrollY: -window.scrollY,
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jspdf({
                orientation: 'portrait',
                unit: 'pt',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;

            const ratio = canvasWidth / canvasHeight;
            let imgHeight = pdfWidth / ratio;
            let heightLeft = imgHeight;

            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft >= 0) {
              position = heightLeft - imgHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
              heightLeft -= pdfHeight;
            }

            const resumeName = data.resume?.contactInfo?.name || 'resume';
            pdf.save(`${resumeName.replace(/\s+/g, '_')}.pdf`);
        });
    };

    const handleMarkAsApplied = (index: number) => {
        onUpdate(draft => {
            const app = draft.jobApplications[index];
            app.status = 'Applied';
            app.date = new Date().toISOString();
        });
        toast({
            title: "Application Marked as Applied!",
            description: "Good luck! You can now update its status from the dropdown."
        });
    };
    
    const JobApplicationCard = ({ app, index }: { app: JobApplication, index: number }) => {
      const [isDetailsOpen, setDetailsOpen] = useState(false);

      return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start gap-2">
                    <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                            {app.source === 'AI' && (
                                <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger><Sparkles className="h-4 w-4 text-primary" /></TooltipTrigger>
                                    <TooltipContent><p>Suggested by AI</p></TooltipContent>
                                </Tooltip>
                                </TooltipProvider>
                            )}
                            <p className="font-semibold text-foreground">{app.role}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{app.company}</p>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {app.status === 'Need to Apply' && (
                                <DropdownMenuItem onSelect={() => handleMarkAsApplied(index)}>
                                    <Rocket className="mr-2 h-4 w-4" /> Mark as Applied
                                </DropdownMenuItem>
                            )}
                            {data.resume && (
                                <GenerateEmailDialog resumeData={data.resume} jobApplication={app}>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <Mail className="mr-2 h-4 w-4" /> Generate Email
                                    </DropdownMenuItem>
                                </GenerateEmailDialog>
                            )}
                            {app.applyLink && (
                                <DropdownMenuItem asChild>
                                    <a href={app.applyLink} target="_blank" rel="noopener noreferrer">
                                        <LinkIcon className="mr-2 h-4 w-4" /> Open Link
                                    </a>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete the application for "{app.role}" at {app.company}.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => onDelete(index)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent>
                {app.status === 'Need to Apply' ? (
                    <Badge variant="outline">Need to Apply</Badge>
                ) : (
                    <Select value={app.status} onValueChange={(value: JobStatus) => onUpdateStatus(index, value)}>
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Applied">Applied</SelectItem>
                            <SelectItem value="Interviewing">Interviewing</SelectItem>
                            <SelectItem value="Offer">Offer</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                )}
                 {(app.keyResponsibilities || app.requiredSkills || app.salaryRange || app.jobType || app.location) && (
                  <div className="mt-4">
                      <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => setDetailsOpen(!isDetailsOpen)}>
                          {isDetailsOpen ? 'Hide' : 'Show'} Details
                          <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${isDetailsOpen ? 'rotate-180' : ''}`} />
                      </Button>
                      {isDetailsOpen && (
                          <div className="mt-2 space-y-4 text-sm">
                              <div className="flex flex-wrap gap-x-4 gap-y-2 text-muted-foreground">
                                  {app.location && <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4"/> {app.location}</div>}
                                  {app.jobType && <div className="flex items-center gap-1.5"><Clock className="h-4 w-4"/> {app.jobType}</div>}
                                  {app.salaryRange && <div className="flex items-center gap-1.5"><IndianRupee className="h-4 w-4"/> {app.salaryRange}</div>}
                              </div>
                              {app.keyResponsibilities && app.keyResponsibilities.length > 0 && (
                                  <div>
                                      <h4 className="font-semibold text-foreground flex items-center gap-2"><ListChecks className="h-4 w-4" /> Key Responsibilities</h4>
                                      <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2 mt-1">
                                          {app.keyResponsibilities.map((resp, i) => <li key={i}>{resp}</li>)}
                                      </ul>
                                  </div>
                              )}
                              {app.requiredSkills && app.requiredSkills.length > 0 && (
                                  <div>
                                      <h4 className="font-semibold text-foreground flex items-center gap-2"><Star className="h-4 w-4" /> Required Skills</h4>
                                      <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2 mt-1">
                                          {app.requiredSkills.map((skill, i) => <li key={i}>{skill}</li>)}
                                      </ul>
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
                 )}
            </CardContent>
        </Card>
      )
    }


    return (
        <div>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Job Application Tracker</h2>
                <p className="mt-1 text-muted-foreground">Manage your job search pipeline from start to finish.</p>
              </div>
              <div className="flex items-center gap-2">
                <AiJobSuggestionDialog resumeData={data.resume} onAddApplication={onAddApplication}>
                    <Button variant="outline" size="icon">
                        <Sparkles className="h-4 w-4" />
                    </Button>
                </AiJobSuggestionDialog>
                <ResumeBuilderDialog data={data} onUpdate={onUpdate}>
                    <Button variant="outline">
                        <FileText className="mr-2 h-4 w-4" /> Add Details
                    </Button>
                </ResumeBuilderDialog>
                <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Application
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Add Job Application</DialogTitle>
                            <DialogDescription>
                                Manually enter the details of a job application.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)}>
                                <ScrollArea className="h-[60vh] pr-6">
                                    <div className="space-y-4 py-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <FormField control={form.control} name="company" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Company</FormLabel>
                                                    <FormControl><Input placeholder="e.g. Google" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="role" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Role</FormLabel>
                                                    <FormControl><Input placeholder="e.g. Software Engineer" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>
                                        <FormField control={form.control} name="dateApplied" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Date Applied</FormLabel>
                                                <FormControl><Input type="date" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="applyLink" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Application Link</FormLabel>
                                                <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <FormField control={form.control} name="location" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Location</FormLabel>
                                                    <FormControl><Input placeholder="e.g. San Francisco, CA" {...field} /></FormControl>
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="jobType" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Job Type</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="Full-time">Full-time</SelectItem>
                                                            <SelectItem value="Part-time">Part-time</SelectItem>
                                                            <SelectItem value="Contract">Contract</SelectItem>
                                                            <SelectItem value="Internship">Internship</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="salaryRange" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Salary Range</FormLabel>
                                                    <FormControl><Input placeholder="e.g. $100k - $120k" {...field} /></FormControl>
                                                </FormItem>
                                            )} />
                                        </div>
                                        <FormField control={form.control} name="keyResponsibilities" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Key Responsibilities</FormLabel>
                                                <FormControl><Textarea placeholder="One responsibility per line..." {...field} rows={5} /></FormControl>
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="requiredSkills" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Required Skills</FormLabel>
                                                <FormControl><Textarea placeholder="One skill per line..." {...field} rows={5} /></FormControl>
                                            </FormItem>
                                        )} />
                                    </div>
                                </ScrollArea>
                                <DialogFooter className="pt-4 border-t">
                                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                                    <Button type="submit">Add Application</Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Mobile View: Cards */}
            <div className="space-y-4 md:hidden">
              {applications.length > 0 ? (
                applications.map((app, index) => (
                  <JobApplicationCard key={index} app={app} index={index} />
                ))
              ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                  <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-lg font-medium">No Applications Yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Click "Add Application" to start tracking.</p>
                </div>
              )}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden rounded-lg border overflow-x-auto md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12"></TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="hidden sm:table-cell">Date Applied</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {applications.length === 0 ? (
                             <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground h-24">No applications added yet.</TableCell>
                             </TableRow>
                        ) : (
                            applications.map((app, index) => (
                                <React.Fragment key={index}>
                                    <TableRow>
                                        <TableCell>
                                             {(app.keyResponsibilities || app.requiredSkills || app.salaryRange || app.jobType || app.location) && (
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpandedRow(expandedRow === index ? null : index)}>
                                                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedRow === index ? 'rotate-180' : ''}`} />
                                                </Button>
                                             )}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <TooltipProvider>
                                                <div className="flex items-center gap-2">
                                                    {app.source === 'AI' && (
                                                        <Tooltip>
                                                            <TooltipTrigger><Sparkles className="h-4 w-4 text-primary" /></TooltipTrigger>
                                                            <TooltipContent><p>Suggested by AI</p></TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                     {app.status !== 'Need to Apply' && (
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Applied on {format(parseISO(app.date), 'dd-MMMM-yyyy')}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    {app.company}
                                                </div>
                                            </TooltipProvider>
                                        </TableCell>
                                        <TableCell>{app.role}</TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            {app.status === 'Need to Apply' ? (
                                                <span className="text-muted-foreground italic">Pending</span>
                                            ) : (
                                                format(parseISO(app.date), 'dd-MMMM-yyyy')
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {app.status === 'Need to Apply' ? (
                                                <Badge variant="outline">Need to Apply</Badge>
                                            ) : (
                                                <Select value={app.status} onValueChange={(value: JobStatus) => onUpdateStatus(index, value)}>
                                                    <SelectTrigger className="w-[150px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Applied">Applied</SelectItem>
                                                        <SelectItem value="Interviewing">Interviewing</SelectItem>
                                                        <SelectItem value="Offer">Offer</SelectItem>
                                                        <SelectItem value="Rejected">Rejected</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <TooltipProvider>
                                                <div className="flex items-center justify-center gap-1">
                                                    {app.status === 'Need to Apply' && (
                                                        <AlertDialog>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button variant="outline" size="icon" className="h-8 w-8">
                                                                            <Rocket className="h-4 w-4" />
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                </TooltipTrigger>
                                                                <TooltipContent><p>Mark as Applied</p></TooltipContent>
                                                            </Tooltip>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Confirm Application</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        This will mark the application for the "{app.role}" position at {app.company} as "Applied" with today's date.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleMarkAsApplied(index)}>Yes, I Applied</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    )}
                                                    {app.applyLink && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button asChild variant="outline" size="icon" className="h-8 w-8">
                                                                    <a href={app.applyLink} target="_blank" rel="noopener noreferrer">
                                                                        <LinkIcon className="h-4 w-4" />
                                                                    </a>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>Open Application Link</p></TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    {data.resume && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <GenerateEmailDialog resumeData={data.resume} jobApplication={app}>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                        <Mail className="h-4 w-4" />
                                                                    </Button>
                                                                </GenerateEmailDialog>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>Generate Email</p></TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                     <AlertDialog>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8">
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>Delete Application</p></TooltipContent>
                                                        </Tooltip>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This will permanently delete the application for "{app.role}" at {app.company}.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => onDelete(index)}>Delete</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TooltipProvider>
                                        </TableCell>
                                    </TableRow>
                                    {expandedRow === index && (
                                        <TableRow className="bg-white dark:bg-card hover:bg-accent/30">
                                            <TableCell colSpan={7} className="p-0">
                                                <div className="p-4 space-y-4">
                                                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                                                        {app.location && <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4"/> {app.location}</div>}
                                                        {app.jobType && <div className="flex items-center gap-1.5"><Clock className="h-4 w-4"/> {app.jobType}</div>}
                                                        {app.salaryRange && <div className="flex items-center gap-1.5"><IndianRupee className="h-4 w-4"/> {app.salaryRange}</div>}
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                        {app.keyResponsibilities && app.keyResponsibilities.length > 0 && (
                                                            <div>
                                                                <h4 className="font-semibold mb-1 text-foreground flex items-center gap-2"><ListChecks className="h-4 w-4" /> Key Responsibilities</h4>
                                                                <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2">
                                                                    {app.keyResponsibilities.map((resp, i) => <li key={i}>{resp}</li>)}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        {app.requiredSkills && app.requiredSkills.length > 0 && (
                                                            <div>
                                                                <h4 className="font-semibold mb-1 text-foreground flex items-center gap-2"><Star className="h-4 w-4" /> Required Skills</h4>
                                                                <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2">
                                                                    {app.requiredSkills.map((skill, i) => <li key={i}>{skill}</li>)}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <AiSuggestionSection
                moduleName="JobSearch"
                title="AI Career Coach"
                description="Get suggestions for your job search strategy, from networking to interview prep."
                contextData={{ applications, resume: data.resume }}
            />
            {data.resume && (
                <div className="mt-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-foreground">Resume Preview</h3>
                        <Button onClick={handleDownloadPdf}>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                        </Button>
                    </div>
                    <div className="border rounded-lg overflow-auto">
                        <div ref={resumeRef} className="bg-white p-4">
                            <ResumeTemplate resume={data.resume} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
