'use server';
/**
 * @fileOverview A flow to parse resume content and extract structured data.
 *
 * - parseResume - A function that handles the resume parsing process.
 * - ParseResumeInput - The input type for the parseResume function.
 * - ResumeData - The return type for the parseResume function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ContactInfoSchema = z.object({
  name: z.string().describe('The full name of the person.'),
  location: z.string().describe('The city and country, e.g., "New Delhi".'),
  phone: z.string().describe('The phone number.'),
  email: z.string().describe('The email address.'),
  linkedin: z.string().describe('The full LinkedIn profile URL.'),
  github: z.string().describe('The full GitHub profile URL.'),
});

const WorkExperienceSchema = z.object({
  company: z.string().describe('The name of the company.'),
  location: z.string().describe('The location of the company, e.g., "Gurugram".'),
  role: z.string().describe('The job title or role.'),
  dates: z.string().describe('The start and end dates, e.g., "Oct 2021 - Present".'),
  descriptionPoints: z.array(z.string()).describe('A list of achievements or responsibilities.'),
});

const ProjectSchema = z.object({
  name: z.string().describe('The name of the project.'),
  dates: z.string().describe('The start and end dates for the project, e.g., "Apr 2025 - Present".'),
  description: z.string().describe('A description of the project.'),
});

const EducationSchema = z.object({
  institution: z.string().describe('The name of the institution.'),
  degree: z.string().describe('The degree obtained.'),
  location: z.string().describe('The location of the institution, e.g., "New Delhi".'),
  gpa: z.string().describe('The GPA or percentage, e.g., "GPA: 70.13%".'),
  date: z.string().describe('The graduation date, e.g., "May 2021".'),
});

const ResumeDataSchema = z.object({
  contactInfo: ContactInfoSchema,
  summary: z.object({
    title: z.string().describe('The main job title or headline, e.g., "Software Quality Analyst".'),
    text: z.string().describe('The professional summary text.'),
  }),
  skills: z.record(z.string()).describe('An object where keys are skill categories (e.g., "Testing Types") and values are comma-separated strings of skills.'),
  workExperience: z.array(WorkExperienceSchema),
  projects: z.array(ProjectSchema),
  education: z.array(EducationSchema),
});

export type ResumeData = z.infer<typeof ResumeDataSchema>;

const ParseResumeInputSchema = z.object({
  resumeText: z.string().describe('The full text content of the resume.'),
});
export type ParseResumeInput = z.infer<typeof ParseResumeInputSchema>;

export async function parseResume(input: ParseResumeInput): Promise<ResumeData> {
  return parseResumeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'parseResumePrompt',
  input: {schema: ParseResumeInputSchema},
  output: {schema: ResumeDataSchema},
  prompt: `You are an expert resume parser. Analyze the following resume text and extract the information into a structured JSON format. Pay close attention to dates, job titles, and responsibilities. Group skills by their category.

Resume Text:
\`\`\`
{{{resumeText}}}
\`\`\`

Provide the output in the specified JSON format.
  `,
});

const parseResumeFlow = ai.defineFlow(
  {
    name: 'parseResumeFlow',
    inputSchema: ParseResumeInputSchema,
    outputSchema: ResumeDataSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('The AI model failed to parse the resume. Please check the content and try again.');
    }
    return output;
  }
);
