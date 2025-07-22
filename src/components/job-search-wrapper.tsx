'use client';

import React from 'react';
import JobSearchTab from './job-search-tab';
import type { AppData } from '@/lib/types';

interface JobSearchWrapperProps {
  data?: AppData;
  onUpdate?: (updater: (draft: AppData) => void) => void;
}

export default function JobSearchWrapper({ data, onUpdate }: JobSearchWrapperProps) {
  if (!data || !onUpdate) {
    return <div>Loading...</div>;
  }

  const handleAddApplication = (application: any) => {
    onUpdate(draft => {
      draft.jobApplications.push({
        ...application,
        id: `job-${Date.now()}`,
        date: new Date().toISOString(),
        status: 'Need to Apply' as const,
      });
    });
  };

  const handleUpdateStatus = (index: number, status: any) => {
    onUpdate(draft => {
      if (draft.jobApplications[index]) {
        draft.jobApplications[index].status = status;
      }
    });
  };

  const handleDelete = (index: number) => {
    onUpdate(draft => {
      draft.jobApplications.splice(index, 1);
    });
  };

  return (
    <JobSearchTab
      applications={data.jobApplications || []}
      onAddApplication={handleAddApplication}
      onUpdateStatus={handleUpdateStatus}
      onDelete={handleDelete}
      data={data}
      onUpdate={onUpdate}
    />
  );
}
