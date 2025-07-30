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
    onAddLoan: (name: string, principal: string, rate?: string, tenure?: string, emisPaid?: string, startDate?: string, endDate?: string) => void;
    onUpdateLoan: (id: string, name: string, principal: string, rate?: string, tenure?: string, emisPaid?: string, startDate?: string, endDate?: string) => void;
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
  startDate: z.string().optional(),
  endDate: z.string().optional(),
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

const LoanPaymentDetails = ({ loan }: { loan: Loan }) => {
    const p = parseFloat(loan.principal);
    const r = loan.rate ? parseFloat(loan.rate) / 100 / 12 : undefined;
    const n = loan.tenure ? parseInt(loan.tenure, 10) : undefined;
    const paidCount = loan.emisPaid ? parseInt(loan.emisPaid, 10) : 0;
    
    if (paidCount === 0) {
        return (
            <p className="text-xs text-center text-muted-foreground pt-2">No EMIs paid yet.</p>
        );
    }

    if (!r || !n || p <= 0 || r <= 0 || n <= 0) {
        return (
            <p className="text-xs text-center text-muted-foreground pt-2">Enter valid rate and tenure to see payment details.</p>
        );
    }

    const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;
    let balance = p;

    // Calculate cumulative payments
    for (let i = 0; i < paidCount; i++) {
        const interestPayment = balance * r;
        const principalPayment = emi - interestPayment;
        totalInterestPaid += interestPayment;
        totalPrincipalPaid += principalPayment;
        balance -= principalPayment;
    }

    const totalAmountPaid = totalInterestPaid + totalPrincipalPaid;

    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Paid</span>
                <span className="font-medium text-right">₹{totalAmountPaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Principal Paid</span>
                <span className="font-medium text-blue-600 text-right">₹{totalPrincipalPaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Interest Paid</span>
                <span className="font-medium text-red-600 text-right">₹{totalInterestPaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 mt-2 border-t">
                <span className="text-muted-foreground">EMIs Paid</span>
                <span className="font-medium text-right">{paidCount} / {n}</span>
            </div>
        </div>
    );
};

export default function FinanceTab({ 
    loans = [], 
    emergencyFund = '', 
    emergencyFundTarget = '',
    sips = [],
    incomeSources = [],
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
        defaultValues: { name: '', principal: '', rate: '', tenure: '', emisPaid: '', startDate: '', endDate: '' },
    });

    const handleOpenDialog = (loan: Loan | null) => {
        setEditingLoan(loan);
        if (loan) {
            form.reset({
                name: loan.name,
                principal: loan.principal,
                rate: loan.rate || '',
                tenure: loan.tenure || '',
                emisPaid: loan.emisPaid || '0',
                startDate: loan.startDate || '',
                endDate: loan.endDate || ''
            });
        } else {
            form.reset({ name: '', principal: '', rate: '', tenure: '', emisPaid: '0', startDate: '', endDate: '' });
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
            onUpdateLoan(editingLoan.id, values.name, values.principal, values.rate, values.tenure, values.emisPaid, values.startDate, values.endDate);
            toast({ title: 'Loan Updated!', description: `"${values.name}" has been updated.` });
        } else {
            onAddLoan(values.name, values.principal, values.rate, values.tenure, values.emisPaid, values.startDate, values.endDate);
            toast({ title: 'Loan Added!', description: `"${values.name}" has been added to your list.` });
        }
        handleDialogChange(false);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-foreground">Loan & Investment Tracker</h2>
                    <p className="mt-2 text-sm md:text-base text-muted-foreground">Manage your debts and grow your wealth.</p>
                </div>
                <Button onClick={() => handleOpenDialog(null)} className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4"/> Add Loan</Button>
            </div>
            
            <Card className="bg-white dark:bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-primary">Your Loans</CardTitle>
                    <CardDescription className="text-sm md:text-base text-muted-foreground">An overview of your active and closed loans.</CardDescription>
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
                                    isClosed ? 'bg-white dark:bg-card text-muted-foreground' : 'bg-white dark:bg-background'
                                )}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                            <h4 className={cn("font-semibold text-base sm:text-lg", !isClosed && "text-card-foreground")}>{loan.name}</h4>
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
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-4">
                                        <div className="space-y-2">
                                            <h5 className="text-sm font-medium text-muted-foreground">Loan Details</h5>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Principal</span>
                                                <span className="font-semibold text-right">₹{parseFloat(loan.principal).toLocaleString('en-IN')}</span>
                                            </div>
                                            {(() => {
                                                const p = parseFloat(loan.principal);
                                                const r = loan.rate ? parseFloat(loan.rate) / 100 / 12 : undefined;
                                                const n = loan.tenure ? parseInt(loan.tenure, 10) : undefined;
                                                const paidCount = loan.emisPaid ? parseInt(loan.emisPaid, 10) : 0;
                                                
                                                let principalRemaining = p;
                                                if (p > 0 && r !== undefined && r > 0 && n !== undefined && n > 0 && paidCount > 0) {
                                                    const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
                                                    let balance = p;
                                                    for (let i = 0; i < paidCount; i++) {
                                                        const interestPayment = balance * r;
                                                        const principalPayment = emi - interestPayment;
                                                        balance -= principalPayment;
                                                    }
                                                    principalRemaining = loan.status === 'Closed' ? 0 : Math.max(0, balance);
                                                }
                                                
                                                return (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Principal Remaining</span>
                                                        <span className="font-semibold text-right text-orange-600">₹{principalRemaining.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                                    </div>
                                                );
                                            })()}
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
                                        <div className="space-y-2">
                                            <h5 className="text-sm font-medium text-muted-foreground">Amounts Paid</h5>
                                            <LoanPaymentDetails loan={loan} />
                                        </div>
                                    </div>
                                     {hasTenure && (
                                        <div className="mt-4 pt-4 border-t">
                                            <div className="flex justify-between items-center mb-2">
                                                <h6 className="text-sm font-medium text-muted-foreground">EMI Repayment Progress</h6>
                                                <span className="text-xs font-semibold text-primary bg-primary/10 rounded px-2 py-1 border border-primary/30">
                                                    End: {(() => {
                                                      // Helper for formatting date as DD-Month-YYYY
                                                      const formatDate = (date: Date) => {
                                                        if (isNaN(date.getTime())) return 'N/A';
                                                        const day = String(date.getDate()).padStart(2, '0');
                                                        const month = date.toLocaleString('en-US', { month: 'long' });
                                                        const year = date.getFullYear();
                                                        return `${day}-${month}-${year}`;
                                                      };
                                                      // If endDate is provided, use it
                                                      if (loan.endDate) {
                                                        const d = new Date(loan.endDate);
                                                        return formatDate(d);
                                                      }
                                                      // If startDate is provided, use startDate + tenure
                                                      if (loan.startDate && loan.tenure) {
                                                        const start = new Date(loan.startDate);
                                                        if (!isNaN(start.getTime())) {
                                                          const total = parseInt(loan.tenure, 10) || 0;
                                                          const end = new Date(start);
                                                          end.setMonth(end.getMonth() + total);
                                                          return formatDate(end);
                                                        }
                                                      }
                                                      // If no startDate, but tenure and emisPaid are provided
                                                      if (loan.tenure && loan.emisPaid !== undefined) {
                                                        const total = parseInt(loan.tenure, 10) || 0;
                                                        const paid = parseInt(loan.emisPaid, 10) || 0;
                                                        const today = new Date();
                                                        // Calculate start month: current month - EMIs paid
                                                        const start = new Date(today);
                                                        start.setMonth(start.getMonth() - paid);
                                                        // End date: start + tenure
                                                        const end = new Date(start);
                                                        end.setMonth(end.getMonth() + total);
                                                        return formatDate(end);
                                                      }
                                                      return 'N/A';
                                                    })()}
                                                </span>
                                            </div>
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
            
            {/* Monthly Summary Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base sm:text-lg font-bold text-foreground">Monthly Summary</CardTitle>
                    <CardDescription>All upcoming payments and EMIs due this month</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {(() => {
                        const currentMonth = new Date().getMonth();
                        const currentYear = new Date().getFullYear();
                        let totalMonthlyPayments = 0;
                        let totalSimpleInterest = 0;
                        const monthlyPayments: { name: string; amount: number; type: string; dueDate?: string }[] = [];
                        const simpleInterestData: { name: string; principal: number; rate: number; interest: number }[] = [];
                        
                        // Calculate EMIs from active loans and Simple Interest for loans without tenure
                        loans.filter(loan => loan.status !== 'Closed').forEach(loan => {
                            const p = parseFloat(loan.principal);
                            const r = loan.rate ? parseFloat(loan.rate) / 100 / 12 : undefined;
                            const n = loan.tenure ? parseInt(loan.tenure, 10) : undefined;
                            
                            if (p > 0 && r !== undefined && r > 0) {
                                if (n !== undefined && n > 0) {
                                    // Calculate EMI for loans with tenure
                                    const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
                                    monthlyPayments.push({
                                        name: loan.name,
                                        amount: emi,
                                        type: 'EMI',
                                        dueDate: 'Every month'
                                    });
                                    totalMonthlyPayments += emi;
                                } else {
                                    // Calculate simple interest for loans without tenure
                                    const monthlyInterest = p * r;
                                    simpleInterestData.push({
                                        name: loan.name,
                                        principal: p,
                                        rate: loan.rate ? parseFloat(loan.rate) : 0,
                                        interest: monthlyInterest
                                    });
                                    totalSimpleInterest += monthlyInterest;
                                }
                            }
                        });
                        
                        // Add SIP investments
                        sips.forEach(sip => {
                            if (sip.frequency === 'Monthly') {
                                const amount = parseFloat(sip.amount);
                                monthlyPayments.push({
                                    name: sip.name,
                                    amount: amount,
                                    type: 'SIP',
                                    dueDate: 'Monthly'
                                });
                                totalMonthlyPayments += amount;
                            }
                        });
                        
                        return (
                            <div className="space-y-4">
                                {monthlyPayments.length > 0 ? (
                                    <>
                                        <div className="space-y-3">
                                            {monthlyPayments.map((payment, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                                                            payment.type === 'EMI' ? "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400" 
                                                            : "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                                        )}>
                                                            {payment.type === 'EMI' ? '₹' : '📈'}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-foreground text-sm">{payment.name}</p>
                                                            <p className="text-xs text-muted-foreground">{payment.type} • {payment.dueDate}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold text-foreground">₹{payment.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                                                        <p className="text-xs text-muted-foreground">{payment.type}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <Separator />
                                        
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <Banknote className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-foreground">Total Monthly Outflow</p>
                                                    <p className="text-sm text-muted-foreground">EMIs + Investments</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-bold text-primary">₹{totalMonthlyPayments.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                                                <p className="text-sm text-muted-foreground">per month</p>
                                            </div>
                                        </div>
                                        
                                        {/* Simple Monthly Interest Section */}
                                        {simpleInterestData.length > 0 && (
                                            <>
                                                <Separator />
                                                <div className="space-y-3">
                                                    <h4 className="font-medium text-foreground">Simple Monthly Interest</h4>
                                                    {simpleInterestData.map((item, index) => (
                                                        <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-border bg-blue-50/50 dark:bg-blue-900/10">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 flex items-center justify-center text-xs font-medium">
                                                                    %
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-foreground text-sm">{item.name}</p>
                                                                    <p className="text-xs text-muted-foreground">Principal: ₹{item.principal.toLocaleString('en-IN')} @ {item.rate}%</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-semibold text-blue-600">₹{item.interest.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                                                                <p className="text-xs text-muted-foreground">per month</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div className="flex items-center justify-between p-3 rounded-lg bg-blue-100/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                                                        <div>
                                                            <p className="font-semibold text-foreground">Total Simple Interest</p>
                                                            <p className="text-sm text-muted-foreground">Monthly interest on loans without EMI</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-lg font-bold text-blue-600">₹{totalSimpleInterest.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                                                            <p className="text-sm text-muted-foreground">per month</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        
                                        {/* Monthly Income vs Outflow Comparison */}
                                        {(() => {
                                            const totalMonthlyIncome = incomeSources.reduce((sum, source) => sum + parseFloat(source.amount), 0);
                                            const totalOutflow = totalMonthlyPayments + totalSimpleInterest;
                                            const remainingIncome = totalMonthlyIncome - totalOutflow;
                                            const outflowPercentage = totalMonthlyIncome > 0 ? (totalOutflow / totalMonthlyIncome) * 100 : 0;
                                            
                                            return totalMonthlyIncome > 0 ? (
                                                <div className="p-4 rounded-lg bg-muted/30 border border-border">
                                                    <h5 className="font-medium text-foreground mb-3">Income vs Outflow Analysis</h5>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground">Monthly Income</span>
                                                            <span className="font-medium text-green-600">₹{totalMonthlyIncome.toLocaleString('en-IN')}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground">Monthly Outflow (EMI + SIP)</span>
                                                            <span className="font-medium text-orange-600">₹{totalMonthlyPayments.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                                        </div>
                                                        {totalSimpleInterest > 0 && (
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-muted-foreground">Simple Interest</span>
                                                                <span className="font-medium text-blue-600">₹{totalSimpleInterest.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex justify-between text-sm pt-2 border-t">
                                                            <span className="text-muted-foreground">Total Monthly Outflow</span>
                                                            <span className="font-medium text-red-600">₹{totalOutflow.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground">Remaining Income</span>
                                                            <span className={cn("font-semibold", remainingIncome >= 0 ? "text-green-600" : "text-red-600")}>
                                                                ₹{remainingIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                                            </span>
                                                        </div>
                                                        <div className="mt-3">
                                                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                                                <span>Outflow Ratio</span>
                                                                <span>{outflowPercentage.toFixed(1)}% of income</span>
                                                            </div>
                                                            <Progress value={Math.min(outflowPercentage, 100)} className="h-2" />
                                                            {outflowPercentage > 70 && (
                                                                <p className="text-xs text-orange-600 mt-1">⚠️ High outflow ratio - consider reviewing expenses</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : null;
                                        })()}
                                    </>
                                ) : (
                                    <div className="text-center text-muted-foreground py-8">
                                        <Banknote className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p>No monthly payments or EMIs found.</p>
                                        <p className="text-sm">Add loans or SIPs to see your monthly summary.</p>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </CardContent>
            </Card>

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
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="startDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Start Date (Optional)</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="endDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>End Date (Optional)</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
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
                description="Get personalized financial advice based on your complete financial profile including loans, EMIs, emergency fund, SIPs, and income."
                showInput={true}
                contextData={{ 
                    loans, 
                    emergencyFund, 
                    emergencyFundTarget, 
                    sips, 
                    incomeSources,
                    financialSummary: {
                        totalMonthlyIncome: incomeSources.reduce((sum, source) => sum + parseFloat(source.amount), 0),
                        totalMonthlyOutflow: loans.filter(loan => loan.status !== 'Closed').reduce((sum, loan) => {
                            const p = parseFloat(loan.principal);
                            const r = loan.rate ? parseFloat(loan.rate) / 100 / 12 : undefined;
                            const n = loan.tenure ? parseInt(loan.tenure, 10) : undefined;
                            if (p > 0 && r !== undefined && r > 0 && n !== undefined && n > 0) {
                                const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
                                return sum + emi;
                            }
                            return sum;
                        }, 0) + sips.filter(sip => sip.frequency === 'Monthly').reduce((sum, sip) => sum + parseFloat(sip.amount), 0),
                        totalSimpleMonthlyInterest: loans.filter(loan => loan.status !== 'Closed').reduce((sum, loan) => {
                            const p = parseFloat(loan.principal);
                            const r = loan.rate ? parseFloat(loan.rate) / 100 / 12 : undefined;
                            const n = loan.tenure ? parseInt(loan.tenure, 10) : undefined;
                            if (p > 0 && r !== undefined && r > 0 && (!n || n <= 0)) {
                                return sum + (p * r);
                            }
                            return sum;
                        }, 0),
                        emergencyFundProgress: emergencyFund && emergencyFundTarget ? 
                            (parseFloat(emergencyFund) / parseFloat(emergencyFundTarget)) * 100 : 0,
                        totalActiveLoansPrincipal: loans.filter(loan => loan.status !== 'Closed').reduce((sum, loan) => sum + parseFloat(loan.principal), 0),
                        totalSipInvestments: sips.reduce((sum, sip) => sum + parseFloat(sip.amount), 0)
                    }
                }}
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

const emergencyFundSchema = z.object({
    amount: z.string().min(1, { message: 'Amount is required.' }),
});

const emergencyTargetSchema = z.object({
    target: z.string().min(1, { message: 'Target is required.' }),
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
    const [isEmergencyFundDialogOpen, setEmergencyFundDialogOpen] = useState(false);
    const [isEmergencyTargetDialogOpen, setEmergencyTargetDialogOpen] = useState(false);

    const sipForm = useForm<z.infer<typeof sipSchema>>({
        resolver: zodResolver(sipSchema),
        defaultValues: { name: '', amount: '', frequency: 'Monthly', startDate: '', targetAmount: '' },
    });

    const emergencyFundForm = useForm<z.infer<typeof emergencyFundSchema>>({
        resolver: zodResolver(emergencyFundSchema),
        defaultValues: { amount: emergencyFund || '' },
    });

    const emergencyTargetForm = useForm<z.infer<typeof emergencyTargetSchema>>({
        resolver: zodResolver(emergencyTargetSchema),
        defaultValues: { target: emergencyFundTarget || '' },
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

    const handleEmergencyFundUpdate = (data: z.infer<typeof emergencyFundSchema>) => {
        onUpdateEmergencyFund(data.amount);
        setEmergencyFundDialogOpen(false);
        emergencyFundForm.reset();
    };

    const handleEmergencyTargetUpdate = (data: z.infer<typeof emergencyTargetSchema>) => {
        onUpdateEmergencyFundTarget(data.target);
        setEmergencyTargetDialogOpen(false);
        emergencyTargetForm.reset();
    };

    const emergencyFundProgress = useMemo(() => {
        const current = parseFloat(emergencyFund || '0');
        const target = parseFloat(emergencyFundTarget || '0');
        if (target === 0) return 0;
        return (current / target) * 100;
    }, [emergencyFund, emergencyFundTarget]);

    return (
        <>
            <Card className="bg-white dark:bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-primary">Savings & Investments</CardTitle>
                    <CardDescription className="text-sm md:text-base text-muted-foreground">Track your emergency fund and systematic investment plans.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-base sm:text-lg">Emergency Fund</h4>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setEmergencyFundDialogOpen(true)}>
                                    <Banknote className="mr-2 h-4 w-4" /> Update Fund
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setEmergencyTargetDialogOpen(true)}>
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
                            <h4 className="font-semibold text-base sm:text-lg">Systematic Investment Plans (SIPs)</h4>
                            <Button size="sm" onClick={() => handleOpenSipDialog(null)}>
                                <Plus className="mr-2 h-4 w-4" /> Add SIP
                            </Button>
                        </div>
                        {sips.length > 0 ? (
                            <div className="space-y-3">
                                {sips.map(sip => (
                                    <div key={sip.id} className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-card border">
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

            {/* Emergency Fund Update Dialog */}
            <Dialog open={isEmergencyFundDialogOpen} onOpenChange={setEmergencyFundDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Update Emergency Fund</DialogTitle>
                        <DialogDescription>
                            Update your current emergency fund amount.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...emergencyFundForm}>
                        <form onSubmit={emergencyFundForm.handleSubmit(handleEmergencyFundUpdate)} className="space-y-4">
                            <FormField
                                control={emergencyFundForm.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Current Amount (₹)</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                placeholder="e.g., 50000" 
                                                {...field} 
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setEmergencyFundDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">Update Fund</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Emergency Fund Target Dialog */}
            <Dialog open={isEmergencyTargetDialogOpen} onOpenChange={setEmergencyTargetDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Set Emergency Fund Target</DialogTitle>
                        <DialogDescription>
                            Set your emergency fund target amount.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...emergencyTargetForm}>
                        <form onSubmit={emergencyTargetForm.handleSubmit(handleEmergencyTargetUpdate)} className="space-y-4">
                            <FormField
                                control={emergencyTargetForm.control}
                                name="target"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Target Amount (₹)</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                placeholder="e.g., 100000" 
                                                {...field} 
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setEmergencyTargetDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">Set Target</Button>
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
            <Card className="bg-white dark:bg-card border-border">
                <CardHeader>
                    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-sm font-medium text-primary">Monthly Income</CardTitle>
                            <CardDescription className="text-sm md:text-base text-muted-foreground">Track all your sources of income.</CardDescription>
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
                            <div key={source.id} className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-card border">
                                <span className="font-medium flex-grow min-w-0">{source.name}</span>
                                <div className="flex items-center gap-4 shrink-0">
                                    <span className="text-base sm:text-lg font-mono">
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
                            <span className="text-base sm:text-lg font-bold">Total Monthly Income</span>
                            <span className="text-lg sm:text-xl font-bold font-mono text-primary">
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
