
'use server';
/**
 * @fileOverview A flow that generates personalized daily task suggestions based on user data.
 *
 * - generateTaskSuggestions - A function that generates task suggestions.
 * - GenerateTaskSuggestionsInput - The input type for the function.
 * - GenerateTaskSuggestionsOutput - The return type for the function.
 * - SuggestedTask - The type for a single suggested task.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { AppData, DailyTaskCategory, DailyTaskPriority } from '@/lib/types';

const GenerateTaskSuggestionsInputSchema = z.object({
  context: z.any().describe('A JSON object containing the complete data for the user\'s dashboard.'),
});
export type GenerateTaskSuggestionsInput = z.infer<typeof GenerateTaskSuggestionsInputSchema>;

const SuggestedTaskSchema = z.object({
    title: z.string().describe('A clear, actionable title for the suggested task.'),
    description: z.string().optional().describe('A brief explanation of why this task is important today.'),
    category: z.enum(['Work', 'Personal', 'Errands']).describe('The category for the task.'),
    priority: z.enum(['Low', 'Medium', 'High']).describe('The suggested priority for the task.'),
});
export type SuggestedTask = z.infer<typeof SuggestedTaskSchema>;

const GenerateTaskSuggestionsOutputSchema = z.object({
  suggestions: z.array(SuggestedTaskSchema).describe('A list of 3-5 personalized daily task suggestions.'),
});
export type GenerateTaskSuggestionsOutput = z.infer<typeof GenerateTaskSuggestionsOutputSchema>;

export async function generateTaskSuggestions(input: { context: AppData }): Promise<GenerateTaskSuggestionsOutput> {
  return generateTaskSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTaskSuggestionsPrompt',
  input: {
      schema: z.object({
          context: z.string(), // Pass stringified JSON
          currentDate: z.string(),
      })
    },
  output: {schema: GenerateTaskSuggestionsOutputSchema},
  prompt: `You are a productivity coach AI. Your task is to suggest 3-5 specific, actionable daily tasks for the user based on their overall dashboard data. The goal is to help them make progress on their larger goals.

The current date is {{currentDate}}. The tasks you suggest should be for today.

Analyze the user's data, focusing on:
- **Active Goals:** Look at the next uncompleted step for each active goal. If a step is large (e.g., "Apply to 10 jobs"), break it down into a smaller daily task (e.g., "Apply to 2-3 jobs today" or "Research 5 companies to apply to").
- **Monthly Plan:** Check the current month's plan for any outstanding tasks.
- **Financials:** If they have a goal to build an emergency fund but haven't started, suggest a task like "Research and open a high-yield savings account".
- **Existing Daily Tasks:** Avoid suggesting tasks that are already on their to-do list for today.

Based on your analysis, generate 3-5 highly relevant daily tasks. For each task, provide a clear title, a brief description of its relevance, a suitable category ('Work', 'Personal', or 'Errands'), and a priority ('Low', 'Medium', 'High').

**User's Data Context:**
\`\`\`json
{{{context}}}
\`\`\`

Provide the suggestions in the specified output format.
  `,
});

const generateTaskSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateTaskSuggestionsFlow',
    inputSchema: GenerateTaskSuggestionsInputSchema,
    outputSchema: GenerateTaskSuggestionsOutputSchema,
  },
  async (input) => {
    const contextString = JSON.stringify(input.context, null, 2);
    const currentDate = new Date().toDateString();
    
    const {output} = await prompt({
        context: contextString,
        currentDate,
    });
    if (!output) {
        throw new Error('The AI model failed to generate valid task suggestions. This may be a temporary issue.');
    }
    return output;
  }
);
