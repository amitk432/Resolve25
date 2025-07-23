'use server';

/**
 * @fileOverview A flow that generates actionable step suggestions for existing goals based on user data.
 *
 * - generateGoalStepSuggestions - A function that generates step suggestions for a goal.
 * - GenerateGoalStepSuggestionsInput - The input type for the function.
 * - GenerateGoalStepSuggestionsOutput - The return type for the function.
 * - SuggestedStep - The type for a single suggested step.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { AppData, Goal } from '@/lib/types';
import { executeAIFlow } from '@/ai/error-handler';

const GenerateGoalStepSuggestionsInputSchema = z.object({
  goal: z.any().describe('The goal object for which to generate step suggestions.'),
  context: z.any().describe('A JSON object containing the complete user data for personalized suggestions.'),
});
export type GenerateGoalStepSuggestionsInput = z.infer<typeof GenerateGoalStepSuggestionsInputSchema>;

const SuggestedStepSchema = z.object({
    text: z.string().describe('A clear, actionable step towards achieving the goal.'),
    priority: z.enum(['Low', 'Medium', 'High']).describe('The suggested priority for this step.'),
    reasoning: z.string().describe('Brief explanation of why this step is important for achieving the goal.'),
});
export type SuggestedStep = z.infer<typeof SuggestedStepSchema>;

const GenerateGoalStepSuggestionsOutputSchema = z.object({
  suggestions: z.array(SuggestedStepSchema).describe('A list of 3-5 personalized actionable step suggestions for the goal.'),
});
export type GenerateGoalStepSuggestionsOutput = z.infer<typeof GenerateGoalStepSuggestionsOutputSchema>;

export async function generateGoalStepSuggestions(input: { goal: Goal; context: AppData }): Promise<GenerateGoalStepSuggestionsOutput> {
  return executeAIFlow(
    () => generateGoalStepSuggestionsFlow(input),
    'goal step suggestions'
  );
}

const prompt = ai.definePrompt({
  name: 'generateGoalStepSuggestionsPrompt',
  input: {
      schema: z.object({
          goal: z.string(), // Pass stringified goal
          context: z.string(), // Pass stringified user data
          currentDate: z.string(),
      })
    },
  output: {schema: GenerateGoalStepSuggestionsOutputSchema},
  prompt: `You are an AI life coach helping users break down their goals into actionable steps.

  Current Date: {{currentDate}}
  
  User's Goal Details:
  {{goal}}
  
  User's Complete Profile and Data:
  {{context}}
  
  Based on the user's goal, existing progress, and their overall life context, generate 3-5 specific, actionable steps they can take to move closer to achieving this goal.
  
  Guidelines:
  - Make steps specific and measurable
  - Consider the user's existing data (other goals, tasks, finances, etc.) for personalized suggestions
  - Prioritize steps based on impact and feasibility
  - Ensure steps are realistic and achievable
  - Consider the goal's deadline and current progress
  - Avoid suggesting steps that are already completed or very similar to existing steps
  - Make steps diverse (short-term and long-term, different types of actions)
  
  For each step, provide:
  1. A clear, actionable text description
  2. A priority level (Low/Medium/High)
  3. A brief reasoning for why this step is important`,
});

const generateGoalStepSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateGoalStepSuggestionsFlow',
    inputSchema: GenerateGoalStepSuggestionsInputSchema,
    outputSchema: GenerateGoalStepSuggestionsOutputSchema,
  },
  async (input) => {
    const response = await prompt({
      goal: JSON.stringify(input.goal, null, 2),
      context: JSON.stringify(input.context, null, 2),
      currentDate: new Date().toISOString().split('T')[0],
    });

    return response.output || { suggestions: [] };
  }
);
