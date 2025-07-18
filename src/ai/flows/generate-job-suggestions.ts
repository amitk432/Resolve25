
'use server';
/**
 * @fileOverview A flow that generates job suggestions based on a user's resume.
 *
 * - generateJobSuggestions - A function that handles the job suggestion process.
 * - GenerateJobSuggestionsInput - The input type for the function.
 * - GenerateJobSuggestionsOutput - The return type for the function.
 * - SuggestedJobApplication - The type for a single suggested job.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { ResumeData } from '@/lib/types';

const GenerateJobSuggestionsInputSchema = z.object({
  resume: z.any().describe("A JSON object containing the user's parsed resume data."),
});
export type GenerateJobSuggestionsInput = z.infer<typeof GenerateJobSuggestionsInputSchema>;

const SuggestedJobApplicationSchema = z.object({
    company: z.string().describe('The name of the company hiring.'),
    role: z.string().describe('The job title or role being offered.'),
    location: z.string().describe('The location of the job, e.g., "Bengaluru, India".'),
    jobType: z.enum(['Full-time', 'Part-time', 'Contract', 'Internship']).describe('The type of employment.'),
    salaryRange: z.string().optional().describe('An estimated salary range for the role, e.g., "₹12-15 LPA".'),
    keyResponsibilities: z.array(z.string()).describe('A list of 2-3 key responsibilities for this role.'),
    requiredSkills: z.array(z.string()).describe('A list of 2-3 essential skills required for the job.'),
    reasoning: z.string().describe('A brief explanation (1-2 sentences) of why this job is a good fit for the user based on their resume.'),
    applyLink: z.string().optional().describe('A URL to a Google search for the job. e.g., "https://www.google.com/search?q=Software+Engineer+at+Acme+Inc"'),
});
export type SuggestedJobApplication = z.infer<typeof SuggestedJobApplicationSchema>;

const GenerateJobSuggestionsOutputSchema = z.object({
  suggestions: z.array(SuggestedJobApplicationSchema).describe('A list of 5-7 relevant job suggestions.'),
});
export type GenerateJobSuggestionsOutput = z.infer<typeof GenerateJobSuggestionsOutputSchema>;

export async function generateJobSuggestions(input: { resume: ResumeData }): Promise<GenerateJobSuggestionsOutput> {
  return generateJobSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateJobSuggestionsPrompt',
  input: {
      schema: z.object({
          resume: z.string(), // Pass stringified JSON
      })
    },
  output: {schema: GenerateJobSuggestionsOutputSchema},
  prompt: `You are an expert career advisor and recruitment specialist. Your task is to analyze the user's resume and suggest highly relevant job opportunities.

Analyze the user's work experience (especially roles and responsibilities) and their skills. Based on this, generate 5-7 realistic and suitable job suggestions.

For each suggestion, provide:
1.  **Company Name:** A plausible, well-known company in the relevant industry.
2.  **Job Role:** The specific job title.
3.  **Location:** A realistic city for the job (e.g., "Bengaluru, India").
4.  **Job Type:** The type of employment (Full-time, Part-time, Contract, Internship).
5.  **Salary Range:** A realistic estimated salary range (e.g., "₹12-15 LPA"). This is optional.
6.  **Key Responsibilities:** A list of 2-3 key responsibilities.
7.  **Required Skills:** A list of 2-3 crucial skills for the role.
8.  **Reasoning:** A short, 1-2 sentence explanation of why this role is a good match, referencing specific skills or experiences from their resume.
9.  **Apply Link:** A URL that performs a Google search for the job role at the company. For example, for a "Software Engineer" role at "Acme Inc.", the URL should be "https://www.google.com/search?q=Software+Engineer+at+Acme+Inc". Make sure to URL-encode the query.

**User's Resume Data:**
\`\`\`json
{{{resume}}}
\`\`\`

Provide the suggestions in the specified JSON output format.
  `,
});

const generateJobSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateJobSuggestionsFlow',
    inputSchema: GenerateJobSuggestionsInputSchema,
    outputSchema: GenerateJobSuggestionsOutputSchema,
  },
  async (input) => {
    if (!input.resume) {
        throw new Error('Resume data is required to generate job suggestions.');
    }
    const resumeString = JSON.stringify(input.resume, null, 2);
    
    const {output} = await prompt({
        resume: resumeString,
    });
    if (!output) {
        throw new Error('The AI model failed to generate valid job suggestions. This may be a temporary issue.');
    }
    return output;
  }
);
