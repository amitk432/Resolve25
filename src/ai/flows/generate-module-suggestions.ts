'use server';
/**
 * @fileOverview A flow that generates contextual suggestions for various dashboard modules.
 *
 * - generateModuleSuggestions - A function that generates suggestions based on module data.
 * - ModuleSuggestionInput - The input type for the function.
 * - ModuleSuggestionOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ModuleSuggestionInputSchema = z.object({
  module: z.enum(['DashboardOverview', 'MonthlyPlan', 'CarSale', 'Finance', 'JobSearch', 'Travel']),
  context: z.any().describe('A JSON object containing the data for the specified module.'),
  userQuery: z.string().optional().describe('An optional specific question from the user.'),
});
export type ModuleSuggestionInput = z.infer<typeof ModuleSuggestionInputSchema>;

const ModuleSuggestionOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('A list of 2-3 concise, actionable suggestions.'),
});
export type ModuleSuggestionOutput = z.infer<typeof ModuleSuggestionOutputSchema>;

export async function generateModuleSuggestions(input: ModuleSuggestionInput): Promise<ModuleSuggestionOutput> {
  return moduleSuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'moduleSuggestionPrompt',
  input: {
    schema: z.object({
        module: ModuleSuggestionInputSchema.shape.module,
        context: z.string(), // Pass stringified JSON
        userQuery: ModuleSuggestionInputSchema.shape.userQuery,
        currentDate: z.string(),
    })
  },
  output: {schema: ModuleSuggestionOutputSchema},
  prompt: `You are an expert life and career coach AI. Your task is to provide concise, actionable suggestions based on the user's data for a specific module of their personal dashboard.

    The user is asking for suggestions for the '{{module}}' module. The current date is {{currentDate}}.

    **Module-specific Instructions:**

    - **If the module is 'DashboardOverview':**
      Analyze the user's entire action plan (provided in the JSON context). Look at goals, tasks, and finances. Provide 2-3 high-level, encouraging suggestions. For example, identify a goal that's falling behind and suggest a relevant task, or congratulate them on their financial progress and suggest the next step.
    
    - **If the module is 'MonthlyPlan':**
      Analyze the provided monthly plan data. Focus on the current and next month. Identify potential gaps or suggest new, relevant tasks that align with their overall goals. Do not repeat existing tasks. The context data will be an array of months with tasks.

    - **If the module is 'CarSale':**
      Analyze the car sale financials. The user is selling a car for the specified sale price and has a loan payoff amount. Calculate the net cash. Provide advice on whether this is a good deal and suggest negotiation points or next steps. If the user provides a specific query, address it.

    - **If the module is 'Finance':**
      Analyze the user's loans and emergency fund. The target emergency fund is ₹40,000. Suggest strategies to pay down loans (e.g., avalanche or snowball method) and realistic steps to build their emergency fund. The context data contains loans and the current fund amount.

    - **If the module is 'JobSearch':**
      Review the user's job applications. Suggest networking strategies, how to follow up on applications, or ways to improve their profile based on the roles they are applying for. The context data is a list of their applications.

    - **If the module is 'Travel':**
      Look at their planned and completed travel goals. For planned trips, suggest 1-2 interesting activities. For completed trips, suggest a similar destination they might enjoy next. The context data is a list of travel goals.

    **User's Data Context:**
    \`\`\`json
    {{{context}}}
    \`\`\`

    {{#if userQuery}}
    **User's Specific Question:**
    {{userQuery}}
    {{/if}}

    Based on these instructions and data, provide 2-3 tailored, insightful, and encouraging suggestions. Frame them as helpful advice.
  `,
});

const moduleSuggestionFlow = ai.defineFlow(
  {
    name: 'moduleSuggestionFlow',
    inputSchema: ModuleSuggestionInputSchema,
    outputSchema: ModuleSuggestionOutputSchema,
  },
  async (input) => {
    const contextString = JSON.stringify(input.context, null, 2);
    const currentDate = new Date().toDateString();
    
    const {output} = await prompt({
        ...input,
        context: contextString,
        currentDate,
    });
    return output!;
  }
);
