
'use server';
/**
 * @fileOverview A flow that generates personalized monthly plan suggestions.
 *
 * - generateMonthlyPlanSuggestions - A function that generates plan suggestions.
 * - GenerateMonthlyPlanSuggestionsInput - The input type for the function.
 * - GenerateMonthlyPlanSuggestionsOutput - The return type for the function.
 * - SuggestedMonthlyPlan - The type for a single suggested monthly plan.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { AppData } from '@/lib/types';
import { executeAIFlow } from '@/ai/error-handler';

const GenerateMonthlyPlanSuggestionsInputSchema = z.object({
  context: z.any().describe('A JSON object containing the complete data for the user\'s dashboard.'),
});
export type GenerateMonthlyPlanSuggestionsInput = z.infer<typeof GenerateMonthlyPlanSuggestionsInputSchema>;

const SuggestedMonthlyPlanSchema = z.object({
    month: z.string().describe('The month and year for the plan, e.g., "September 2025".'),
    theme: z.string().describe('A brief, inspiring theme for the month.'),
    tasks: z.array(z.string()).describe('A list of 2-3 actionable tasks for the month that align with the theme and user goals.'),
});
export type SuggestedMonthlyPlan = z.infer<typeof SuggestedMonthlyPlanSchema>;

const GenerateMonthlyPlanSuggestionsOutputSchema = z.object({
  suggestions: z.array(SuggestedMonthlyPlanSchema).describe('A list of 2-3 new monthly plan suggestions.'),
});
export type GenerateMonthlyPlanSuggestionsOutput = z.infer<typeof GenerateMonthlyPlanSuggestionsOutputSchema>;

export async function generateMonthlyPlanSuggestions(input: { context: AppData }): Promise<GenerateMonthlyPlanSuggestionsOutput> {
  return executeAIFlow(
    () => generateMonthlyPlanSuggestionsFlow(input),
    'monthly plan suggestions'
  );
}

const prompt = ai.definePrompt({
  name: 'generateMonthlyPlanSuggestionsPrompt',
  input: {
      schema: z.object({
          context: z.string(), // Pass stringified JSON
          currentDate: z.string(),
      })
    },
  output: {schema: GenerateMonthlyPlanSuggestionsOutputSchema},
  prompt: `You are a productivity coach AI. Your task is to suggest a new, relevant monthly action plan for the user based on their overall dashboard data.

The current date is {{currentDate}}.

Analyze the user's data, focusing on their goals, job search, and financial situation. Identify the next logical upcoming month that is not already in their plan.

Based on your analysis, generate 2-3 suggestions for a new monthly plan. Each plan should be for a future month not already present in the user's \`monthlyPlan\` data. Each plan must include:
1. A month and year (e.g., "September 2025").
2. An inspiring theme for that month.
3. A list of 2-3 specific, actionable tasks that help the user make progress on their main goals.

**User's Data Context:**
\`\`\`json
{{{context}}}
\`\`\`

Provide the suggestions in the specified output format.
  `,
});

const generateMonthlyPlanSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateMonthlyPlanSuggestionsFlow',
    inputSchema: GenerateMonthlyPlanSuggestionsInputSchema,
    outputSchema: GenerateMonthlyPlanSuggestionsOutputSchema,
  },
  async (input) => {
    const contextString = JSON.stringify(input.context, null, 2);
    const currentDate = new Date().toDateString();
    
    const {output} = await prompt({
        context: contextString,
        currentDate,
    });
    if (!output) {
        throw new Error('The AI model failed to generate valid plan suggestions. This may be a temporary issue.');
    }
    return output;
  }
);
