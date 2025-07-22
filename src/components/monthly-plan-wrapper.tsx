'use client';

import React from 'react';
import MonthlyPlanTab from './monthly-plan-tab';
import type { AppData, MonthlyPlan } from '@/lib/types';
import type { SuggestedMonthlyPlan } from '@/ai/flows/generate-monthly-plan-suggestions';

interface MonthlyPlanWrapperProps {
  data?: AppData;
  onUpdate?: (updater: (draft: AppData) => void) => void;
}

export default function MonthlyPlanWrapper({ data, onUpdate }: MonthlyPlanWrapperProps) {
  if (!data || !onUpdate) {
    return <div>Loading...</div>;
  }

  const handleToggleTask = (monthIndex: number, taskIndex: number, done: boolean) => {
    onUpdate(draft => {
      if (draft.monthlyPlan && draft.monthlyPlan[monthIndex] && draft.monthlyPlan[monthIndex].tasks[taskIndex]) {
        draft.monthlyPlan[monthIndex].tasks[taskIndex].done = done;
      }
    });
  };

  const handleAddTask = (monthIndex: number, taskText: string) => {
    onUpdate(draft => {
      if (draft.monthlyPlan && draft.monthlyPlan[monthIndex]) {
        draft.monthlyPlan[monthIndex].tasks.push({
          text: taskText,
          done: false,
        });
      }
    });
  };

  const handleDeleteTask = (monthIndex: number, taskIndex: number) => {
    onUpdate(draft => {
      if (draft.monthlyPlan && draft.monthlyPlan[monthIndex]) {
        draft.monthlyPlan[monthIndex].tasks.splice(taskIndex, 1);
      }
    });
  };

  const handleAddPlan = (plan: SuggestedMonthlyPlan) => {
    onUpdate(draft => {
      if (!draft.monthlyPlan) {
        draft.monthlyPlan = [];
      }
      draft.monthlyPlan.push({
        month: plan.month,
        theme: plan.theme,
        tasks: plan.tasks.map((task: string, index: number) => ({
          text: task,
          done: false,
        })),
      });
    });
  };

  const handleManualAddPlan = (plan: { month: string; theme: string; }) => {
    onUpdate(draft => {
      if (!draft.monthlyPlan) {
        draft.monthlyPlan = [];
      }
      draft.monthlyPlan.push({
        month: plan.month,
        theme: plan.theme,
        tasks: [],
      });
    });
  };

  return (
    <MonthlyPlanTab
      monthlyPlan={data.monthlyPlan || []}
      onToggleTask={handleToggleTask}
      onAddTask={handleAddTask}
      onDeleteTask={handleDeleteTask}
      onAddPlan={handleAddPlan}
      onManualAddPlan={handleManualAddPlan}
      data={data}
    />
  );
}
