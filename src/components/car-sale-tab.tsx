
'use client';

import type { ChecklistItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface CarSaleTabProps {
    checklist: ChecklistItem[];
    onToggleTask: (taskIndex: number, done: boolean) => void;
}

export default function CarSaleTab({ checklist, onToggleTask }: CarSaleTabProps) {
    return (
        <div>
            <h2 className="text-xl font-bold text-foreground mb-4">Car Sale Tracker & Checklist</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Financial Summary</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Realistic Sale Price:</span>
                                <span className="font-bold text-lg text-green-600">₹5,50,000</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Loan Payoff Required:</span>
                                <span className="font-bold text-lg text-red-600">~₹4,02,450</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center">
                                <span className="text-foreground font-semibold">✅ Net Cash in Hand:</span>
                                <span className="font-bold text-2xl text-primary">~₹1,47,550</span>
                            </div>
                        </CardContent>
                    </Card>
                     <Card className="mt-6">
                        <CardHeader><CardTitle className="text-lg">Foreclosure Request Email Template</CardTitle></CardHeader>
                        <CardContent className="text-sm bg-muted/50 p-4 rounded-lg">
                           <p><strong>To:</strong> customer.service@toyotafinance.co.in</p>
                           <p><strong>Subject:</strong> Loan Foreclosure Request - Loan Account No. [Your Loan Account Number]</p>
                           <Separator className="my-2" />
                           <p>Dear Toyota Financial Services Team,</p>
                           <p className="mt-2">I am writing to request a foreclosure statement for my car loan with the account number [Your Loan Account Number]. The loan is for my Maruti Baleno Sigma, with vehicle registration number [Your Car's Reg. No.].</p>
                           <p className="mt-2">Please provide the final foreclosure amount, including any applicable charges, and the detailed procedure for closing the loan. I intend to complete the payment at the earliest.</p>
                           <p className="mt-2">Thank you for your prompt assistance.</p>
                           <p className="mt-2">Sincerely,<br/>[Your Name]<br/>[Your Phone Number]</p>
                        </CardContent>
                    </Card>
                </div>
                <div>
                     <Card>
                        <CardHeader><CardTitle className="text-lg">Sale Process Checklist</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            {checklist.map((item, index) => (
                                <div key={index} className="flex items-center bg-muted/50 p-3 rounded-lg">
                                    <Checkbox
                                        id={`car-check-${index}`}
                                        checked={item.done}
                                        onCheckedChange={(checked) => onToggleTask(index, !!checked)}
                                        className="mr-3"
                                    />
                                    <label
                                        htmlFor={`car-check-${index}`}
                                        className={cn("text-sm text-foreground", item.done && "line-through text-muted-foreground")}
                                    >
                                        {item.text}
                                    </label>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
