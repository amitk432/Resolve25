
'use client'

import React, { useState } from 'react';
import type { JobApplication, JobStatus } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface JobSearchTabProps {
    applications: JobApplication[];
    onAddApplication: (company: string, role: string) => void;
    onUpdateStatus: (index: number, status: JobStatus) => void;
    onDelete: (index: number) => void;
}

export default function JobSearchTab({ applications, onAddApplication, onUpdateStatus, onDelete }: JobSearchTabProps) {
    const [company, setCompany] = useState('');
    const [role, setRole] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (company && role) {
            onAddApplication(company, role);
            setCompany('');
            setRole('');
        }
    }

    return (
        <div>
            <h2 className="text-xl font-bold text-foreground mb-4">Job Application Tracker</h2>
            <Card className="mb-6">
                <CardContent className="p-4">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium">Company</label>
                            <Input value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g., Thoughtworks" className="mt-1" required/>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium">Role</label>
                            <Input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g., Sr. QA Engineer" className="mt-1" required/>
                        </div>
                        <div>
                            <Button type="submit" className="w-full">Add Application</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

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
