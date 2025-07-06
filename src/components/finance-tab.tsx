
'use client'

import React, { useState } from 'react';
import type { Loan, LoanStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';


interface FinanceTabProps {
    loans: Loan[];
    emergencyFund: string;
    sipStarted: boolean;
    onUpdateLoanStatus: (loanName: string, status: LoanStatus) => void;
    onUpdateEmergencyFund: (amount: string) => void;
    onToggleSip: (started: boolean) => void;
}

export default function FinanceTab({ loans, emergencyFund, sipStarted, onUpdateLoanStatus, onUpdateEmergencyFund, onToggleSip }: FinanceTabProps) {
    const [fundInput, setFundInput] = useState(emergencyFund);

    const handleUpdateClick = () => {
        if (fundInput && !isNaN(parseFloat(fundInput))) {
            onUpdateEmergencyFund(fundInput);
        }
    };
    
    return (
        <div>
            <h2 className="text-xl font-bold text-foreground mb-4">Loan & Investment Tracker</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Loan Repayment Status</CardTitle></CardHeader>
                        <CardContent>
                             <div className="overflow-x-auto rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Loan</TableHead>
                                            <TableHead>Principal</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loans.map((loan, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">{loan.name}</TableCell>
                                                <TableCell>{loan.principal}</TableCell>
                                                <TableCell>
                                                    <Select value={loan.status} onValueChange={(value: LoanStatus) => onUpdateLoanStatus(loan.name, value)}>
                                                        <SelectTrigger className="w-[120px]">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Active">Active</SelectItem>
                                                            <SelectItem value="Closed">Closed</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                             </div>
                        </CardContent>
                    </Card>
                </div>
                <div>
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Investment Growth</CardTitle></CardHeader>
                        <CardContent>
                             <label htmlFor="emergency-fund-input" className="font-medium text-sm text-foreground">Update Emergency Fund (₹)</label>
                            <div className="flex items-center mt-2 gap-2">
                                <Input 
                                  type="number" 
                                  id="emergency-fund-input" 
                                  value={fundInput}
                                  onChange={(e) => setFundInput(e.target.value)}
                                  placeholder="Enter current amount"
                                />
                                <Button onClick={handleUpdateClick}>Update</Button>
                            </div>
                            <div className="mt-4">
                                <h4 className="font-medium text-foreground">SIP Planner</h4>
                                <p className="text-sm text-muted-foreground mt-1">Start with ₹1,000–₹2,000/month after car sale.</p>
                                <div className="mt-2 space-y-2">
                                    <div className="flex items-center">
                                        <Checkbox
                                          id="sip-check"
                                          className="mr-2"
                                          checked={sipStarted}
                                          onCheckedChange={(checked) => onToggleSip(!!checked)}
                                         />
                                        <label htmlFor="sip-check" className={cn("text-sm text-foreground", sipStarted && "line-through text-muted-foreground")}>
                                            Started first SIP
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
