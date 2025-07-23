
'use client'

import type { AppData, Goal } from '@/lib/types';
import AddGoalDialog from './add-goal-dialog';
import { Sparkles, Target } from 'lucide-react';
import AiGoalGeneratorDialog from './ai-goal-generator-dialog';
import { Button } from './ui/button';
import type { SuggestedGoal } from '@/ai/flows/generate-goal-suggestions';
import GoalItem from './goal-item';

interface GoalsTabProps {
    data: AppData;
    onUpdate: (updater: (draft: AppData) => void) => void;
}

export default function GoalsTab({ data, onUpdate }: GoalsTabProps) {

    const handleGoalAdd = (newGoal: Omit<Goal, 'id' | 'steps'>) => {
        onUpdate(draft => {
            draft.goals.push({
                ...newGoal,
                id: `goal-${Date.now()}`,
                steps: []
            });
        });
    };

    const handleAiGoalAdd = (suggestedGoal: SuggestedGoal) => {
        onUpdate(draft => {
            const newGoal: Goal = {
                id: `goal-${Date.now()}`,
                title: suggestedGoal.title,
                description: suggestedGoal.description,
                category: suggestedGoal.category,
                // AI goals get a default 3 month deadline, user can change it.
                deadline: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString(),
                steps: suggestedGoal.steps.map(stepText => ({
                    id: `step-${Date.now()}-${Math.random()}`,
                    text: stepText,
                    completed: false,
                }))
            };
            draft.goals.push(newGoal);
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
                if (!goal.steps) {
                    goal.steps = [];
                }
                goal.steps.push({
                    id: `step-${Date.now()}-${Math.random()}`,
                    text: stepText,
                    completed: false
                });
            }
        });
    };

    const handleMultipleStepsAdd = (goalId: string, stepTexts: string[]) => {
        onUpdate(draft => {
            const goal = draft.goals.find(g => g.id === goalId);
            if (goal) {
                if (!goal.steps) {
                    goal.steps = [];
                }
                stepTexts.forEach((stepText, index) => {
                    goal.steps!.push({
                        id: `step-${Date.now()}-${index}-${Math.random()}`,
                        text: stepText,
                        completed: false
                    });
                });
            }
        });
    };
    
    const handleStepToggle = (goalId: string, stepId: string) => {
        onUpdate(draft => {
            const goal = draft.goals.find(g => g.id === goalId);
            if (goal && goal.steps) {
                const step = goal.steps.find(s => s.id === stepId);
                if (step) {
                    step.completed = !step.completed;
                }
            }
        });
    };

    const handleStepEdit = (goalId: string, stepId: string, newText: string) => {
        onUpdate(draft => {
            const goal = draft.goals.find(g => g.id === goalId);
            if (goal && goal.steps) {
                const step = goal.steps.find(s => s.id === stepId);
                if (step) {
                    step.text = newText;
                }
            }
        });
    };

    const handleStepDelete = (goalId: string, stepId: string) => {
        onUpdate(draft => {
            const goal = draft.goals.find(g => g.id === goalId);
            if (goal && goal.steps) {
                goal.steps = goal.steps.filter(s => s.id !== stepId);
            }
        });
    };
    
    return (
        <div className="space-y-8">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-foreground">Your Goals for 2025</h2>
                    <p className="mt-2 text-base text-muted-foreground">Set, track, and conquer your personal and professional goals.</p>
                </div>
                <div className="flex w-full shrink-0 gap-2 sm:w-auto">
                    <AiGoalGeneratorDialog data={data} onGoalAdd={handleAiGoalAdd}>
                        <Button variant="outline" className="w-full justify-center sm:w-auto">
                            <Sparkles className="mr-2 h-5 w-5" />
                            Generate with AI
                        </Button>
                    </AiGoalGeneratorDialog>
                    <AddGoalDialog onGoalAdd={handleGoalAdd} />
                </div>
            </div>
            
            {data.goals.length > 0 ? (
                <div className="space-y-4">
                    {data.goals.map(goal => (
                       <GoalItem
                            key={goal.id} 
                            goal={goal}
                            data={data}
                            onStepToggle={handleStepToggle}
                            onStepAdd={handleStepAdd}
                            onMultipleStepsAdd={handleMultipleStepsAdd}
                            onStepEdit={handleStepEdit}
                            onStepDelete={handleStepDelete}
                            onGoalDelete={handleGoalDelete}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <Target className="mx-auto h-16 w-16 text-muted-foreground" />
                    <h3 className="mt-4 text-xl font-medium">No Goals Yet</h3>
                    <p className="mt-2 text-base text-muted-foreground">Click "Add New Goal" above to get started.</p>
                </div>
            )}
        </div>
    )
}
