
'use server';
/**
 * @fileOverview A flow to generate a tailored application email/cover letter.
 *
 * - generateApplicationEmail - A function to generate the email.
 * - GenerateApplicationEmailInput - The input type for the function.
 * - GenerateApplicationEmailOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { ResumeData, JobApplication } from '@/lib/types';

const GenerateApplicationEmailInputSchema = z.object({
  resume: z.any().describe("The user's full resume data as a JSON object."),
  jobApplication: z.any().describe("The specific job application details as a JSON object."),
});
export type GenerateApplicationEmailInput = z.infer<typeof GenerateApplicationEmailInputSchema>;

const GenerateApplicationEmailOutputSchema = z.object({
  subject: z.string().describe('A compelling subject line for the job application email.'),
  body: z.string().describe('The full body of the email, formatted professionally. It should be personalized, mention the company and role, and highlight 2-3 key skills/experiences from the resume that match the job description. Use placeholders like [Hiring Manager Name] if not known. Keep it concise and impactful.'),
});
export type GenerateApplicationEmailOutput = z.infer<typeof GenerateApplicationEmailOutputSchema>;

export async function generateApplicationEmail(input: { resume: ResumeData, jobApplication: JobApplication }): Promise<GenerateApplicationEmailOutput> {
  return generateApplicationEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateApplicationEmailPrompt',
  input: {
      schema: z.object({
          resume: z.string(), // Pass stringified JSON
          jobApplication: z.string(), // Pass stringified JSON
      })
    },
  output: {schema: GenerateApplicationEmailOutputSchema},
  prompt: `You are an expert career coach AI assisting a user in writing a professional and effective email to apply for a job.

Analyze the user's resume and the specific job application details provided. Your task is to craft a compelling subject line and a personalized email body.

**Key instructions for the email body:**
- Address it to "Dear Hiring Team," or "Dear {{jobApplication.company}} Team,".
- Clearly state the position being applied for: '{{jobApplication.role}} at {{jobApplication.company}}'.
- Briefly introduce the user and express enthusiasm for the role.
- **Crucially, connect the user's background to the job.** Pick 2-3 of the most relevant skills or experiences from the resume and explain how they align with the key responsibilities or required skills of the job application.
- Keep the tone professional, confident, and concise.
- End with a call to action, expressing eagerness for an interview.
- Sign off as "{{resume.contactInfo.name}}".

**User's Resume Data:**
\`\`\`json
{{{resume}}}
\`\`\`

**Job Application Details:**
\`\`\`json
{{{jobApplication}}}
\`\`\`

Generate the email subject and body in the specified JSON format.
  `,
});

const generateApplicationEmailFlow = ai.defineFlow(
  {
    name: 'generateApplicationEmailFlow',
    inputSchema: GenerateApplicationEmailInputSchema,
    outputSchema: GenerateApplicationEmailOutputSchema,
  },
  async (input) => {
    const resumeString = JSON.stringify(input.resume, null, 2);
    const jobApplicationString = JSON.stringify(input.jobApplication, null, 2);
    
    const {output} = await prompt({
        resume: resumeString,
        jobApplication: jobApplicationString,
    });
    if (!output) {
        throw new Error('The AI model failed to generate a valid email. This may be a temporary issue.');
    }
    return output;
  }
);
