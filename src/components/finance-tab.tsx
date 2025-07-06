'use client'

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Loan, LoanStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Pencil, Trash2, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

interface FinanceTabProps {
    loans: Loan[];
    emergencyFund: string;
    sipStarted: boolean;
    onUpdateLoanStatus: (loanId: string, status: LoanStatus) => void;
    onUpdateEmergencyFund: (amount: string) => void;
    onToggleSip: (started: boolean) => void;
    onAddLoan: (name: string, principal: string) => void;
    onUpdateLoan: (id: string, name: string, principal: string) => void;
    onDeleteLoan: (id: string) => void;
}

const loanSchema = z.object({
  name: z.string().min(3, { message: 'Loan name must be at least 3 characters.' }),
  principal: z.string().min(1, { message: 'Principal amount is required.' }),
});

export default function FinanceTab({ 
    loans, 
    emergencyFund, 
    sipStarted, 
    onUpdateLoanStatus, 
    onUpdateEmergencyFund, 
    onToggleSip,
    onAddLoan,
    onUpdateLoan,
    onDeleteLoan
}: FinanceTabProps) {
    const [fundInput, setFundInput] = useState(emergencyFund);
    const [isLoanDialogOpen, setLoanDialogOpen] = useState(false);
    const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof loanSchema>>({
        resolver: zodResolver(loanSchema),
        defaultValues: { name: '', principal: '' },
    });

    useEffect(() => {
        if (isLoanDialogOpen) {
            if (editingLoan) {
                form.reset({
                    name: editingLoan.name,
                    principal: editingLoan.principal
                });
            } else {
                form.reset({ name: '', principal: '' });
            }
        }
    }, [isLoanDialogOpen, editingLoan, form]);

    const handleOpenDialog = (loan: Loan | null) => {
        setEditingLoan(loan);
        setLoanDialogOpen(true);
    };

    const onSubmit = (values: z.infer<typeof loanSchema>) => {
        if (editingLoan) {
            onUpdateLoan(editingLoan.id, values.name, values.principal);
            toast({ title: 'Loan Updated!', description: `"${values.name}" has been updated.` });
        } else {
            onAddLoan(values.name, values.principal);
            toast({ title: 'Loan Added!', description: `"${values.name}" has been added to your list.` });
        }
        setLoanDialogOpen(false);
    };

    const handleUpdateClick = () => {
        if (fundInput && !isNaN(parseFloat(fundInput))) {
            onUpdateEmergencyFund(fundInput);
            toast({ title: 'Emergency Fund Updated!' });
        }
    };
    
    const emergencyFundTarget = 40000;
    const emergencyFundCurrent = parseFloat(emergencyFund) || 0;
    const emergencyFundProgress = Math.min((emergencyFundCurrent / emergencyFundTarget) * 100, 100);

    return (
        <div>
            <h2 className="text-xl font-bold text-foreground mb-4">Loan & Investment Tracker</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg">Loan Repayment Status</CardTitle>
                                <Button size="sm" onClick={() => handleOpenDialog(null)}><PlusCircle /> Add Loan</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <div className="overflow-x-auto rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Loan</TableHead>
                                            <TableHead>Principal</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loans.length === 0 ? (
                                             <TableRow>
                                                <TableCell colSpan={4} className="text-center text-muted-foreground">No loans added yet.</TableCell>
                                             </TableRow>
                                        ) : (
                                            loans.map((loan) => (
                                                <TableRow key={loan.id}>
                                                    <TableCell className="font-medium">{loan.name}</TableCell>
                                                    <TableCell>{loan.principal}</TableCell>
                                                    <TableCell>
                                                        <Select value={loan.status} onValueChange={(value: LoanStatus) => onUpdateLoanStatus(loan.id, value)}>
                                                            <SelectTrigger className="w-[120px]">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Active">Active</SelectItem>
                                                                <SelectItem value="Closed">Closed</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(loan)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        This action will permanently delete the loan "{loan.name}". This cannot be undone.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => onDeleteLoan(loan.id)}>Delete</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                             </div>
                        </CardContent>
                    </Card>
                </div>
                <div>
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Investment Growth</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h4 className="font-medium text-foreground mb-2">Emergency Fund</h4>
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className="text-2xl font-bold text-primary">₹{emergencyFundCurrent.toLocaleString('en-IN')}</span>
                                    <span className="text-sm text-muted-foreground">/ ₹{emergencyFundTarget.toLocaleString('en-IN')}</span>
                                </div>
                                <Progress value={emergencyFundProgress} className="h-2" />
                                <div className="flex items-center mt-4 gap-2">
                                    <Input 
                                      type="number" 
                                      id="emergency-fund-input" 
                                      value={fundInput}
                                      onChange={(e) => setFundInput(e.target.value)}
                                      placeholder="Update amount"
                                      className="h-9"
                                    />
                                    <Button onClick={handleUpdateClick} size="sm">Update</Button>
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <h4 className="font-medium text-foreground">SIP Planner</h4>
                                <p className="text-sm text-muted-foreground mt-1">Goal: Start with ₹1,000–₹2,000/month after the car is sold.</p>
                                <div className="mt-4 bg-muted/50 p-4 rounded-lg">
                                    <div className="flex items-center">
                                        <Checkbox
                                          id="sip-check"
                                          className="mr-3"
                                          checked={sipStarted}
                                          onCheckedChange={(checked) => onToggleSip(!!checked)}
                                         />
                                        <label htmlFor="sip-check" className={cn("text-sm font-medium", sipStarted && "line-through text-muted-foreground")}>
                                            I have started my first SIP
                                        </label>
                                    </div>
                                    {!sipStarted && (
                                        <p className="text-xs text-muted-foreground mt-2 pl-7">
                                            Platforms to consider: Groww, Zerodha Coin, or Kuvera.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={isLoanDialogOpen} onOpenChange={setLoanDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingLoan ? 'Edit Loan' : 'Add New Loan'}</DialogTitle>
                        <DialogDescription>
                            {editingLoan ? 'Update the details of your loan.' : 'Enter the details for the new loan.'}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                             <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Loan Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Personal Loan" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="principal"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Principal Amount</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., ₹50,000" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setLoanDialogOpen(false)}>Cancel</Button>
                                <Button type="submit">{editingLoan ? 'Save Changes' : 'Add Loan'}</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
