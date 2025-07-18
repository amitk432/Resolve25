"use client";

import MonthlyPlanTab from '@/components/monthly-plan-tab';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { generateMonthlyPlanSuggestions } from '@/ai/flows/generate-monthly-plan-suggestions';
import type { AppData } from '@/lib/types';
import type { SuggestedMonthlyPlan } from '@/ai/flows/generate-monthly-plan-suggestions';

export default function MonthlyPlanPage() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState<SuggestedMonthlyPlan[]>([]);

  useEffect(() => {
    async function fetchMonthlyPlan() {
      setLoading(true);
      const { data: appData } = await supabase.from('appdata').select('*').single();
      if (appData) setData(appData);
      setLoading(false);
    }
    fetchMonthlyPlan();
  }, []);

  useEffect(() => {
    if (data) {
      generateMonthlyPlanSuggestions({ context: data }).then(res => {
        setAiSuggestions(res.suggestions);
      });
    }
  }, [data]);

  if (loading || !data) {
    return <div className="p-8">Loading monthly plan...</div>;
  }

  // Handlers for MonthlyPlanTab
  const handleToggleTask = (monthIndex: number, taskIndex: number, done: boolean) => {
    setData(prev => {
      if (!prev) return prev;
      const monthlyPlan = prev.monthlyPlan.map((month, mIdx) =>
        mIdx === monthIndex
          ? {
              ...month,
              tasks: month.tasks.map((task, tIdx) =>
                tIdx === taskIndex ? { ...task, done } : task
              ),
            }
          : month
      );
      return { ...prev, monthlyPlan };
    });
  };

  const handleAddTask = (monthIndex: number, taskText: string) => {
    setData(prev => {
      if (!prev) return prev;
      const monthlyPlan = prev.monthlyPlan.map((month, mIdx) =>
        mIdx === monthIndex
          ? {
              ...month,
              tasks: [...month.tasks, { text: taskText, done: false }],
            }
          : month
      );
      return { ...prev, monthlyPlan };
    });
  };

  const handleDeleteTask = (monthIndex: number, taskIndex: number) => {
    setData(prev => {
      if (!prev) return prev;
      const monthlyPlan = prev.monthlyPlan.map((month, mIdx) =>
        mIdx === monthIndex
          ? {
              ...month,
              tasks: month.tasks.filter((_, tIdx) => tIdx !== taskIndex),
            }
          : month
      );
      return { ...prev, monthlyPlan };
    });
  };

  const handleAddPlan = (plan: SuggestedMonthlyPlan) => {
    setData(prev => {
      if (!prev) return prev;
      return { ...prev, monthlyPlan: [...prev.monthlyPlan, { ...plan, tasks: plan.tasks.map(task => ({ text: task, done: false })) }] };
    });
  };

  const handleManualAddPlan = (plan: { month: string; theme: string }) => {
    setData(prev => {
      if (!prev) return prev;
      return { ...prev, monthlyPlan: [...prev.monthlyPlan, { ...plan, tasks: [] }] };
    });
  };

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Monthly Plan</h1>
      <MonthlyPlanTab
        monthlyPlan={data.monthlyPlan}
        onToggleTask={handleToggleTask}
        onAddTask={handleAddTask}
        onDeleteTask={handleDeleteTask}
        onAddPlan={handleAddPlan}
        onManualAddPlan={handleManualAddPlan}
        data={data}
      />
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">AI Monthly Plan Suggestions</h2>
        <ul className="list-disc pl-6">
          {aiSuggestions.map((plan, idx) => (
            <li key={idx}>
              <strong>{plan.month}</strong> — <em>{plan.theme}</em>
              <ul className="list-disc pl-4">
                {plan.tasks.map((task, i) => (
                  <li key={i}>{task}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
