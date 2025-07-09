'use server';

/**
 * @fileOverview A flow that generates tailored tips to overcome specific obstacles in achieving goals.
 *
 * - generateGoalTips - A function that generates goal achievement tips.
 * - GenerateGoalTipsInput - The input type for the generateGoalTips function.
 * - GenerateGoalTipsOutput - The return type for the generateGoalTips function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateGoalTipsInputSchema = z.object({
  goal: z.string().describe('The specific goal the user is trying to achieve.'),
  obstacle: z.string().describe('The specific obstacle the user is facing.'),
});
export type GenerateGoalTipsInput = z.infer<typeof GenerateGoalTipsInputSchema>;

const GenerateGoalTipsOutputSchema = z.object({
  tips: z.array(z.string()).describe('A list of tailored tips to overcome the obstacle and achieve the goal.'),
});
export type GenerateGoalTipsOutput = z.infer<typeof GenerateGoalTipsOutputSchema>;

export async function generateGoalTips(input: GenerateGoalTipsInput): Promise<GenerateGoalTipsOutput> {
  return generateGoalTipsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateGoalTipsPrompt',
  input: {schema: GenerateGoalTipsInputSchema},
  output: {schema: GenerateGoalTipsOutputSchema},
  prompt: `You are a motivational coach providing advice to users trying to achieve their goals.

  The user is trying to achieve the following goal:
  {{goal}}

  The user is facing the following obstacle:
  {{obstacle}}

  Provide 3 tailored tips to overcome this obstacle and achieve the goal.`,
});

const generateGoalTipsFlow = ai.defineFlow(
  {
    name: 'generateGoalTipsFlow',
    inputSchema: GenerateGoalTipsInputSchema,
    outputSchema: GenerateGoalTipsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('The AI model failed to generate valid tips. This may be a temporary issue.');
    }
    return output;
  }
);
