
'use server';
/**
 * @fileOverview A flow to generate a travel suggestion based on the current month.
 *
 * - generateTravelSuggestion - Generates the suggestion.
 * - GenerateTravelSuggestionOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GenerateTravelSuggestionOutputSchema } from '@/lib/types';
import type { GenerateTravelSuggestionOutput } from '@/lib/types';

export async function generateTravelSuggestion(): Promise<GenerateTravelSuggestionOutput> {
  return generateTravelSuggestionFlow();
}

const prompt = ai.definePrompt({
  name: 'generateTravelSuggestionPrompt',
  input: { schema: z.object({ currentMonth: z.string() }) },
  output: {schema: GenerateTravelSuggestionOutputSchema},
  prompt: `You are a travel expert. The current month is {{currentMonth}}.
  
  Suggest one interesting travel destination in India that is particularly good to visit during this month.
  
  Consider factors like weather, local events, or seasonal beauty.
  
  Provide the output in the specified JSON format, including a destination and a brief reasoning.`,
});

const generateTravelSuggestionFlow = ai.defineFlow(
  {
    name: 'generateTravelSuggestionFlow',
    outputSchema: GenerateTravelSuggestionOutputSchema,
  },
  async () => {
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const {output} = await prompt({ currentMonth });
    if (!output) {
      throw new Error('The AI model failed to generate a travel suggestion. This may be a temporary issue.');
    }
    return output;
  }
);
