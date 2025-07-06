
'use client'

import type { AppData, Goal } from '@/lib/types';
import AddGoalDialog from './add-goal-dialog';
import GoalCard from './goal-card';
import { Target } from 'lucide-react';

interface GoalsTabProps {
    goals: Goal[];
    onUpdate: (updater: (draft: AppData) => void) => void;
}

export default function GoalsTab({ goals, onUpdate }: GoalsTabProps) {

    const handleGoalAdd = (newGoal: Omit<Goal, 'id' | 'steps' | 'deadline'> & { deadline: Date }) => {
        onUpdate(draft => {
            draft.goals.push({
                ...newGoal,
                id: `goal-${Date.now()}`,
                deadline: newGoal.deadline.toISOString(),
                steps: []
            });
        });
    };

    const handleGoalDelete = (goalId: string) => {
        onUpdate(draft => {
            draft.goals = draft.goals.filter(g => g.id !== goalId);
        });
    };

    const handleStepAdd = (goalId: string, stepText: string) => {
        onUpdate(draft => {
            const goal = draft.goals.find(g => g.id === goalId);
            if (goal) {
                goal.steps.push({
                    id: `step-${Date.now()}`,
                    text: stepText,
                    completed: false
                });
            }
        });
    };
    
    const handleStepToggle = (goalId: string, stepId: string) => {
        onUpdate(draft => {
            const goal = draft.goals.find(g => g.id === goalId);
            if (goal) {
                const step = goal.steps.find(s => s.id === stepId);
                if (step) {
                    step.completed = !step.completed;
                }
            }
        });
    };
    
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-foreground">Your Goals for 2025</h2>
                <AddGoalDialog onGoalAdd={handleGoalAdd} />
            </div>
            
            {goals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {goals.map(goal => (
                       <GoalCard 
                            key={goal.id} 
                            goal={goal}
                            onStepToggle={handleStepToggle}
                            onStepAdd={handleStepAdd}
                            onGoalDelete={handleGoalDelete}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <Target className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-lg font-medium">No Goals Yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Click "Add New Goal" to get started.</p>
                </div>
            )}
        </div>
    )
}
