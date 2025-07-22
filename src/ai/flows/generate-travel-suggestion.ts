
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
import { executeAIFlow } from '@/ai/error-handler';

export async function generateTravelSuggestion(input?: GenerateTravelSuggestionInput): Promise<GenerateTravelSuggestionOutput> {
  return executeAIFlow(
    () => generateTravelSuggestionFlow(input),
    'travel suggestion'
  );
}

const prompt = ai.definePrompt({
  name: 'generateTravelSuggestionPrompt',
  input: { schema: z.object({ 
    currentMonth: z.string(),
    exclude: z.string().optional(),
    userData: z.string().optional(), // User's complete profile as JSON string
   }) },
  output: {schema: GenerateTravelSuggestionOutputSchema},
  prompt: `You are a travel expert and budget-conscious advisor. The current month is {{currentMonth}}.
  
  {{#if userData}}
  User Profile Data:
  {{userData}}
  
  Based on the user's profile, suggest a budget-friendly travel destination that would be perfect for them this month. Consider:
  - Their financial situation (emergency fund, income sources, existing travel goals)
  - Their career status and availability
  - Their current life priorities and goals
  - Previous travel destinations they've visited
  - Budget-friendly options that provide great value
  {{else}}
  Suggest one interesting budget-friendly travel destination that is particularly good to visit during this month.
  {{/if}}
  
  Consider factors like:
  - Weather and seasonal beauty
  - Local events or festivals
  - Cost-effectiveness and budget options
  - Unique experiences available during this time
  - Accessibility and travel convenience

  {{#if exclude}}
  Do not suggest the following destination again: {{exclude}}.
  {{/if}}
  
  Focus on destinations that offer great experiences without breaking the bank. Include budget travel tips in your reasoning.
  
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
    const userData = input?.userData ? JSON.stringify(input.userData) : undefined;
    const {output} = await prompt({ 
      currentMonth, 
      exclude: input?.exclude,
      userData 
    });
    if (!output) {
      throw new Error('The AI model failed to generate a travel suggestion. This may be a temporary issue.');
    }
    return output;
  }
);
