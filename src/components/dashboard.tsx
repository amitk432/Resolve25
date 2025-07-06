'use client';

import { useState, useMemo, useEffect } from 'react';
import { produce } from 'immer';
import type { Goal } from '@/lib/types';
import AddGoalDialog from './add-goal-dialog';
import GoalCard from './goal-card';
import StatsCard from './stats-card';
import { Target } from 'lucide-react';
import MotivationalQuote from './motivational-quote';

const initialGoals: Goal[] = [
  {
    id: '1',
    title: 'Learn Next.js App Router',
    description: 'Master the new features of Next.js for better performance and developer experience.',
    deadline: new Date('2025-03-31'),
    category: 'Career',
    steps: [
      { id: '1-1', text: 'Complete the official Next.js tutorial', completed: true },
      { id: '1-2', text: 'Build a small project with App Router', completed: true },
      { id: '1-3', text: 'Learn about Server Actions', completed: false },
      { id: '1-4', text: 'Deploy the project to Vercel', completed: false },
    ],
  },
  {
    id: '2',
    title: 'Run a 10k',
    description: 'Improve cardiovascular health and achieve a new personal best.',
    deadline: new Date('2025-06-15'),
    category: 'Health',
    steps: [
      { id: '2-1', text: 'Start a couch-to-5k program', completed: true },
      { id: '2-2', text: 'Run 3 times a week', completed: false },
      { id: '2-3', text: 'Incorporate strength training', completed: false },
    ],
  },
];


export default function Dashboard() {
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    const storedGoals = localStorage.getItem('resolve25-goals');
    if(storedGoals) {
      const parsedGoals = JSON.parse(storedGoals, (key, value) => {
        if (key === 'deadline') {
          return new Date(value);
        }
        return value;
      });
      setGoals(parsedGoals);
    } else {
      setGoals(initialGoals);
    }
  }, []);

  useEffect(() => {
    if (goals.length > 0) {
      localStorage.setItem('resolve25-goals', JSON.stringify(goals));
    }
  }, [goals]);

  const sortedGoals = useMemo(() => {
    return [...goals].sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
  }, [goals]);

  const handleAddGoal = (newGoalData: Omit<Goal, 'id' | 'steps'>) => {
    const newGoal: Goal = {
      ...newGoalData,
      id: new Date().toISOString(),
      steps: [],
    };
    setGoals(produce(draft => {
      draft.push(newGoal);
    }));
  };

  const handleToggleStep = (goalId: string, stepId: string) => {
    setGoals(produce(draft => {
      const goal = draft.find(g => g.id === goalId);
      if (goal) {
        const step = goal.steps.find(s => s.id === stepId);
        if (step) {
          step.completed = !step.completed;
        }
      }
    }));
  };

  const handleAddStep = (goalId: string, stepText: string) => {
    setGoals(produce(draft => {
        const goal = draft.find(g => g.id === goalId);
        if(goal) {
            goal.steps.push({
                id: `${goalId}-${new Date().getTime()}`,
                text: stepText,
                completed: false
            })
        }
    }))
  }

  const handleDeleteGoal = (goalId: string) => {
    setGoals(produce(draft => {
        const index = draft.findIndex(g => g.id === goalId);
        if (index !== -1) {
            draft.splice(index, 1);
        }
    }))
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Your 2025 Goals</h2>
            <p className="text-muted-foreground">Stay focused and crush your resolutions!</p>
          </div>
          <AddGoalDialog onGoalAdd={handleAddGoal} />
        </div>
        {sortedGoals.length > 0 ? (
          <div className="space-y-4">
            {sortedGoals.map(goal => (
              <GoalCard 
                key={goal.id} 
                goal={goal} 
                onStepToggle={handleToggleStep}
                onStepAdd={handleAddStep}
                onGoalDelete={handleDeleteGoal}
                 />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <Target className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No Goals Yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Click 'Add New Goal' to start your journey.
            </p>
          </div>
        )}
      </div>
      <div className="lg:col-span-1 lg:sticky lg:top-24 space-y-6">
        <StatsCard goals={goals} />
        <MotivationalQuote />
      </div>
    </div>
  );
}
