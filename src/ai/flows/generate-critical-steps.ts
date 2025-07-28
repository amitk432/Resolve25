'use server';

/**
 * @fileOverview A flow that generates critical next steps based on comprehensive user data analysis.
 *
 * - generateCriticalSteps - A function that analyzes user data to suggest 3 critical next steps.
 * - GenerateCriticalStepsInput - The input type for the function.
 * - GenerateCriticalStepsOutput - The return type for the function.
 * - CriticalStep - The type for a single critical step.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { AppData, CriticalStep } from '@/lib/types';
import { executeAIFlow } from '@/ai/error-handler';

const GenerateCriticalStepsInputSchema = z.object({
  context: z.any().describe('A JSON object containing the complete user data for analysis.'),
});
export type GenerateCriticalStepsInput = z.infer<typeof GenerateCriticalStepsInputSchema>;

const CriticalStepSchema = z.object({
    text: z.string().describe('A clear, actionable critical step the user should take next.'),
    priority: z.enum(['High', 'Critical', 'Urgent']).describe('The priority level of this step.'),
    category: z.enum(['Goals', 'Career', 'Finance', 'Personal']).describe('The area this step belongs to.'),
    reasoning: z.string().describe('Brief explanation of why this step is critical right now.'),
    timeframe: z.enum(['Today', 'This Week', 'This Month']).describe('Recommended timeframe to complete this step.'),
});

const GenerateCriticalStepsOutputSchema = z.object({
  steps: z.array(CriticalStepSchema).length(3).describe('Exactly 3 critical steps ranked by priority and urgency.'),
});
export type GenerateCriticalStepsOutput = z.infer<typeof GenerateCriticalStepsOutputSchema>;

export async function generateCriticalSteps(input: { context: AppData }): Promise<GenerateCriticalStepsOutput> {
  return executeAIFlow(
    () => generateCriticalStepsFlow(input),
    'critical steps analysis'
  );
}

const prompt = ai.definePrompt({
  name: 'generateCriticalStepsPrompt',
  input: {
      schema: z.object({
          context: z.string(), // Pass stringified user data
          currentDate: z.string(),
      })
    },
  output: {schema: GenerateCriticalStepsOutputSchema},
  prompt: `You are an AI life coach analyzing a user's complete life data to identify the 3 most critical next steps they should take.

  Current Date: {{currentDate}}
  
  User's Complete Profile and Data:
  {{context}}
  
  Analyze the user's complete situation focusing specifically on these 4 key areas:
  1. **Goals** - Progress, deadlines, blocked steps
  2. **Monthly Plan** - Current month tasks and themes  
  3. **Job Search** - Application status, interview progress, career advancement
  4. **Finance Tracker** - Emergency fund, loans, SIPs, income sources
  
  Based on this analysis, identify the 3 MOST CRITICAL steps the user should take next from these areas only.
  
  Priority Factors (focus only on these 4 areas):
  - **Goals**: Urgent deadlines approaching, blocked or stalled progress on important goals
  - **Monthly Plan**: Key tasks for current month that are behind schedule or critical
  - **Job Search**: Time-sensitive applications, interview preparations, career opportunities
  - **Finance Tracker**: Emergency fund shortfalls, high-interest loans, SIP optimizations
  - High-impact actions that unlock progress across multiple areas
  - Financial security and stability needs
  
  CRITICAL REQUIREMENTS for step text:
  - Keep each step text under 50 characters maximum
  - Use concise, actionable language
  - Avoid long explanations or detailed instructions
  - Focus on the core action needed
  - Use short, punchy phrases
  - Example good formats:
    * "Pay Home Loan EMI ₹45k"
    * "Complete 3 overdue tasks"
    * "Apply to 2 priority jobs"
    * "Build emergency fund +₹20k"
    * "Review monthly goals"
  
  Guidelines:
  - Focus on actionable, specific steps (not generic advice)
  - Prioritize steps that have the highest impact on their overall life progress
  - Consider dependencies between different areas of their life
  - Balance urgent vs important (Eisenhower Matrix thinking)
  - Be realistic about what they can accomplish in the given timeframes
  - Avoid suggesting steps that are already in progress or completed
  
  For each critical step, provide:
  1. Clear, specific actionable text (UNDER 50 CHARACTERS)
  2. Priority level (Critical > Urgent > High)
  3. Category (Goals/Career/Finance/Personal)
  4. Reasoning for why this is critical right now
  5. Realistic timeframe (Today/This Week/This Month)`,
});

const generateCriticalStepsFlow = ai.defineFlow(
  {
    name: 'generateCriticalStepsFlow',
    inputSchema: GenerateCriticalStepsInputSchema,
    outputSchema: GenerateCriticalStepsOutputSchema,
  },
  async (input) => {
    const response = await prompt({
      context: JSON.stringify(input.context, null, 2),
      currentDate: new Date().toISOString().split('T')[0],
    });

    return response.output || { steps: [] };
  }
);
