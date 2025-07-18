'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Loan, LoanStatus, IncomeSource, SIP } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Pencil, Trash2, Plus, Eye, EyeOff, Target, Banknote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import AiSuggestionSection from './ai-suggestion-section';

interface FinanceTabProps {
    loans: Loan[];
    emergencyFund: string;
    emergencyFundTarget: string;
    sips: SIP[];
    incomeSources: IncomeSource[];
    onUpdateLoanStatus: (loanId: string, status: LoanStatus) => void;
    onUpdateEmergencyFund: (amount: string) => void;
    onUpdateEmergencyFundTarget: (target: string) => void;
    onAddSip: (sip: Omit<SIP, 'id'>) => void;
    onUpdateSip: (sip: SIP) => void;
    onDeleteSip: (sipId: string) => void;
    onAddLoan: (name: string, principal: string, rate?: string, tenure?: string, emisPaid?: string) => void;
    onUpdateLoan: (id: string, name: string, principal: string, rate?: string, tenure?: string, emisPaid?: string) => void;
    onDeleteLoan: (id: string) => void;
    onAddIncomeSource: (source: Omit<IncomeSource, 'id'>) => void;
    onUpdateIncomeSource: (source: IncomeSource) => void;
    onDeleteIncomeSource: (sourceId: string) => void;
}

const loanSchema = z.object({
  name: z.string().min(3, { message: 'Loan name must be at least 3 characters.' }),
  principal: z.string().min(1, { message: 'Principal amount is required.' }),
  rate: z.string().optional(),
  tenure: z.string().optional(),
  emisPaid: z.string().optional(),
});

const LoanCalculations = ({ loan }: { loan: Loan }) => {
    const p = parseFloat(loan.principal);
    const r = loan.rate ? parseFloat(loan.rate) / 100 / 12 : undefined;
    const n = loan.tenure ? parseInt(loan.tenure, 10) : undefined;
    
    let emi = 0;
    if (p > 0 && r !== undefined && r > 0 && n !== undefined && n > 0) {
        emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }
    const totalPayable = emi * (n || 0);
    const totalInterest = totalPayable > 0 ? totalPayable - p : 0;
    const paidCount = loan.emisPaid ? parseInt(loan.emisPaid, 10) : 0;
    const remainingEmis = (n || 0) - paidCount;
    const remainingAmount = loan.status === 'Closed' ? 0 : emi * remainingEmis;
        
    return (
        <div className="space-y-2">
            {emi > 0 && n !== undefined && n > 0 ? (
                <>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">EMI</span>
                        <span className="font-medium text-right">₹{emi.toLocaleString('en-IN', { maximumFractionDigits: 0 })} / month</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Interest</span>
                        <span className="font-medium text-destructive text-right">₹{totalInterest.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Payable</span>
                        <span className="font-medium text-right">₹{totalPayable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                     <div className="flex justify-between text-sm pt-2 mt-2 border-t">
                        <span className="text-muted-foreground">Remaining Payable</span>
                        <span className="font-medium text-right">₹{remainingAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                </>
            ) : p > 0 && r !== undefined && r > 0 ? (
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Simple Monthly Interest</span>
                    <span className="font-medium text-right">₹{(p * r).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
            ) : (
                 <p className="text-xs text-center text-muted-foreground pt-2">Enter a valid rate and tenure to see calculations.</p>
            )}
        </div>
    );
};

export default function FinanceTab({ 
    loans, 
    emergencyFund, 
    emergencyFundTarget,
    sips,
    incomeSources,
    onUpdateLoanStatus, 
    onUpdateEmergencyFund, 
    onUpdateEmergencyFundTarget,
    onAddSip,
    onUpdateSip,
    onDeleteSip,
    onAddLoan,
    onUpdateLoan,
    onDeleteLoan,
    onAddIncomeSource,
    onUpdateIncomeSource,
    onDeleteIncomeSource,
}: FinanceTabProps) {
    const [isLoanDialogOpen, setLoanDialogOpen] = useState(false);
    const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof loanSchema>>({
        resolver: zodResolver(loanSchema),
        defaultValues: { name: '', principal: '', rate: '', tenure: '', emisPaid: '' },
    });

    const handleOpenDialog = (loan: Loan | null) => {
        setEditingLoan(loan);
        if (loan) {
            form.reset({
                name: loan.name,
                principal: loan.principal,
                rate: loan.rate || '',
                tenure: loan.tenure || '',
                emisPaid: loan.emisPaid || '0'
            });
        } else {
            form.reset({ name: '', principal: '', rate: '', tenure: '', emisPaid: '0' });
        }
        setLoanDialogOpen(true);
    };

    const handleDialogChange = (open: boolean) => {
        setLoanDialogOpen(open);
        if (!open) {
            setEditingLoan(null);
        }
    }

    const onSubmit = (values: z.infer<typeof loanSchema>) => {
        if (editingLoan) {
            onUpdateLoan(editingLoan.id, values.name, values.principal, values.rate, values.tenure, values.emisPaid);
            toast({ title: 'Loan Updated!', description: `"${values.name}" has been updated.` });
        } else {
            onAddLoan(values.name, values.principal, values.rate, values.tenure, values.emisPaid);
            toast({ title: 'Loan Added!', description: `"${values.name}" has been added to your list.` });
        }
        handleDialogChange(false);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Loan & Investment Tracker</h2>
                    <p className="mt-1 text-muted-foreground">Manage your debts and grow your wealth.</p>
                </div>
                <Button onClick={() => handleOpenDialog(null)} className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4"/> Add Loan</Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Your Loans</CardTitle>
                    <CardDescription>An overview of your active and closed loans.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loans.length > 0 ? (
                        <div className="space-y-6">
                            {loans.map(loan => {
                                const isClosed = loan.status === 'Closed';
                                const n = loan.tenure ? parseInt(loan.tenure, 10) : 0;
                                const paidCount = loan.emisPaid ? parseInt(loan.emisPaid, 10) : 0;
                                const emiProgress = n > 0 ? (paidCount / n) * 100 : 0;
                                const hasTenure = n > 0;
                                
                                return (
                                <div key={loan.id} className={cn(
                                    "p-4 border rounded-lg transition-colors",
                                    isClosed ? 'bg-muted/50 text-muted-foreground' : 'bg-background'
                                )}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                            <h4 className={cn("font-semibold text-lg", !isClosed && "text-card-foreground")}>{loan.name}</h4>
                                            <Select value={loan.status} onValueChange={(value: LoanStatus) => onUpdateLoanStatus(loan.id, value)}>
                                                <SelectTrigger className="w-full sm:w-[120px] h-9 text-sm">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Active">Active</SelectItem>
                                                    <SelectItem value="Closed">Closed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(loan)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
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
                                        </div>
                                    </div>
                                    <Separator className="my-4" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                        <div className="space-y-2">
                                            <h5 className="text-sm font-medium text-muted-foreground">Loan Details</h5>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Principal</span>
                                                <span className="font-semibold text-right">₹{parseFloat(loan.principal).toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Interest Rate</span>
                                                <span className="font-medium text-right">{loan.rate || 'N/A'}%</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Tenure</span>
                                                <span className="font-medium text-right">{loan.tenure || 'N/A'} months</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <h5 className="text-sm font-medium text-muted-foreground">Repayment Summary</h5>
                                            <LoanCalculations loan={loan} />
                                        </div>
                                    </div>
                                     {hasTenure && (
                                        <div className="mt-4 pt-4 border-t">
                                            <h6 className="text-sm font-medium text-muted-foreground mb-2">EMI Repayment Progress</h6>
                                            <Progress value={isClosed ? 100 : emiProgress} />
                                            <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                                <span>{isClosed ? n : paidCount} / {n} EMIs Paid</span>
                                                <span>{isClosed ? 100 : Math.round(emiProgress)}% Complete</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )})}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-8">
                            No loans added yet. Click "Add Loan" to get started.
                        </div>
                    )}
                </CardContent>
            </Card>

            <SavingsAndInvestmentsCard
              emergencyFund={emergencyFund}
              emergencyFundTarget={emergencyFundTarget}
              sips={sips}
              onUpdateEmergencyFund={onUpdateEmergencyFund}
              onUpdateEmergencyFundTarget={onUpdateEmergencyFundTarget}
              onAddSip={onAddSip}
              onUpdateSip={onUpdateSip}
              onDeleteSip={onDeleteSip}
            />
            
            <MonthlyIncomeCard
                incomeSources={incomeSources}
                onAddSource={onAddIncomeSource}
                onUpdateSource={onUpdateIncomeSource}
                onDeleteSource={onDeleteIncomeSource}
            />

            <Dialog open={isLoanDialogOpen} onOpenChange={handleDialogChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingLoan ? 'Edit Loan' : 'Add New Loan'}</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                             <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Loan Name</FormLabel>
                                        <FormControl><Input placeholder="e.g., Personal Loan" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="principal"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Principal Amount (₹)</FormLabel>
                                        <FormControl><Input type="number" placeholder="e.g., 50000" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="rate"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Interest Rate (%)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="e.g., 9.5" {...field} step="0.01"/>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="tenure"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tenure (Months)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="e.g., 48" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="emisPaid"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>EMIs Already Paid (Optional)</FormLabel>
                                        <FormControl><Input type="number" placeholder="e.g., 6" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>Cancel</Button>
                                <Button type="submit">{editingLoan ? 'Save Changes' : 'Add Loan'}</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
            <AiSuggestionSection
                moduleName="Finance"
                title="AI Financial Advisor"
                description="Receive tips on managing loans, building your emergency fund, and starting investments."
                contextData={{ loans, emergencyFund }}
            />
        </div>
    );
}

const sipSchema = z.object({
    name: z.string().min(3, { message: 'SIP name must be at least 3 characters.' }),
    amount: z.string().min(1, { message: 'Amount is required.' }),
    frequency: z.enum(['Monthly', 'Quarterly', 'Annually']),
    startDate: z.string().optional(),
    targetAmount: z.string().optional(),
});

function SavingsAndInvestmentsCard({
    emergencyFund,
    emergencyFundTarget,
    sips,
    onUpdateEmergencyFund,
    onUpdateEmergencyFundTarget,
    onAddSip,
    onUpdateSip,
    onDeleteSip,
}: {
    emergencyFund: string;
    emergencyFundTarget: string;
    sips: SIP[];
    onUpdateEmergencyFund: (amount: string) => void;
    onUpdateEmergencyFundTarget: (target: string) => void;
    onAddSip: (sip: Omit<SIP, 'id'>) => void;
    onUpdateSip: (sip: SIP) => void;
    onDeleteSip: (sipId: string) => void;
}) {
    const { toast } = useToast();
    const [isSipDialogOpen, setSipDialogOpen] = useState(false);
    const [editingSip, setEditingSip] = useState<SIP | null>(null);

    const sipForm = useForm<z.infer<typeof sipSchema>>({
        resolver: zodResolver(sipSchema),
        defaultValues: { name: '', amount: '', frequency: 'Monthly', startDate: '', targetAmount: '' },
    });

    const handleOpenSipDialog = (sip: SIP | null) => {
        setEditingSip(sip);
        if (sip) {
            sipForm.reset({
                name: sip.name,
                amount: sip.amount,
                frequency: sip.frequency,
                startDate: sip.startDate || '',
                targetAmount: sip.targetAmount || '',
            });
        } else {
            sipForm.reset({ name: '', amount: '', frequency: 'Monthly', startDate: '', targetAmount: '' });
        }
        setSipDialogOpen(true);
    };

    const handleSipDialogChange = (open: boolean) => {
        setSipDialogOpen(open);
        if (!open) {
            setEditingSip(null);
        }
    };

    const onSipSubmit = (values: z.infer<typeof sipSchema>) => {
        if (editingSip) {
            onUpdateSip({ ...editingSip, ...values });
            toast({ title: 'SIP Updated!', description: `"${values.name}" has been updated.` });
        } else {
            onAddSip(values);
            toast({ title: 'SIP Added!', description: `"${values.name}" has been added to your investments.` });
        }
        handleSipDialogChange(false);
    };

    const emergencyFundProgress = useMemo(() => {
        const current = parseFloat(emergencyFund || '0');
        const target = parseFloat(emergencyFundTarget || '0');
        if (target === 0) return 0;
        return (current / target) * 100;
    }, [emergencyFund, emergencyFundTarget]);

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Savings & Investments</CardTitle>
                    <CardDescription>Track your emergency fund and systematic investment plans.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-lg">Emergency Fund</h4>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => {
                                    const newAmount = prompt("Enter new emergency fund amount:", emergencyFund);
                                    if (newAmount !== null) onUpdateEmergencyFund(newAmount);
                                }}>
                                    <Banknote className="mr-2 h-4 w-4" /> Update Fund
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => {
                                    const newTarget = prompt("Enter new emergency fund target:", emergencyFundTarget);
                                    if (newTarget !== null) onUpdateEmergencyFundTarget(newTarget);
                                }}>
                                    <Target className="mr-2 h-4 w-4" /> Set Target
                                </Button>
                            </div>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground mb-2">
                            <span>Current: <span className="font-medium text-foreground">₹{parseFloat(emergencyFund || '0').toLocaleString('en-IN')}</span></span>
                            <span>Target: <span className="font-medium text-foreground">₹{parseFloat(emergencyFundTarget || '0').toLocaleString('en-IN')}</span></span>
                        </div>
                        <Progress value={emergencyFundProgress} />
                        <p className="text-xs text-muted-foreground mt-2">
                            {emergencyFundTarget === '0' ? 'Set a target to track progress.' : `${Math.round(emergencyFundProgress)}% of target achieved.`}
                        </p>
                    </div>

                    <Separator />

                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-lg">Systematic Investment Plans (SIPs)</h4>
                            <Button size="sm" onClick={() => handleOpenSipDialog(null)}>
                                <Plus className="mr-2 h-4 w-4" /> Add SIP
                            </Button>
                        </div>
                        {sips.length > 0 ? (
                            <div className="space-y-3">
                                {sips.map(sip => (
                                    <div key={sip.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{sip.name}</span>
                                            <span className="text-sm text-muted-foreground">₹{parseFloat(sip.amount).toLocaleString('en-IN')} {sip.frequency}</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenSipDialog(sip)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete SIP?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will permanently delete "{sip.name}". This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => onDeleteSip(sip.id)}>Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-sm text-muted-foreground py-4">No SIPs added yet. Click "Add SIP" to get started.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isSipDialogOpen} onOpenChange={handleSipDialogChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingSip ? 'Edit SIP' : 'Add New SIP'}</DialogTitle>
                    </DialogHeader>
                    <Form {...sipForm}>
                        <form onSubmit={sipForm.handleSubmit(onSipSubmit)} className="space-y-4 py-4">
                            <FormField
                                control={sipForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>SIP Name</FormLabel>
                                        <FormControl><Input placeholder="e.g., Nifty 50 Index Fund" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={sipForm.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Amount (₹)</FormLabel>
                                        <FormControl><Input type="number" placeholder="e.g., 5000" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={sipForm.control}
                                name="frequency"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Frequency</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select frequency" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Monthly">Monthly</SelectItem>
                                                <SelectItem value="Quarterly">Quarterly</SelectItem>
                                                <SelectItem value="Annually">Annually</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={sipForm.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Start Date (Optional)</FormLabel>
                                        <FormControl><Input type="date" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={sipForm.control}
                                name="targetAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Target Amount (Optional)</FormLabel>
                                        <FormControl><Input type="number" placeholder="e.g., 100000" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => handleSipDialogChange(false)}>Cancel</Button>
                                <Button type="submit">{editingSip ? 'Save Changes' : 'Add SIP'}</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    );
}

const incomeSourceSchema = z.object({
    name: z.string().min(2, { message: 'Source name must be at least 2 characters.' }),
    amount: z.string().min(1, { message: 'Amount is required.' }),
});

function MonthlyIncomeCard({ 
    incomeSources, 
    onAddSource, 
    onUpdateSource, 
    onDeleteSource 
}: { 
    incomeSources: IncomeSource[];
    onAddSource: (source: Omit<IncomeSource, 'id'>) => void;
    onUpdateSource: (source: IncomeSource) => void;
    onDeleteSource: (sourceId: string) => void;
}) {
    const { toast } = useToast();
    const [isVisible, setIsVisible] = useState(false);
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [editingSource, setEditingSource] = useState<IncomeSource | null>(null);

    const form = useForm<z.infer<typeof incomeSourceSchema>>({
        resolver: zodResolver(incomeSourceSchema),
        defaultValues: { name: '', amount: '' },
    });

    const totalIncome = useMemo(() => {
        return incomeSources.reduce((sum, source) => sum + (parseFloat(source.amount) || 0), 0);
    }, [incomeSources]);

    const handleOpenDialog = (source: IncomeSource | null) => {
        setEditingSource(source);
        if (source) {
            form.reset({ name: source.name, amount: source.amount });
        } else {
            form.reset({ name: '', amount: '' });
        }
        setDialogOpen(true);
    };

    const onSubmit = (values: z.infer<typeof incomeSourceSchema>) => {
        if (editingSource) {
            onUpdateSource({ ...editingSource, ...values });
            toast({ title: "Income source updated!" });
        } else {
            onAddSource(values);
            toast({ title: "Income source added!" });
        }
        setIsVisible(false);
        setDialogOpen(false);
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Monthly Income</CardTitle>
                            <CardDescription>Track all your sources of income.</CardDescription>
                        </div>
                        <div className="flex w-full shrink-0 gap-2 sm:w-auto">
                            <Button variant="ghost" size="icon" onClick={() => setIsVisible(!isVisible)}>
                                {isVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </Button>
                            <Button size="sm" onClick={() => handleOpenDialog(null)} className="w-full sm:w-auto">
                                <Plus className="mr-2 h-4 w-4" /> Add Source
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {incomeSources.map(source => (
                            <div key={source.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <span className="font-medium flex-grow min-w-0">{source.name}</span>
                                <div className="flex items-center gap-4 shrink-0">
                                    <span className="text-lg font-mono">
                                        {isVisible ? `₹${parseFloat(source.amount || '0').toLocaleString('en-IN')}` : '₹ ••••••'}
                                    </span>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(source)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete income source?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently delete "{source.name}". This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => onDeleteSource(source.id)}>Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            </div>
                        ))}
                         {incomeSources.length === 0 && (
                            <p className="text-center text-sm text-muted-foreground py-4">No income sources added yet.</p>
                        )}
                    </div>
                </CardContent>
                {incomeSources.length > 0 && (
                    <CardContent>
                        <Separator />
                        <div className="flex justify-between items-center pt-4">
                            <span className="text-lg font-bold">Total Monthly Income</span>
                            <span className="text-xl font-bold font-mono text-primary">
                                {isVisible ? `₹${totalIncome.toLocaleString('en-IN')}` : '₹ ••••••'}
                            </span>
                        </div>
                    </CardContent>
                )}
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingSource ? 'Edit Income Source' : 'Add New Income Source'}</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Source Name</FormLabel>
                                        <FormControl><Input placeholder="e.g., Freelance Project" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Amount (₹)</FormLabel>
                                        <FormControl><Input type="number" placeholder="e.g., 15000" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                                <Button type="submit">Save Source</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    )
}
