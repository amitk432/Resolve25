"use client";

import DailyTasksTab from '@/components/daily-tasks-tab';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { generateTaskSuggestions } from '@/ai/flows/generate-task-suggestions';
import type { AppData } from '@/lib/types';
import type { SuggestedTask } from '@/ai/flows/generate-task-suggestions';

export default function DailyTasksPage() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState<SuggestedTask[]>([]);

  useEffect(() => {
    async function fetchDailyTasks() {
      setLoading(true);
      const { data: appData } = await supabase.from('appdata').select('*').single();
      if (appData) setData(appData);
      setLoading(false);
    }
    fetchDailyTasks();
  }, []);

  useEffect(() => {
    if (data) {
      generateTaskSuggestions({ context: data }).then(res => {
        setAiSuggestions(res.suggestions);
      });
    }
  }, [data]);

  if (loading || !data) {
    return <div className="p-8">Loading daily tasks...</div>;
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Daily Tasks</h1>
      <DailyTasksTab
        data={data}
        onUpdate={(updater: (draft: AppData) => void) => {
          setData(prev => {
            const draft = { ...prev! };
            updater(draft);
            return draft;
          });
        }}
      />
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">AI Task Suggestions</h2>
        <ul className="list-disc pl-6">
          {aiSuggestions.map((task, idx) => (
            <li key={idx}>
              <strong>{task.title}</strong>: {task.description}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
