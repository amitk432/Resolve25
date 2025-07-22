
'use server';
/**
 * @fileOverview A flow that generates personalized goal suggestions based on user data.
 *
 * - generateGoalSuggestions - A function that generates goal suggestions.
 * - GenerateGoalSuggestionsInput - The input type for the function.
 * - GenerateGoalSuggestionsOutput - The return type for the function.
 * - SuggestedGoal - The type for a single suggested goal.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { AppData } from '@/lib/types';
import { executeAIFlow } from '@/ai/error-handler';

const GenerateGoalSuggestionsInputSchema = z.object({
  context: z.any().describe('A JSON object containing the complete data for the user\'s dashboard.'),
});
export type GenerateGoalSuggestionsInput = z.infer<typeof GenerateGoalSuggestionsInputSchema>;

const SuggestedGoalSchema = z.object({
    title: z.string().describe('A clear, concise title for the suggested goal.'),
    description: z.string().describe('A brief, motivating description of the goal and why it is relevant to the user.'),
    category: z.enum(['Health', 'Career', 'Personal']).describe('The category for the goal.'),
    steps: z.array(z.string()).describe('A list of 2-3 actionable initial steps to get started on this goal.'),
});
export type SuggestedGoal = z.infer<typeof SuggestedGoalSchema>;

const GenerateGoalSuggestionsOutputSchema = z.object({
  suggestions: z.array(SuggestedGoalSchema).describe('A list of 3-5 personalized goal suggestions.'),
});
export type GenerateGoalSuggestionsOutput = z.infer<typeof GenerateGoalSuggestionsOutputSchema>;

export async function generateGoalSuggestions(input: { context: AppData }): Promise<GenerateGoalSuggestionsOutput> {
  return executeAIFlow(
    () => generateGoalSuggestionsFlow(input),
    'goal suggestions'
  );
}

const prompt = ai.definePrompt({
  name: 'generateGoalSuggestionsPrompt',
  input: {
      schema: z.object({
          context: z.string(), // Pass stringified JSON
          currentDate: z.string(),
      })
    },
  output: {schema: GenerateGoalSuggestionsOutputSchema},
  prompt: `You are an expert life and career coach AI. Your task is to provide personalized, actionable, and inspiring goal suggestions based on the user's complete dashboard data.

The current date is {{currentDate}}.

Analyze all sections of the user's data, including their existing goals, finances (loans, emergency fund, income), job applications, monthly plans, and travel goals. Identify areas for improvement, new opportunities, or next logical steps.

**Analysis guide:**
- **Goals:** Are any goals stagnant? Are there related goals that could be created?
- **Finance:** Does the user have high-interest debt? Is their emergency fund low? Could they start investing (based on income vs. expenses)? Suggest financial goals like "Pay off Personal Loan" or "Start a Monthly SIP of ₹2000".
- **Job Search:** If they are actively searching, suggest goals related to skill-building for their target roles (e.g., "Complete a Certification in [Relevant Skill]"). If they just got a job, suggest a goal for their first 90 days.
- **Monthly Plan/Daily-Todo:** Are they consistently missing tasks in a certain area? This could indicate a need for a new goal to address the root cause.
- **Travel:** If they have planned trips, suggest a goal like "Learn Basic Phrases in [Language of Destination]".

Based on your analysis, generate 3-5 new, distinct, and highly relevant goal suggestions. Do not suggest goals they already have. For each suggestion, provide a clear title, a motivating description, a suitable category ('Health', 'Career', or 'Personal'), and 2-3 concrete initial steps to get them started.

**User's Data Context:**
\`\`\`json
{{{context}}}
\`\`\`

Provide the suggestions in the specified output format.
  `,
});

const generateGoalSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateGoalSuggestionsFlow',
    inputSchema: GenerateGoalSuggestionsInputSchema,
    outputSchema: GenerateGoalSuggestionsOutputSchema,
  },
  async (input) => {
    const contextString = JSON.stringify(input.context, null, 2);
    const currentDate = new Date().toDateString();
    
    const {output} = await prompt({
        context: contextString,
        currentDate,
    });
    if (!output) {
        throw new Error('The AI model failed to generate valid goal suggestions. This may be a temporary issue.');
    }
    return output;
  }
);
