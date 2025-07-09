
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import type { AppData, ResumeData } from '@/lib/types';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, CalendarIcon } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import { Checkbox } from './ui/checkbox';


interface ResumeBuilderDialogProps {
  data: AppData;
  onUpdate: (updater: (draft: AppData) => void) => void;
  children: React.ReactNode;
}

const resumeFormSchema = z.object({
  contactInfo: z.object({
    name: z.string().min(1, 'Name is required.'),
    location: z.string().min(1, 'Location is required.'),
    phone: z.string().min(1, 'Phone is required.'),
    email: z.string().email('Invalid email address.'),
    linkedin: z.string().url('Invalid URL.').optional().or(z.literal('')),
    github: z.string().url('Invalid URL.').optional().or(z.literal('')),
  }),
  summary: z.object({
    title: z.string().min(1, 'Summary title is required.'),
    text: z.string().min(1, 'Summary text is required.'),
  }),
  skills: z.array(z.object({
    category: z.string().min(1, 'Category is required.'),
    skillList: z.string().min(1, 'Skills are required.'),
  })),
  workExperience: z.array(z.object({
    company: z.string().min(1, 'Company is required.'),
    location: z.string().min(1, 'Location is required.'),
    role: z.string().min(1, 'Role is required.'),
    startDate: z.date({ required_error: 'Start date is required.' }),
    endDate: z.date().nullable(),
    isCurrent: z.boolean().default(false),
    descriptionPoints: z.string().min(1, 'Description is required.'),
  })),
  projects: z.array(z.object({
    name: z.string().min(1, 'Project name is required.'),
    startDate: z.date({ required_error: 'Start date is required.' }),
    endDate: z.date().nullable(),
    isCurrent: z.boolean().default(false),
    description: z.string().min(1, 'Description is required.'),
  })),
  education: z.array(z.object({
    institution: z.string().min(1, 'Institution is required.'),
    degree: z.string().min(1, 'Degree is required.'),
    location: z.string().min(1, 'Location is required.'),
    gpa: z.string().min(1, 'GPA is required.'),
    endDate: z.date({ required_error: 'End date is required.' }),
  })),
});

type ResumeFormValues = z.infer<typeof resumeFormSchema>;

export default function ResumeBuilderDialog({ data, onUpdate, children }: ResumeBuilderDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<ResumeFormValues>({
    resolver: zodResolver(resumeFormSchema),
    defaultValues: {
      contactInfo: { name: '', location: '', phone: '', email: '', linkedin: '', github: '' },
      summary: { title: '', text: '' },
      skills: [],
      workExperience: [],
      projects: [],
      education: [],
    },
  });

  const { fields: skillFields, append: appendSkill, remove: removeSkill } = useFieldArray({ control: form.control, name: "skills" });
  const { fields: workFields, append: appendWork, remove: removeWork } = useFieldArray({ control: form.control, name: "workExperience" });
  const { fields: projectFields, append: appendProject, remove: removeProject } = useFieldArray({ control: form.control, name: "projects" });
  const { fields: educationFields, append: appendEducation, remove: removeEducation } = useFieldArray({ control: form.control, name: "education" });

  useEffect(() => {
    if (open && data.resume) {
      const skillsArray = data.resume.skills ? Object.entries(data.resume.skills).map(([category, skillList]) => ({ category, skillList })) : [];
      const workExperienceArray = data.resume.workExperience.map(w => ({
          ...w,
          descriptionPoints: w.descriptionPoints.join('\n'),
          startDate: w.startDate ? new Date(w.startDate) : null,
          endDate: w.endDate ? new Date(w.endDate) : null,
      }));
      const projectsArray = (data.resume.projects || []).map(p => ({
          ...p,
          startDate: p.startDate ? new Date(p.startDate) : null,
          endDate: p.endDate ? new Date(p.endDate) : null,
      }));
      const educationArray = (data.resume.education || []).map(e => ({
          ...e,
          endDate: e.endDate ? new Date(e.endDate) : null,
      }));
      
      form.reset({
        contactInfo: data.resume.contactInfo,
        summary: data.resume.summary,
        skills: skillsArray,
        workExperience: workExperienceArray,
        projects: projectsArray,
        education: educationArray,
      });
    } else if (open) {
        form.reset({
            contactInfo: { name: '', location: '', phone: '', email: '', linkedin: '', github: '' },
            summary: { title: '', text: '' },
            skills: [],
            workExperience: [],
            projects: [],
            education: [],
        });
    }
  }, [open, data.resume, form]);

  const onSubmit = (values: ResumeFormValues) => {
    const skillsRecord = values.skills.reduce((acc, { category, skillList }) => {
        if(category) acc[category] = skillList;
        return acc;
    }, {} as Record<string, string>);

    const workExperience = values.workExperience.map(w => ({
        ...w, 
        descriptionPoints: w.descriptionPoints.split('\n').filter(p => p.trim() !== ''),
        startDate: w.startDate?.toISOString() ?? null,
        endDate: w.isCurrent ? null : (w.endDate?.toISOString() ?? null)
    }));
    
    const projects = values.projects.map(p => ({
        ...p,
        startDate: p.startDate?.toISOString() ?? null,
        endDate: p.isCurrent ? null : (p.endDate?.toISOString() ?? null),
        description: p.description
    }));

    const education = values.education.map(e => ({
        ...e,
        endDate: e.endDate?.toISOString() ?? null,
    }));

    const finalResumeData: ResumeData = {
        contactInfo: values.contactInfo,
        summary: values.summary,
        skills: skillsRecord,
        workExperience,
        projects,
        education,
    };

    onUpdate(draft => {
        draft.resume = finalResumeData;
    });
    toast({ title: "Resume Details Saved!", description: "Your resume information has been updated." });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Resume Details</DialogTitle>
          <DialogDescription>
            Add your resume details here. This information will be used to generate your resume and help the AI provide better suggestions.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-hidden">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} id="resume-form" className="h-full flex flex-col">
                <ScrollArea className="flex-grow pr-4">
                  <div className="space-y-8 p-1">
                    {/* Contact Info */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-lg">Contact Information</h4>
                      <FormField name="contactInfo.name" control={form.control} render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <div className="grid grid-cols-2 gap-4">
                          <FormField name="contactInfo.email" control={form.control} render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                          <FormField name="contactInfo.phone" control={form.control} render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <FormField name="contactInfo.location" control={form.control} render={({ field }) => (<FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="City, Country" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <div className="grid grid-cols-2 gap-4">
                          <FormField name="contactInfo.linkedin" control={form.control} render={({ field }) => (<FormItem><FormLabel>LinkedIn URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                          <FormField name="contactInfo.github" control={form.control} render={({ field }) => (<FormItem><FormLabel>GitHub URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                    </div>
                    
                    <Separator/>

                    {/* Summary */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-lg">Professional Summary</h4>
                        <FormField name="summary.title" control={form.control} render={({ field }) => (<FormItem><FormLabel>Headline</FormLabel><FormControl><Input placeholder="e.g., Software Quality Analyst" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField name="summary.text" control={form.control} render={({ field }) => (<FormItem><FormLabel>Summary Text</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>

                    <Separator/>

                    {/* Skills */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="font-medium text-lg">Skills</h4>
                            <Button type="button" size="sm" onClick={() => appendSkill({ category: '', skillList: '' })}><Plus className="mr-2 h-4 w-4"/>Add Skill Category</Button>
                        </div>
                        {skillFields.map((field, index) => (
                            <div key={field.id} className="flex gap-2 items-start p-3 border rounded-md">
                                <div className="flex-grow space-y-2">
                                    <FormField name={`skills.${index}.category`} control={form.control} render={({ field }) => (<FormItem><FormLabel>Category</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField name={`skills.${index}.skillList`} control={form.control} render={({ field }) => (<FormItem><FormLabel>Skills (comma-separated)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                                <Button type="button" variant="ghost" size="icon" className="mt-6" onClick={() => removeSkill(index)}><Trash2 className="text-destructive h-4 w-4"/></Button>
                            </div>
                        ))}
                    </div>

                    <Separator/>

                    {/* Work Experience */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="font-medium text-lg">Work Experience</h4>
                            <Button type="button" size="sm" onClick={() => appendWork({ company: '', location: '', role: '', startDate: new Date(), endDate: null, isCurrent: false, descriptionPoints: '' })}><Plus className="mr-2 h-4 w-4"/>Add Experience</Button>
                        </div>
                        {workFields.map((field, index) => (
                            <div key={field.id} className="space-y-2 p-3 border rounded-md relative">
                                <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1" onClick={() => removeWork(index)}><Trash2 className="text-destructive h-4 w-4"/></Button>
                                <FormField name={`workExperience.${index}.company`} control={form.control} render={({ field }) => (<FormItem><FormLabel>Company</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField name={`workExperience.${index}.role`} control={form.control} render={({ field }) => (<FormItem><FormLabel>Role</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField name={`workExperience.${index}.location`} control={form.control} render={({ field }) => (<FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name={`workExperience.${index}.startDate`} render={({ field }) => (
                                        <FormItem className="flex flex-col"><FormLabel>Start Date</FormLabel>
                                            <Popover><PopoverTrigger asChild><FormControl>
                                                <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !field.value && 'text-muted-foreground')}>
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                                </Button>
                                            </FormControl></PopoverTrigger>
                                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                                            </Popover><FormMessage />
                                        </FormItem>
                                    )} />
                                     <FormField control={form.control} name={`workExperience.${index}.endDate`} render={({ field }) => {
                                        const isCurrent = form.watch(`workExperience.${index}.isCurrent`);
                                        return (
                                        <FormItem className="flex flex-col"><FormLabel>End Date</FormLabel>
                                            <Popover><PopoverTrigger asChild><FormControl>
                                                <Button variant="outline" disabled={isCurrent} className={cn('w-full justify-start text-left font-normal', !field.value && 'text-muted-foreground')}>
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {isCurrent ? 'Present' : field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                                </Button>
                                            </FormControl></PopoverTrigger>
                                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                                            </Popover><FormMessage />
                                        </FormItem>
                                    )}} />
                                </div>
                                 <FormField control={form.control} name={`workExperience.${index}.isCurrent`} render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                        <FormLabel className="font-normal">I currently work here</FormLabel>
                                    </FormItem>
                                )} />
                                <FormField name={`workExperience.${index}.descriptionPoints`} control={form.control} render={({ field }) => (<FormItem><FormLabel>Description (one point per line)</FormLabel><FormControl><Textarea className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                        ))}
                    </div>
                    
                    <Separator/>
                    
                    {/* Projects */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                          <h4 className="font-medium text-lg">Projects</h4>
                          <Button type="button" size="sm" onClick={() => appendProject({ name: '', startDate: new Date(), endDate: null, isCurrent: false, description: '' })}><Plus className="mr-2 h-4 w-4"/>Add Project</Button>
                      </div>
                      {projectFields.map((field, index) => (
                          <div key={field.id} className="space-y-2 p-3 border rounded-md relative">
                              <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1" onClick={() => removeProject(index)}><Trash2 className="text-destructive h-4 w-4"/></Button>
                              <FormField name={`projects.${index}.name`} control={form.control} render={({ field }) => (<FormItem><FormLabel>Project Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                              
                               <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name={`projects.${index}.startDate`} render={({ field }) => (
                                        <FormItem className="flex flex-col"><FormLabel>Start Date</FormLabel>
                                            <Popover><PopoverTrigger asChild><FormControl>
                                                <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !field.value && 'text-muted-foreground')}>
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                                </Button>
                                            </FormControl></PopoverTrigger>
                                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                                            </Popover><FormMessage />
                                        </FormItem>
                                    )} />
                                     <FormField control={form.control} name={`projects.${index}.endDate`} render={({ field }) => {
                                        const isCurrent = form.watch(`projects.${index}.isCurrent`);
                                        return (
                                        <FormItem className="flex flex-col"><FormLabel>End Date</FormLabel>
                                            <Popover><PopoverTrigger asChild><FormControl>
                                                <Button variant="outline" disabled={isCurrent} className={cn('w-full justify-start text-left font-normal', !field.value && 'text-muted-foreground')}>
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {isCurrent ? 'Present' : field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                                </Button>
                                            </FormControl></PopoverTrigger>
                                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                                            </Popover><FormMessage />
                                        </FormItem>
                                    )}} />
                                </div>
                                <FormField control={form.control} name={`projects.${index}.isCurrent`} render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                        <FormLabel className="font-normal">This is an ongoing project</FormLabel>
                                    </FormItem>
                                )} />
                              <FormField name={`projects.${index}.description`} control={form.control} render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                          </div>
                      ))}
                    </div>

                    <Separator/>

                    {/* Education */}
                     <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="font-medium text-lg">Education</h4>
                            <Button type="button" size="sm" onClick={() => appendEducation({ institution: '', degree: '', location: '', gpa: '', endDate: new Date() })}><Plus className="mr-2 h-4 w-4"/>Add Education</Button>
                        </div>
                        {educationFields.map((field, index) => (
                            <div key={field.id} className="space-y-2 p-3 border rounded-md relative">
                                <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1" onClick={() => removeEducation(index)}><Trash2 className="text-destructive h-4 w-4"/></Button>
                                <FormField name={`education.${index}.institution`} control={form.control} render={({ field }) => (<FormItem><FormLabel>Institution</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField name={`education.${index}.degree`} control={form.control} render={({ field }) => (<FormItem><FormLabel>Degree/Course</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <div className="grid grid-cols-2 gap-4">
                                  <FormField name={`education.${index}.location`} control={form.control} render={({ field }) => (<FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                  <FormField name={`education.${index}.gpa`} control={form.control} render={({ field }) => (<FormItem><FormLabel>GPA / %</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                                <FormField control={form.control} name={`education.${index}.endDate`} render={({ field }) => (
                                    <FormItem className="flex flex-col"><FormLabel>Completion Date</FormLabel>
                                        <Popover><PopoverTrigger asChild><FormControl>
                                            <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !field.value && 'text-muted-foreground')}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                            </Button>
                                        </FormControl></PopoverTrigger>
                                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                                        </Popover><FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        ))}
                    </div>

                  </div>
                </ScrollArea>
                <DialogFooter className="pt-4 mt-auto border-t">
                  <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
                  <Button type="submit" form="resume-form">Save Details</Button>
                </DialogFooter>
              </form>
            </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
