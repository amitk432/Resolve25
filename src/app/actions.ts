
'use server';

import { generateModuleSuggestions, type ModuleSuggestionInput } from '@/ai/flows/generate-module-suggestions';

export async function getModuleSuggestions(input: ModuleSuggestionInput) {
    try {
        const result = await generateModuleSuggestions(input);
        return result;
    } catch (error) {
        console.error('Error getting module suggestions:', error);
        return { error: 'Failed to generate AI suggestions. Please try again.' };
    }
}
