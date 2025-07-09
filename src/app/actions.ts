
'use server';

import { generateGoalTips, type GenerateGoalTipsInput } from '@/ai/flows/generate-goal-tips';
import { generateModuleSuggestions, type ModuleSuggestionInput } from '@/ai/flows/generate-module-suggestions';

export async function getModuleSuggestions(input: ModuleSuggestionInput) {
    try {
        const result = await generateModuleSuggestions(input);
        return result;
    } catch (error) {
        console.error('Error getting module suggestions:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate AI suggestions. Please try again.';
        return { error: errorMessage };
    }
}

export async function getAITips(input: GenerateGoalTipsInput) {
  try {
    const result = await generateGoalTips(input);
    return result;
  } catch (error) {
    console.error('Error getting AI tips:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate AI tips. Please try again.';
    return { error: errorMessage };
  }
}
