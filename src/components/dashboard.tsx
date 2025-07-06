'use client';

import type { Goal } from '@/lib/types';
import AddGoalDialog from '@/components/add-goal-dialog';
import GoalCard from '@/components/goal-card';
import Header from './header';
import StatsCard from './stats-card';
import MotivationalQuote from './motivational-quote';

interface DashboardProps {
  goals: Goal[];
  onGoalAdd: (goal: Omit<Goal, 'id' | 'steps'>) => void;
  onGoalDelete: (goalId: string) => void;
  onStepToggle: (goalId: string, stepId: string) => void;
  onStepAdd: (goalId: string, stepText: string) => void;
}

export default function Dashboard({
  goals,
  onGoalAdd,
  onGoalDelete,
  onStepToggle,
  onStepAdd,
}: DashboardProps) {
  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start mb-8">
            <h2 className="text-3xl font-bold text-foreground">Your Goals</h2>
            <AddGoalDialog onGoalAdd={onGoalAdd} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <StatsCard goals={goals} />
            <div className="lg:col-span-2">
                <MotivationalQuote />
            </div>
          </div>
          
          {goals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goals.map(goal => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onStepToggle={onStepToggle}
                  onStepAdd={onStepAdd}
                  onGoalDelete={onGoalDelete}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-6 border-2 border-dashed rounded-lg">
                <h3 className="text-xl font-medium text-foreground">No goals yet!</h3>
                <p className="text-muted-foreground mt-2">Ready to achieve something great? Add your first goal to get started.</p>
                <div className="mt-6">
                    <AddGoalDialog onGoalAdd={onGoalAdd} />
                </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
