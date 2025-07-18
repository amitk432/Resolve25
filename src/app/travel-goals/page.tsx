"use client";

import React, { useEffect, useState } from 'react';
import TravelGoalsTab from '@/components/travel-goals-tab';
import { supabase } from '@/lib/supabase';
import { generateTravelSuggestion } from '@/ai/flows/generate-travel-suggestion';
import type { AppData } from '@/lib/types';
import type { GenerateTravelSuggestionOutput } from '@/lib/types';

export default function TravelGoalsPage() {

  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiSuggestion, setAiSuggestion] = useState<GenerateTravelSuggestionOutput | null>(null);

  useEffect(() => {
    async function fetchTravelGoals() {
      setLoading(true);
      const { data: appData } = await supabase.from('appdata').select('*').single();
      if (appData) setData(appData);
      setLoading(false);
    }
    fetchTravelGoals();
  }, []);

  useEffect(() => {
    if (data) {
      // Optionally, you can pass { exclude } if you want to exclude a destination
      generateTravelSuggestion().then(res => {
        setAiSuggestion(res);
      });
    }
  }, [data]);

  // Handler to add a new travel goal
  const handleAddGoal = (goal: Omit<import('@/lib/types').TravelGoal, 'id'>) => {
    setData(prev => {
      if (!prev) return prev;
      const newGoal = {
        ...goal,
        id: `travelgoal-${Date.now()}`,
        travelDate: goal.travelDate instanceof Date ? goal.travelDate.toISOString() : goal.travelDate,
      };
      return {
        ...prev,
        travelGoals: [...prev.travelGoals, newGoal],
      };
    });
  };

  // Handler to delete a travel goal
  const handleDeleteGoal = (id: string) => {
    setData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        travelGoals: prev.travelGoals.filter(goal => goal.id !== id),
      };
    });
  };

  // Handler for updating app data (for itinerary goal add)
  const handleUpdate = (updater: (draft: AppData) => void) => {
    setData(prev => {
      if (!prev) return prev;
      const draft = { ...prev };
      updater(draft);
      return draft;
    });
  };

  if (loading || !data) {
    return <div className="p-8">Loading travel goals...</div>;
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Travel Goals</h1>
      <TravelGoalsTab
        travelGoals={data.travelGoals}
        onAddGoal={handleAddGoal}
        onDeleteGoal={handleDeleteGoal}
        onUpdate={handleUpdate}
      />
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">AI Travel Suggestion</h2>
        {aiSuggestion && (
          <div>
            <strong>{aiSuggestion.destination}</strong>: {aiSuggestion.reasoning}
          </div>
        )}
      </div>
    </main>
  );
}
