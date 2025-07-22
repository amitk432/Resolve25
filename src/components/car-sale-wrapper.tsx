'use client';

import React from 'react';
import CarSaleTab from './car-sale-tab';
import type { AppData, ChecklistItem } from '@/lib/types';

interface CarSaleWrapperProps {
  data?: AppData;
  onUpdate?: (updater: (draft: AppData) => void) => void;
}

export default function CarSaleWrapper({ data, onUpdate }: CarSaleWrapperProps) {
  if (!data || !onUpdate) {
    return <div>Loading...</div>;
  }

  const handleToggleTask = (id: string, done: boolean) => {
    onUpdate(draft => {
      const item = draft.carSaleChecklist?.find(item => item.id === id);
      if (item) {
        item.done = done;
      }
    });
  };

  const handleAddTask = (text: string) => {
    onUpdate(draft => {
      if (!draft.carSaleChecklist) {
        draft.carSaleChecklist = [];
      }
      draft.carSaleChecklist.push({
        id: `car-${Date.now()}`,
        text,
        done: false,
      });
    });
  };

  const handleDeleteTask = (id: string) => {
    onUpdate(draft => {
      draft.carSaleChecklist = draft.carSaleChecklist?.filter(item => item.id !== id) || [];
    });
  };

  const handleUpdateDetails = (price: string, payoff: string) => {
    onUpdate(draft => {
      draft.carSalePrice = price;
      draft.carLoanPayoff = payoff;
    });
  };

  return (
    <CarSaleTab
      checklist={data.carSaleChecklist || []}
      salePrice={data.carSalePrice || ''}
      loanPayoff={data.carLoanPayoff || ''}
      onToggleTask={handleToggleTask}
      onAddTask={handleAddTask}
      onDeleteTask={handleDeleteTask}
      onUpdateDetails={handleUpdateDetails}
    />
  );
}
