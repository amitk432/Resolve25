
'use server';
/**
 * @fileOverview A flow to generate a travel suggestion based on the current month.
 *
 * - generateTravelSuggestion - Generates the suggestion.
 * - GenerateTravelSuggestionOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { 
    GenerateTravelSuggestionOutputSchema, 
    GenerateTravelSuggestionInputSchema 
} from '@/lib/types';
import type { 
    GenerateTravelSuggestionOutput, 
    GenerateTravelSuggestionInput 
} from '@/lib/types';

export async function generateTravelSuggestion(input?: GenerateTravelSuggestionInput): Promise<GenerateTravelSuggestionOutput> {
  return generateTravelSuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTravelSuggestionPrompt',
  input: { schema: z.object({ 
    currentMonth: z.string(),
    exclude: z.string().optional(),
   }) },
  output: {schema: GenerateTravelSuggestionOutputSchema},
  prompt: `You are a travel expert. The current month is {{currentMonth}}.
  
  Suggest one interesting travel destination in India that is particularly good to visit during this month.
  
  Consider factors like weather, local events, or seasonal beauty.

  {{#if exclude}}
  Do not suggest the following destination again: {{exclude}}.
  {{/if}}
  
  Provide the output in the specified JSON format, including a destination and a brief reasoning.`,
});

const generateTravelSuggestionFlow = ai.defineFlow(
  {
    name: 'generateTravelSuggestionFlow',
    inputSchema: GenerateTravelSuggestionInputSchema.optional(),
    outputSchema: GenerateTravelSuggestionOutputSchema,
  },
  async (input) => {
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const {output} = await prompt({ currentMonth, exclude: input?.exclude });
    if (!output) {
      throw new Error('The AI model failed to generate a travel suggestion. This may be a temporary issue.');
    }
    return output;
  }
);
