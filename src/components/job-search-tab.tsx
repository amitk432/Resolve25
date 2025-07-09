
'use client'

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parseISO } from 'date-fns';
import type { JobApplication, JobStatus, AppData } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Trash2, Plus, FileText, Download } from 'lucide-react';
import AiSuggestionSection from './ai-suggestion-section';
import ResumeBuilderDialog from './resume-builder-dialog';
import ResumeTemplate from './resume-template';
import html2canvas from 'html2canvas';
import jspdf from 'jspdf';

interface JobSearchTabProps {
    applications: JobApplication[];
    onAddApplication: (company: string, role: string) => void;
    onUpdateStatus: (index: number, status: JobStatus) => void;
    onDelete: (index: number) => void;
    data: AppData;
    onUpdate: (updater: (draft: AppData) => void) => void;
}

const appSchema = z.object({
  company: z.string().min(1, 'Company name is required.'),
  role: z.string().min(1, 'Role is required.'),
});


export default function JobSearchTab({ applications, onAddApplication, onUpdateStatus, onDelete, data, onUpdate }: JobSearchTabProps) {
    const [isDialogOpen, setDialogOpen] = useState(false);
    const resumeRef = useRef<HTMLDivElement>(null);

    const form = useForm<z.infer<typeof appSchema>>({
        resolver: zodResolver(appSchema),
        defaultValues: { company: '', role: '' },
    });

    const onSubmit = (values: z.infer<typeof appSchema>) => {
        onAddApplication(values.company, values.role);
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

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-foreground">Job Application Tracker</h2>
              <div className="flex items-center gap-2">
                <ResumeBuilderDialog data={data} onUpdate={onUpdate}>
                    <Button variant="outline"><FileText className="mr-2"/> Add Details</Button>
                </ResumeBuilderDialog>
                <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4"/>Add Application</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Application</DialogTitle>
                            <DialogDescription>
                                Track a new job application you've submitted.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                                <FormField
                                    control={form.control}
                                    name="company"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Company</FormLabel>
                                            <FormControl><Input placeholder="e.g., Thoughtworks" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="role"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Role</FormLabel>
                                            <FormControl><Input placeholder="e.g., Sr. QA Engineer" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                                    <Button type="submit">Add Application</Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="rounded-lg border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {applications.length === 0 ? (
                             <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">No applications added yet.</TableCell>
                             </TableRow>
                        ) : (
                            applications.map((app, index) => (
                                <TableRow key={index}>
                                    <TableCell>{format(parseISO(app.date), 'dd-MMMM-yyyy')}</TableCell>
                                    <TableCell className="font-medium">{app.company}</TableCell>
                                    <TableCell>{app.role}</TableCell>
                                    <TableCell>
                                         <Select value={app.status} onValueChange={(value: JobStatus) => onUpdateStatus(index, value)}>
                                            <SelectTrigger className="w-[130px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Applied">Applied</SelectItem>
                                                <SelectItem value="Interviewing">Interviewing</SelectItem>
                                                <SelectItem value="Offer">Offer</SelectItem>
                                                <SelectItem value="Rejected">Rejected</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => onDelete(index)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
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
                    <div className="border rounded-lg overflow-hidden">
                        <div ref={resumeRef} className="bg-white">
                            <ResumeTemplate resume={data.resume} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
