
'use client'

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { JobApplication, JobStatus } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Trash2, Plus } from 'lucide-react';

interface JobSearchTabProps {
    applications: JobApplication[];
    onAddApplication: (company: string, role: string) => void;
    onUpdateStatus: (index: number, status: JobStatus) => void;
    onDelete: (index: number) => void;
}

const appSchema = z.object({
  company: z.string().min(1, 'Company name is required.'),
  role: z.string().min(1, 'Role is required.'),
});


export default function JobSearchTab({ applications, onAddApplication, onUpdateStatus, onDelete }: JobSearchTabProps) {
    const [isDialogOpen, setDialogOpen] = useState(false);

    const form = useForm<z.infer<typeof appSchema>>({
        resolver: zodResolver(appSchema),
        defaultValues: { company: '', role: '' },
    });

    const onSubmit = (values: z.infer<typeof appSchema>) => {
        onAddApplication(values.company, values.role);
        setDialogOpen(false);
        form.reset();
    }

    return (
        <div>
            <div className="flex justify-center items-center mb-6 gap-4">
              <h2 className="text-xl font-bold text-foreground">Job Application Tracker</h2>
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
                                    <TableCell>{app.date}</TableCell>
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
        </div>
    )
}
