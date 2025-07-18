"use client";

import JobSearchTab from '@/components/job-search-tab';
import { useState } from 'react';
import type { JobApplication, AppData } from '@/lib/types';

const initialAppData: AppData = {
  goals: [],
  monthlyPlan: [],
  carSaleChecklist: [],
  carSalePrice: '',
  carLoanPayoff: '',
  loans: [],
 jobApplications: [],
  emergencyFund: '',
  emergencyFundTarget: '',
  sips: [],
  travelGoals: [],
  dailyTasks: [],
  incomeSources: [],
  resume: null,
  livingAdvisor: { questionnaire: {
    reasonForRelocation: 'Jobs',
    lifestyle: 'City',
    familySize: 1,
    languageSkills: '',
    climatePreference: 'No Preference',
    workLifeBalance: 'Balanced',
    careerGoals: ''
  } },
  lastJobSuggestionCheck: ''
};

export default function JobSearchPage() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [data, setData] = useState<AppData>(initialAppData);

  return (
    <JobSearchTab
      applications={applications}
      onAddApplication={app => setApplications([...applications, app as JobApplication])}
      onUpdateStatus={(index, status) => {
        const updated = [...applications];
        updated[index].status = status;
        setApplications(updated);
      }}
      onDelete={index => {
        const updated = [...applications];
        updated.splice(index, 1);
        setApplications(updated);
      }}
      data={data}
      onUpdate={updater => setData(prev => { const draft = { ...prev }; updater(draft); return draft; })}
    />
  );
}
