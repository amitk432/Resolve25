'use client';

import React from 'react';
import LivingAdvisorTab from './living-advisor-tab';
import type { AppData } from '@/lib/types';

interface LivingAdvisorWrapperProps {
  data?: AppData;
  onUpdate?: (updater: (draft: AppData) => void) => void;
}

export default function LivingAdvisorWrapper({ data, onUpdate }: LivingAdvisorWrapperProps) {
  if (!data || !onUpdate) {
    return <div>Loading...</div>;
  }

  return (
    <LivingAdvisorTab
      data={data}
      onUpdate={onUpdate}
    />
  );
}
