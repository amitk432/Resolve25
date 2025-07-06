
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { ChecklistItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Trash2, Plus, TrendingUp, ClipboardCheck, Mail, IndianRupee, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface CarSaleTabProps {
    checklist: ChecklistItem[];
    salePrice: string;
    loanPayoff: string;
    onToggleTask: (id: string, done: boolean) => void;
    onAddTask: (text: string) => void;
    onDeleteTask: (id: string) => void;
    onUpdateDetails: (price: string, payoff: string) => void;
}

export default function CarSaleTab({ checklist, salePrice, loanPayoff, onToggleTask, onAddTask, onDeleteTask, onUpdateDetails }: CarSaleTabProps) {
    const { toast } = useToast();
    const [priceInput, setPriceInput] = useState(salePrice);
    const [payoffInput, setPayoffInput] = useState(loanPayoff);
    const [newTaskText, setNewTaskText] = useState('');

    useEffect(() => {
        setPriceInput(salePrice);
        setPayoffInput(loanPayoff);
    }, [salePrice, loanPayoff]);

    const netCashInHand = useMemo(() => {
        const price = parseFloat(priceInput) || 0;
        const payoff = parseFloat(payoffInput) || 0;
        return price - payoff;
    }, [priceInput, payoffInput]);

    const handleDetailsSave = () => {
        onUpdateDetails(priceInput, payoffInput);
        toast({
            title: 'Financials Updated',
            description: 'Your car sale price and loan payoff have been saved.',
        });
    };

    const handleAddTask = () => {
        if (newTaskText.trim()) {
            onAddTask(newTaskText);
            setNewTaskText('');
            toast({ title: 'Task Added' });
        }
    };

    return (
        <div>
            <h2 className="text-xl font-bold text-foreground mb-4">Car Sale Tracker & Checklist</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="space-y-8">
                    <Card className="shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="space-y-1.5">
                                <CardTitle className="text-lg">Financial Summary</CardTitle>
                                <CardDescription>Update your sale estimates.</CardDescription>
                            </div>
                            <TrendingUp className="h-6 w-6 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="sale-price">Realistic Sale Price</Label>
                                <div className="relative mt-1">
                                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="sale-price"
                                        type="number"
                                        value={priceInput}
                                        onChange={(e) => setPriceInput(e.target.value)}
                                        placeholder="e.g., 550000"
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                             <div>
                                <Label htmlFor="loan-payoff">Loan Payoff Required</Label>
                                <div className="relative mt-1">
                                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="loan-payoff"
                                        type="number"
                                        value={payoffInput}
                                        onChange={(e) => setPayoffInput(e.target.value)}
                                        placeholder="e.g., 400000"
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                            <Button onClick={handleDetailsSave} className="w-full">
                                <Save className="mr-2 h-4 w-4" /> Save Financials
                            </Button>
                        </CardContent>
                        <CardFooter className="flex-col items-start space-y-2 bg-muted/50 p-4 rounded-b-lg">
                            <span className="text-sm text-muted-foreground">✅ Net Cash in Hand (Estimate)</span>
                            <span className={cn(
                                "text-3xl font-bold",
                                netCashInHand >= 0 ? 'text-green-600' : 'text-red-600'
                            )}>
                                {netCashInHand.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 })}
                            </span>
                        </CardFooter>
                    </Card>
                     <Card className="shadow-lg hover:shadow-xl transition-shadow">
                        <Accordion type="single" collapsible>
                            <AccordionItem value="item-1" className="border-b-0">
                                <AccordionTrigger className="p-6">
                                    <div className="flex items-center gap-4">
                                        <Mail className="h-6 w-6 text-muted-foreground" />
                                        <div>
                                            <p className="text-lg font-semibold text-left">Foreclosure Request Email</p>
                                            <p className="text-sm text-muted-foreground text-left">Click to view template</p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-6">
                                    <div className="text-sm bg-muted p-4 rounded-lg border">
                                       <p><strong>To:</strong> customer.service@toyotafinance.co.in</p>
                                       <p><strong>Subject:</strong> Loan Foreclosure Request - Loan Account No. [Your Loan Account Number]</p>
                                       <Separator className="my-2" />
                                       <p>Dear Toyota Financial Services Team,</p>
                                       <p className="mt-2">I am writing to request a foreclosure statement for my car loan with the account number [Your Loan Account Number]. The loan is for my Maruti Baleno Sigma, with vehicle registration number [Your Car's Reg. No.].</p>
                                       <p className="mt-2">Please provide the final foreclosure amount, including any applicable charges, and the detailed procedure for closing the loan. I intend to complete the payment at the earliest.</p>
                                       <p className="mt-2">Thank you for your prompt assistance.</p>
                                       <p className="mt-2">Sincerely,<br/>[Your Name]<br/>[Your Phone Number]</p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </Card>
                </div>
                <div>
                     <Card className="shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader  className="flex flex-row items-center justify-between">
                             <div className="space-y-1.5">
                                <CardTitle className="text-lg">Sale Process Checklist</CardTitle>
                                <CardDescription>Track your sale step-by-step.</CardDescription>
                            </div>
                            <ClipboardCheck className="h-6 w-6 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {checklist.map((item) => (
                                <div key={item.id} className="group flex items-center bg-background p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                                    <Checkbox
                                        id={item.id}
                                        checked={item.done}
                                        onCheckedChange={(checked) => onToggleTask(item.id, !!checked)}
                                        className="h-5 w-5 mr-4"
                                    />
                                    <label
                                        htmlFor={item.id}
                                        className={cn("flex-grow text-sm text-foreground", item.done && "line-through text-muted-foreground")}
                                    >
                                        {item.text}
                                    </label>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => onDeleteTask(item.id)}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                            {checklist.length === 0 && (
                                <p className="text-sm text-center text-muted-foreground py-4">No tasks yet. Add one below!</p>
                            )}
                        </CardContent>
                        <CardFooter className="p-4 border-t">
                             <div className="flex w-full items-center gap-2">
                                <Input
                                    placeholder="Add a new checklist item..."
                                    value={newTaskText}
                                    onChange={(e) => setNewTaskText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                                />
                                <Button onClick={handleAddTask}>
                                    <Plus className="mr-2 h-4 w-4"/> Add Task
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    )
}
