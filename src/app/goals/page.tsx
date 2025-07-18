"use client";

import GoalsTab from '@/components/goals-tab';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { generateGoalSuggestions } from '@/ai/flows/generate-goal-suggestions';
import type { AppData, Goal } from '@/lib/types';

export default function GoalsPage() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState<import('@/ai/flows/generate-goal-suggestions').SuggestedGoal[]>([]);

  useEffect(() => {
    async function fetchGoals() {
      setLoading(true);
      // Fetch AppData from Supabase (replace 'appdata' with your table name)
      const { data: appData, error } = await supabase
        .from('appdata')
        .select('*')
        .single();
      if (appData) setData(appData);
      setLoading(false);
    }
    fetchGoals();
  }, []);

  // Fetch AI goal suggestions when AppData is loaded
  useEffect(() => {
    if (data) {
      generateGoalSuggestions({ context: data }).then(res => {
        setAiSuggestions(res.suggestions);
      });
    }
  }, [data]);

  if (loading || !data) {
    return <div className="p-8">Loading goals...</div>;
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Goals</h1>
      <GoalsTab data={data} onUpdate={updater => setData(prev => { const draft = { ...prev! }; updater(draft); return draft; })} />
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">AI Goal Suggestions</h2>
        <ul className="list-disc pl-6">
          {aiSuggestions.map((goal, idx) => (
            <li key={idx}>
              <strong>{goal.title}</strong>: {goal.description}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
