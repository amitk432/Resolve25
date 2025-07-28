
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { format } from 'date-fns';
import * as z from 'zod';
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


interface ResumeBuilderDialogProps {
  data: AppData;
  onUpdate: (updater: (draft: AppData) => void) => void;
  children: React.ReactNode;
}

const resumeFormSchema = z.object({
  contactInfo: z.object({
    name: z.string(),
    location: z.string(),
    phone: z.string(),
    email: z.string(),
    linkedin: z.string().optional().or(z.literal('')),
    github: z.string().optional().or(z.literal('')),
  }),
  summary: z.object({
    title: z.string(),
    text: z.string(),
  }),
  skills: z.array(z.object({
    category: z.string(),
    skillList: z.string(),
  })),
  workExperience: z.array(z.object({
    company: z.string(),
    location: z.string(),
    role: z.string(),
    startDate: z.date().nullable(),
    endDate: z.date().nullable(),
    isCurrent: z.boolean().default(false),
    descriptionPoints: z.string(),
  })),
  projects: z.array(z.object({
    name: z.string(),
    startDate: z.date().nullable(),
    endDate: z.date().nullable(),
    isCurrent: z.boolean().default(false),
    description: z.string(),
  })),
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    location: z.string(),
    gpa: z.string(),
    endDate: z.date().nullable(),
  })),
});

type ResumeFormValues = z.infer<typeof resumeFormSchema>;

export default function ResumeBuilderDialog({ data, onUpdate, children }: ResumeBuilderDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();

  const form = useForm<ResumeFormValues>({
    mode: 'onChange',
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
      
      const parseDate = (dateStr: string | null | undefined): Date | null => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date;
      };

      const workExperienceArray = data.resume.workExperience.map(w => ({
          ...w,
          descriptionPoints: w.descriptionPoints.join('\n'),
          startDate: parseDate(w.startDate),
          endDate: parseDate(w.endDate),
      }));
      const projectsArray = (data.resume.projects || []).map(p => ({
          ...p,
          startDate: parseDate(p.startDate),
          endDate: parseDate(p.endDate),
      }));
      const educationArray = (data.resume.education || []).map(e => ({
          ...e,
          endDate: parseDate(e.endDate),
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
            skills: [{ category: '', skillList: '' }],
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
        contactInfo: {
            ...values.contactInfo,
            linkedin: values.contactInfo.linkedin || '',
            github: values.contactInfo.github || '',
        },
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
      <DialogContent className="flex h-[90vh] max-w-5xl flex-col">
        <DialogHeader>
          <DialogTitle>Resume Details</DialogTitle>
          <DialogDescription>
            Add your resume details here. This information will be used to generate your resume and help the AI provide better suggestions.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-hidden">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} id="resume-form" className="h-full flex flex-col" aria-label="Resume builder form">
                <ScrollArea className="flex-grow">
                  <div className="mx-auto max-w-3xl space-y-6 px-1 py-4">
                    {/* Contact Info */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-base">Contact Information</h4>
                      <FormField name="contactInfo.name" control={form.control} render={({ field }) => (<FormItem><FormLabel className="text-sm">Full Name</FormLabel><FormControl><Input className="h-9" {...field} aria-describedby="name-error" /></FormControl><FormMessage id="name-error" /></FormItem>)} />
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <FormField name="contactInfo.email" control={form.control} render={({ field }) => (<FormItem><FormLabel className="text-sm">Email</FormLabel><FormControl><Input className="h-9" type="email" {...field} aria-describedby="email-error" /></FormControl><FormMessage id="email-error" /></FormItem>)} />
                          <FormField name="contactInfo.phone" control={form.control} render={({ field }) => (<FormItem><FormLabel className="text-sm">Phone</FormLabel><FormControl><Input className="h-9" type="tel" {...field} aria-describedby="phone-error" /></FormControl><FormMessage id="phone-error" /></FormItem>)} />
                      </div>
                      <FormField name="contactInfo.location" control={form.control} render={({ field }) => (<FormItem><FormLabel className="text-sm">Location</FormLabel><FormControl><Input className="h-9" placeholder="City, Country" {...field} aria-describedby="location-error" /></FormControl><FormMessage id="location-error" /></FormItem>)} />
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <FormField name="contactInfo.linkedin" control={form.control} render={({ field }) => (<FormItem><FormLabel className="text-sm">LinkedIn URL (Optional)</FormLabel><FormControl><Input className="h-9" type="url" {...field} aria-describedby="linkedin-error" /></FormControl><FormMessage id="linkedin-error" /></FormItem>)} />
                          <FormField name="contactInfo.github" control={form.control} render={({ field }) => (<FormItem><FormLabel className="text-sm">GitHub URL (Optional)</FormLabel><FormControl><Input className="h-9" type="url" {...field} aria-describedby="github-error" /></FormControl><FormMessage id="github-error" /></FormItem>)} />
                      </div>
                    </div>
                    
                    <Separator/>

                    {/* Summary */}
                    <div className="space-y-3">
                        <h4 className="font-medium text-base">Professional Summary</h4>
                        <FormField name="summary.title" control={form.control} render={({ field }) => (<FormItem><FormLabel className="text-sm">Headline</FormLabel><FormControl><Input className="h-9" placeholder="e.g., Software Quality Analyst" {...field} aria-describedby="summary-title-error" /></FormControl><FormMessage id="summary-title-error" /></FormItem>)} />
                        <FormField name="summary.text" control={form.control} render={({ field }) => (<FormItem><FormLabel className="text-sm">Summary Text</FormLabel><FormControl><Textarea className="min-h-[80px] text-sm" {...field} aria-describedby="summary-text-error" /></FormControl><FormMessage id="summary-text-error" /></FormItem>)} />
                    </div>

                    <Separator/>

                    {/* Skills */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <h4 className="font-medium text-base">Skills</h4>
                            <Button type="button" size="sm" className="h-8 text-xs" onClick={() => appendSkill({ category: '', skillList: '' })} aria-label="Add new skill category"><Plus className="mr-1 h-3 w-3"/>Add Category</Button>
                        </div>
                        {skillFields.map((field, index) => (
                            <div key={field.id} className="flex gap-2 items-start p-3 border rounded-md" role="group" aria-label={`Skill category ${index + 1}`}>
                                <div className="flex-grow space-y-2">
                                    <FormField name={`skills.${index}.category`} control={form.control} render={({ field }) => (<FormItem><FormLabel className="text-sm">Category</FormLabel><FormControl><Input className="h-8" {...field} aria-describedby={`skill-category-${index}-error`} /></FormControl><FormMessage id={`skill-category-${index}-error`} /></FormItem>)} />
                                    <FormField name={`skills.${index}.skillList`} control={form.control} render={({ field }) => (<FormItem><FormLabel className="text-sm">Skills (comma-separated)</FormLabel><FormControl><Input className="h-8" {...field} aria-describedby={`skill-list-${index}-error`} /></FormControl><FormMessage id={`skill-list-${index}-error`} /></FormItem>)} />
                                </div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 mt-5" aria-label={`Delete skill category ${index + 1}`}><Trash2 className="text-destructive h-3 w-3"/></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Remove Skill Category?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to remove this skill category and all its skills?
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => removeSkill(index)} className="bg-destructive hover:bg-destructive/90">Remove</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        ))}
                    </div>

                    <Separator/>

                    {/* Work Experience */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <h4 className="font-medium text-base">Work Experience</h4>
                            <Button type="button" size="sm" className="h-8 text-xs" onClick={() => appendWork({ company: '', location: '', role: '', startDate: new Date(), endDate: null, isCurrent: false, descriptionPoints: '' })} aria-label="Add new work experience"><Plus className="mr-1 h-3 w-3"/>Add Experience</Button>
                        </div>
                        {workFields.map((field, index) => (
                            <div key={field.id} className="space-y-2 p-3 border rounded-md relative" role="group" aria-label={`Work experience ${index + 1}`}>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button type="button" variant="ghost" size="sm" className="absolute top-1 right-1 h-6 w-6" aria-label={`Delete work experience ${index + 1}`}><Trash2 className="text-destructive h-3 w-3"/></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Remove Work Experience?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to remove this work experience entry?
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => removeWork(index)} className="bg-destructive hover:bg-destructive/90">Remove</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                <FormField name={`workExperience.${index}.company`} control={form.control} render={({ field }) => (<FormItem><FormLabel className="text-sm">Company</FormLabel><FormControl><Input className="h-8" {...field} aria-describedby={`work-company-${index}-error`} /></FormControl><FormMessage id={`work-company-${index}-error`} /></FormItem>)} />
                                <FormField name={`workExperience.${index}.role`} control={form.control} render={({ field }) => (<FormItem><FormLabel className="text-sm">Role</FormLabel><FormControl><Input className="h-8" {...field} aria-describedby={`work-role-${index}-error`} /></FormControl><FormMessage id={`work-role-${index}-error`} /></FormItem>)} />
                                <FormField name={`workExperience.${index}.location`} control={form.control} render={({ field }) => (<FormItem><FormLabel className="text-sm">Location</FormLabel><FormControl><Input className="h-8" {...field} aria-describedby={`work-location-${index}-error`} /></FormControl><FormMessage id={`work-location-${index}-error`} /></FormItem>)} />
                                
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <FormField control={form.control} name={`workExperience.${index}.startDate`} render={({ field }) => (
                                        <FormItem className="flex flex-col"><FormLabel className="text-sm">Start Date</FormLabel>
                                            <Popover><PopoverTrigger asChild><FormControl>
                                                <Button variant="outline" className={cn('w-full h-8 justify-start text-left font-normal text-sm', !field.value && 'text-muted-foreground')} aria-label="Select start date">
                                                    <CalendarIcon className="mr-2 h-3 w-3" />
                                                    {field.value ? format(field.value, 'dd-MMM-yyyy') : <span>Pick a date</span>}
                                                </Button>
                                            </FormControl></PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar mode="single" captionLayout="dropdown-buttons" fromYear={1980} toYear={currentYear} selected={field.value ?? undefined} onSelect={field.onChange} initialFocus />
                                            </PopoverContent>
                                            </Popover><FormMessage />
                                        </FormItem>
                                    )} />
                                     <FormField control={form.control} name={`workExperience.${index}.endDate`} render={({ field }) => {
                                        const isCurrent = form.watch(`workExperience.${index}.isCurrent`);
                                        return (
                                        <FormItem className="flex flex-col"><FormLabel className="text-sm">End Date</FormLabel>
                                            <Popover><PopoverTrigger asChild><FormControl>
                                                <Button variant="outline" disabled={isCurrent} className={cn('w-full h-8 justify-start text-left font-normal text-sm', !field.value && 'text-muted-foreground')} aria-label="Select end date">
                                                    <CalendarIcon className="mr-2 h-3 w-3" />
                                                    {isCurrent ? 'Present' : field.value ? format(field.value, 'dd-MMM-yyyy') : <span>Pick a date</span>}
                                                </Button>
                                            </FormControl></PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar mode="single" captionLayout="dropdown-buttons" fromYear={1980} toYear={currentYear} selected={field.value ?? undefined} onSelect={field.onChange} initialFocus />
                                            </PopoverContent>
                                            </Popover><FormMessage />
                                        </FormItem>
                                    )}} />
                                </div>
                                 <FormField control={form.control} name={`workExperience.${index}.isCurrent`} render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                        <FormLabel className="text-sm font-normal">I currently work here</FormLabel>
                                    </FormItem>
                                )} />
                                <FormField name={`workExperience.${index}.descriptionPoints`} control={form.control} render={({ field }) => (<FormItem><FormLabel className="text-sm">Description (one point per line)</FormLabel><FormControl><Textarea className="min-h-[80px] text-sm" {...field} aria-describedby={`work-desc-${index}-error`} /></FormControl><FormMessage id={`work-desc-${index}-error`} /></FormItem>)} />
                            </div>
                        ))}
                    </div>
                    
                    <Separator/>
                    
                    {/* Projects */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                          <h4 className="font-medium text-base">Projects</h4>
                          <Button type="button" size="sm" className="h-8 text-xs" onClick={() => appendProject({ name: '', startDate: new Date(), endDate: null, isCurrent: false, description: '' })} aria-label="Add new project"><Plus className="mr-1 h-3 w-3"/>Add Project</Button>
                      </div>
                      {projectFields.map((field, index) => (
                          <div key={field.id} className="space-y-2 p-3 border rounded-md relative" role="group" aria-label={`Project ${index + 1}`}>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button type="button" variant="ghost" size="sm" className="absolute top-1 right-1 h-6 w-6" aria-label={`Delete project ${index + 1}`}><Trash2 className="text-destructive h-3 w-3"/></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Remove Project?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to remove this project entry?
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => removeProject(index)} className="bg-destructive hover:bg-destructive/90">Remove</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              <FormField name={`projects.${index}.name`} control={form.control} render={({ field }) => (<FormItem><FormLabel className="text-sm">Project Name</FormLabel><FormControl><Input className="h-8" {...field} aria-describedby={`project-name-${index}-error`} /></FormControl><FormMessage id={`project-name-${index}-error`} /></FormItem>)} />
                              
                               <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <FormField control={form.control} name={`projects.${index}.startDate`} render={({ field }) => (
                                        <FormItem className="flex flex-col"><FormLabel className="text-sm">Start Date</FormLabel>
                                            <Popover><PopoverTrigger asChild><FormControl>
                                                <Button variant="outline" className={cn('w-full h-8 justify-start text-left font-normal text-sm', !field.value && 'text-muted-foreground')} aria-label="Select project start date">
                                                    <CalendarIcon className="mr-2 h-3 w-3" />
                                                    {field.value ? format(field.value, 'dd-MMM-yyyy') : <span>Pick a date</span>}
                                                </Button>
                                            </FormControl></PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar mode="single" captionLayout="dropdown-buttons" fromYear={1980} toYear={currentYear} selected={field.value ?? undefined} onSelect={field.onChange} initialFocus />
                                            </PopoverContent>
                                            </Popover><FormMessage />
                                        </FormItem>
                                    )} />
                                     <FormField control={form.control} name={`projects.${index}.endDate`} render={({ field }) => {
                                        const isCurrent = form.watch(`projects.${index}.isCurrent`);
                                        return (
                                        <FormItem className="flex flex-col"><FormLabel className="text-sm">End Date</FormLabel>
                                            <Popover><PopoverTrigger asChild><FormControl>
                                                <Button variant="outline" disabled={isCurrent} className={cn('w-full h-8 justify-start text-left font-normal text-sm', !field.value && 'text-muted-foreground')} aria-label="Select project end date">
                                                    <CalendarIcon className="mr-2 h-3 w-3" />
                                                    {isCurrent ? 'Present' : field.value ? format(field.value, 'dd-MMM-yyyy') : <span>Pick a date</span>}
                                                </Button>
                                            </FormControl></PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar mode="single" captionLayout="dropdown-buttons" fromYear={1980} toYear={currentYear} selected={field.value ?? undefined} onSelect={field.onChange} initialFocus />
                                            </PopoverContent>
                                            </Popover><FormMessage />
                                        </FormItem>
                                    )}} />
                                </div>
                                <FormField control={form.control} name={`projects.${index}.isCurrent`} render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                        <FormLabel className="text-sm font-normal">This is an ongoing project</FormLabel>
                                    </FormItem>
                                )} />
                              <FormField name={`projects.${index}.description`} control={form.control} render={({ field }) => (<FormItem><FormLabel className="text-sm">Description</FormLabel><FormControl><Textarea className="min-h-[80px] text-sm" {...field} aria-describedby={`project-desc-${index}-error`} /></FormControl><FormMessage id={`project-desc-${index}-error`} /></FormItem>)} />
                          </div>
                      ))}
                    </div>

                    <Separator/>

                    {/* Education */}
                     <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <h4 className="font-medium text-base">Education</h4>
                            <Button type="button" size="sm" className="h-8 text-xs" onClick={() => appendEducation({ institution: '', degree: '', location: '', gpa: '', endDate: new Date() })} aria-label="Add new education entry"><Plus className="mr-1 h-3 w-3"/>Add Education</Button>
                        </div>
                        {educationFields.map((field, index) => (
                            <div key={field.id} className="space-y-2 p-3 border rounded-md relative" role="group" aria-label={`Education ${index + 1}`}>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button type="button" variant="ghost" size="sm" className="absolute top-1 right-1 h-6 w-6" aria-label={`Delete education entry ${index + 1}`}><Trash2 className="text-destructive h-3 w-3"/></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Remove Education Entry?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to remove this education entry?
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => removeEducation(index)} className="bg-destructive hover:bg-destructive/90">Remove</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                <FormField name={`education.${index}.institution`} control={form.control} render={({ field }) => (<FormItem><FormLabel className="text-sm">Institution</FormLabel><FormControl><Input className="h-8" {...field} aria-describedby={`education-institution-${index}-error`} /></FormControl><FormMessage id={`education-institution-${index}-error`} /></FormItem>)} />
                                <FormField name={`education.${index}.degree`} control={form.control} render={({ field }) => (<FormItem><FormLabel className="text-sm">Degree/Course</FormLabel><FormControl><Input className="h-8" {...field} aria-describedby={`education-degree-${index}-error`} /></FormControl><FormMessage id={`education-degree-${index}-error`} /></FormItem>)} />
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                  <FormField name={`education.${index}.location`} control={form.control} render={({ field }) => (<FormItem><FormLabel className="text-sm">Location</FormLabel><FormControl><Input className="h-8" {...field} aria-describedby={`education-location-${index}-error`} /></FormControl><FormMessage id={`education-location-${index}-error`} /></FormItem>)} />
                                  <FormField name={`education.${index}.gpa`} control={form.control} render={({ field }) => (<FormItem><FormLabel className="text-sm">GPA / %</FormLabel><FormControl><Input className="h-8" {...field} aria-describedby={`education-gpa-${index}-error`} /></FormControl><FormMessage id={`education-gpa-${index}-error`} /></FormItem>)} />
                                </div>
                                <FormField control={form.control} name={`education.${index}.endDate`} render={({ field }) => (
                                    <FormItem className="flex flex-col"><FormLabel className="text-sm">Completion Date</FormLabel>
                                        <Popover><PopoverTrigger asChild><FormControl>
                                            <Button variant="outline" className={cn('w-full h-8 justify-start text-left font-normal text-sm', !field.value && 'text-muted-foreground')} aria-label="Select completion date">
                                                <CalendarIcon className="mr-2 h-3 w-3" />
                                                {field.value ? format(field.value, 'dd-MMM-yyyy') : <span>Pick a date</span>}
                                            </Button>
                                        </FormControl></PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" captionLayout="dropdown-buttons" fromYear={1980} toYear={currentYear} selected={field.value ?? undefined} onSelect={field.onChange} initialFocus />
                                        </PopoverContent>
                                        </Popover><FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        ))}
                    </div>

                  </div>
                </ScrollArea>
                <DialogFooter className="mt-auto border-t pt-4 flex flex-row gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)} className="h-9">Close</Button>
                  <Button type="submit" form="resume-form" disabled={form.formState.isSubmitting || (Object.keys(form.formState.errors).length > 0 && form.formState.isSubmitted)} className="h-9">
                    {form.formState.isSubmitting ? 'Saving...' : 'Save Details'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
