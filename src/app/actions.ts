
'use server';

import { generateModuleSuggestions, type ModuleSuggestionInput } from '@/ai/flows/generate-module-suggestions';
import { generateGoalTips, type GenerateGoalTipsInput } from '@/ai/flows/generate-goal-tips';

export async function getModuleSuggestions(input: ModuleSuggestionInput) {
    try {
        const result = await generateModuleSuggestions(input);
        return result;
    } catch (error) {
        console.error('Error getting module suggestions:', error);
        return { error: 'Failed to generate AI suggestions. Please try again.' };
    }
}

export async function getAITips(input: GenerateGoalTipsInput) {
    try {
        const result = await generateGoalTips(input);
        return result;
    } catch (error) {
        console.error('Error getting AI tips:', error);
        return { error: 'Failed to generate AI tips. Please try again.' };
    }
}
