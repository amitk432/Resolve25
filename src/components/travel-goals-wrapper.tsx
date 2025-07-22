'use client';

import React from 'react';
import TravelGoalsTab from './travel-goals-tab';
import type { AppData, TravelGoal } from '@/lib/types';

interface TravelGoalsWrapperProps {
  data?: AppData;
  onUpdate?: (updater: (draft: AppData) => void) => void;
}

export default function TravelGoalsWrapper({ data, onUpdate }: TravelGoalsWrapperProps) {
  if (!data || !onUpdate) {
    return <div>Loading...</div>;
  }

  const handleAddGoal = (goal: Omit<TravelGoal, 'id'>) => {
    onUpdate(draft => {
      draft.travelGoals.push({
        ...goal,
        id: `travel-${Date.now()}`,
      });
    });
  };

  const handleDeleteGoal = (id: string) => {
    onUpdate(draft => {
      draft.travelGoals = draft.travelGoals.filter(goal => goal.id !== id);
    });
  };

  return (
    <TravelGoalsTab
      travelGoals={data.travelGoals || []}
      onAddGoal={handleAddGoal}
      onDeleteGoal={handleDeleteGoal}
      onUpdate={onUpdate}
    />
  );
}
