
'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Loan, LoanStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Pencil, Trash2, Plus, BadgeIndianRupee } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import AiSuggestionSection from './ai-suggestion-section';
import { Badge } from './ui/badge';

interface FinanceTabProps {
    loans: Loan[];
    emergencyFund: string;
    sipStarted: boolean;
    sipAmount: string;
    sipMutualFund: string;
    sipPlatform: string;
    onUpdateLoanStatus: (loanId: string, status: LoanStatus) => void;
    onUpdateEmergencyFund: (amount: string) => void;
    onToggleSip: (started: boolean) => void;
    onUpdateSipDetails: (amount: string, mutualFund: string, platform: string) => void;
    onAddLoan: (name: string, principal: string, rate?: string, tenure?: string) => void;
    onUpdateLoan: (id: string, name: string, principal: string, rate?: string, tenure?: string) => void;
    onDeleteLoan: (id: string) => void;
}

const loanSchema = z.object({
  name: z.string().min(3, { message: 'Loan name must be at least 3 characters.' }),
  principal: z.string().min(1, { message: 'Principal amount is required.' }),
  rate: z.string().optional(),
  tenure: z.string().optional(),
});

const LoanCalculations = ({ loan }: { loan: Loan }) => {
    const p = parseFloat(loan.principal);
    const r = loan.rate ? parseFloat(loan.rate) / 100 / 12 : undefined;
    const n = loan.tenure ? parseInt(loan.tenure, 10) : undefined;

    if (p > 0 && r !== undefined && r > 0 && n !== undefined && n > 0) {
        const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        const totalPayable = emi * n;
        const totalInterest = totalPayable - p;
        
        return (
            <div className="space-y-2 mt-4 pt-4 border-t">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">EMI</span>
                    <span className="font-medium">₹{emi.toLocaleString('en-IN', { maximumFractionDigits: 0 })} / month</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Interest</span>
                    <span className="font-medium text-destructive">₹{totalInterest.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Payable</span>
                    <span className="font-medium">₹{totalPayable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
            </div>
        );
    }

    if (p > 0 && r !== undefined && r > 0 && (n === undefined || n <= 0)) {
        const monthlyInterest = p * r;
        return (
            <div className="space-y-2 mt-4 pt-4 border-t">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Simple Monthly Interest</span>
                    <span className="font-medium">₹{monthlyInterest.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
                 <p className="text-xs text-center text-muted-foreground pt-2">Enter a tenure to calculate EMI and total payments.</p>
            </div>
        )
    }

    return <p className="text-xs text-center text-muted-foreground pt-4 mt-4 border-t">Enter a valid rate and tenure to see calculations.</p>;
};

export default function FinanceTab({ 
    loans, 
    emergencyFund, 
    sipStarted,
    sipAmount,
    sipMutualFund,
    sipPlatform,
    onUpdateLoanStatus, 
    onUpdateEmergencyFund, 
    onToggleSip,
    onUpdateSipDetails,
    onAddLoan,
    onUpdateLoan,
    onDeleteLoan
}: FinanceTabProps) {
    const [fundInput, setFundInput] = useState(emergencyFund);
    const [isLoanDialogOpen, setLoanDialogOpen] = useState(false);
    const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
    const { toast } = useToast();

    const [isSipEditing, setIsSipEditing] = useState(false);
    const [sipAmountInput, setSipAmountInput] = useState(sipAmount);
    const [sipFundInput, setSipFundInput] = useState(sipMutualFund);
    const [sipPlatformInput, setSipPlatformInput] = useState(sipPlatform);
    
    useEffect(() => {
        setSipAmountInput(sipAmount);
        setSipFundInput(sipMutualFund);
        setSipPlatformInput(sipPlatform);
    }, [sipAmount, sipMutualFund, sipPlatform]);

    const form = useForm<z.infer<typeof loanSchema>>({
        resolver: zodResolver(loanSchema),
        defaultValues: { name: '', principal: '', rate: '', tenure: '' },
    });

    const handleOpenDialog = (loan: Loan | null) => {
        setEditingLoan(loan);
        if (loan) {
            form.reset({ name: loan.name, principal: loan.principal, rate: loan.rate, tenure: loan.tenure });
        } else {
            form.reset({ name: '', principal: '', rate: '', tenure: '' });
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
            onUpdateLoan(editingLoan.id, values.name, values.principal, values.rate, values.tenure);
            toast({ title: 'Loan Updated!', description: `"${values.name}" has been updated.` });
        } else {
            onAddLoan(values.name, values.principal, values.rate, values.tenure);
            toast({ title: 'Loan Added!', description: `"${values.name}" has been added to your list.` });
        }
        handleDialogChange(false);
    };

    const handleUpdateClick = () => {
        if (fundInput && !isNaN(parseFloat(fundInput))) {
            onUpdateEmergencyFund(fundInput);
            toast({ title: 'Emergency Fund Updated!' });
        }
    };

    const handleSaveSip = () => {
        onUpdateSipDetails(sipAmountInput, sipFundInput, sipPlatformInput);
        setIsSipEditing(false);
        toast({ title: "SIP Details Updated!" });
    };

    const handleCancelSipEdit = () => {
        setSipAmountInput(sipAmount);
        setSipFundInput(sipMutualFund);
        setSipPlatformInput(sipPlatform);
        setIsSipEditing(false);
    };
    
    const emergencyFundTarget = 40000;
    const emergencyFundCurrent = parseFloat(emergencyFund) || 0;
    const emergencyFundProgress = Math.min((emergencyFundCurrent / emergencyFundTarget) * 100, 100);

    return (
        <div>
            <div className="flex justify-center items-center mb-6 gap-4">
                <h2 className="text-xl font-bold text-foreground">Loan & Investment Tracker</h2>
                <Button onClick={() => handleOpenDialog(null)}><Plus className="mr-2 h-4 w-4"/> Add Loan</Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                <div className="space-y-4">
                     <h3 className="text-lg font-semibold">Your Loans</h3>
                     {loans.length > 0 ? (
                        loans.map(loan => (
                            <Card key={loan.id}>
                                <CardHeader className="flex flex-row items-start justify-between">
                                    <div>
                                        <CardTitle>{loan.name}</CardTitle>
                                        <div className="mt-2">
                                            <Select value={loan.status} onValueChange={(value: LoanStatus) => onUpdateLoanStatus(loan.id, value)}>
                                                <SelectTrigger className="w-[120px] h-8 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Active">Active</SelectItem>
                                                    <SelectItem value="Closed">Closed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
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
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-base">
                                            <span className="text-muted-foreground">Principal</span>
                                            <span className="font-semibold">₹{parseFloat(loan.principal).toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Interest Rate</span>
                                            <span className="font-medium">{loan.rate || 'N/A'}%</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Tenure</span>
                                            <span className="font-medium">{loan.tenure || 'N/A'} months</span>
                                        </div>
                                    </div>
                                    <LoanCalculations loan={loan} />
                                </CardContent>
                            </Card>
                        ))
                     ) : (
                        <Card>
                            <CardContent className="text-center text-muted-foreground p-8">
                                No loans added yet. Click "Add Loan" to get started.
                            </CardContent>
                        </Card>
                     )}
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
                                <div className="flex justify-between items-center">
                                    <h4 className="font-medium text-foreground">SIP Planner</h4>
                                    {!isSipEditing && sipStarted && (
                                        <Button variant="outline" size="sm" onClick={() => setIsSipEditing(true)}>
                                            <Pencil className="mr-2 h-3 w-3" /> Edit
                                        </Button>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">Goal: Start with ₹1,000–₹2,000/month after the car is sold.</p>
                                <div className="mt-4 bg-muted/50 p-4 rounded-lg space-y-4">
                                    <div className="flex items-center">
                                        <Checkbox
                                          id="sip-check"
                                          className="mr-3"
                                          checked={sipStarted}
                                          onCheckedChange={(checked) => {
                                              onToggleSip(!!checked);
                                              if (!checked) setIsSipEditing(false);
                                            }}
                                         />
                                        <label htmlFor="sip-check" className={cn("text-sm font-medium", sipStarted && "line-through text-muted-foreground")}>
                                            I have started my first SIP
                                        </label>
                                    </div>

                                    {sipStarted && (
                                        isSipEditing ? (
                                            <div className="space-y-4 pt-2">
                                                <div className="space-y-1">
                                                    <Label htmlFor="sip-amount" className="text-xs">Monthly Amount (₹)</Label>
                                                    <Input id="sip-amount" type="number" value={sipAmountInput} onChange={(e) => setSipAmountInput(e.target.value)} placeholder="e.g., 2000" className="h-9" />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label htmlFor="sip-fund" className="text-xs">Mutual Fund Name</Label>
                                                    <Input id="sip-fund" value={sipFundInput} onChange={(e) => setSipFundInput(e.target.value)} placeholder="e.g., Parag Parikh Flexi Cap" className="h-9" />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label htmlFor="sip-platform" className="text-xs">Investment Platform</Label>
                                                    <Input id="sip-platform" value={sipPlatformInput} onChange={(e) => setSipPlatformInput(e.target.value)} placeholder="e.g., Groww, Zerodha Coin" className="h-9" />
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button onClick={handleSaveSip} size="sm">Save</Button>
                                                    <Button variant="ghost" size="sm" onClick={handleCancelSipEdit}>Cancel</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3 text-sm pt-2">
                                                { (sipAmount || sipMutualFund || sipPlatform) ? (
                                                    <>
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Monthly Amount:</span>
                                                            <span className="font-medium">₹{parseFloat(sipAmount || '0').toLocaleString('en-IN')}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Fund Name:</span>
                                                            <span className="font-medium">{sipMutualFund || 'Not set'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Platform:</span>
                                                            <span className="font-medium">{sipPlatform || 'Not set'}</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                     <div className="text-center text-muted-foreground py-2">
                                                        <p>Click "Edit" to add your SIP details.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={isLoanDialogOpen} onOpenChange={handleDialogChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingLoan ? 'Edit Loan' : 'Add New Loan'}</DialogTitle>
                        <DialogDescription>
                            {editingLoan ? 'Update the details of your loan.' : 'Enter the details for the new loan.'}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
                                    <FormLabel>Principal Amount (₹)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g., 50000" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
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
                contextData={{ loans, emergencyFund, sipStarted }}
            />
        </div>
    )
}
