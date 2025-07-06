'use client'

import type { Goal, GoalStatus } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface GoalsTabProps {
    goals: Goal[];
    onUpdateGoalStatus: (goal: string, newStatus: GoalStatus) => void;
}

export default function GoalsTab({ goals, onUpdateGoalStatus }: GoalsTabProps) {
    return (
        <div>
            <h2 className="text-xl font-bold text-foreground mb-4">Goals for 2025</h2>
             <div className="overflow-x-auto rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead>Goal</TableHead>
                            <TableHead>Target</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {goals.map((goal, index) => (
                            <TableRow key={index}>
                                <TableCell>{goal.category}</TableCell>
                                <TableCell className="font-medium">{goal.goal}</TableCell>
                                <TableCell>{goal.target}</TableCell>
                                <TableCell>
                                     <Select 
                                        value={goal.status} 
                                        onValueChange={(value: GoalStatus) => onUpdateGoalStatus(goal.goal, value)}
                                     >
                                        <SelectTrigger className="w-[120px]">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="To Do">To Do</SelectItem>
                                            <SelectItem value="In Progress">In Progress</SelectItem>
                                            <SelectItem value="Done">Done</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
