/**
 * @fileOverview A flow that generates job-specific resumes by customizing base resume for target positions.
 *
 * - generateJobSpecificResume - A function that customizes a resume for a specific job application.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { executeAIFlow } from '@/ai/error-handler';
import type { ResumeData, JobApplication } from '@/lib/types';

const generateJobSpecificResumeInputSchema = z.object({
  baseResume: z.any().describe('The base resume data object'),
  jobApplication: z.any().describe('The job application data object'),
});
export type GenerateJobSpecificResumeInput = z.infer<typeof generateJobSpecificResumeInputSchema>;

// Schema that matches the ResumeData interface exactly
const resumeContactInfoSchema = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  linkedin: z.string(),
  github: z.string(),
});

const resumeWorkExperienceSchema = z.object({
  company: z.string(),
  role: z.string(),
  location: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  isCurrent: z.boolean(),
  descriptionPoints: z.array(z.string())
});

const resumeProjectSchema = z.object({
  name: z.string(),
  description: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  isCurrent: z.boolean()
});

const resumeEducationSchema = z.object({
  institution: z.string(),
  degree: z.string(),
  location: z.string(),
  gpa: z.string(),
  endDate: z.string().nullable()
});

const jobSpecificResumeOutputSchema = z.object({
  contactInfo: resumeContactInfoSchema,
  summary: z.object({
    title: z.string().describe('Professional title tailored to the job role'),
    text: z.string().describe('Professional summary tailored to highlight relevant skills and experience for this specific job')
  }),
  skills: z.object({
    'Technical Skills': z.string().describe('Programming languages, frameworks, and technical tools'),
    'Soft Skills': z.string().describe('Communication, leadership, and interpersonal skills'),
    'Industry Skills': z.string().describe('Domain-specific knowledge and industry expertise'),
    'Tools & Technologies': z.string().describe('Software tools, platforms, and development environments')
  }).describe('Skills categorized and enhanced to match job requirements'),
  workExperience: z.array(resumeWorkExperienceSchema),
  projects: z.array(resumeProjectSchema),
  education: z.array(resumeEducationSchema)
});

export type GenerateJobSpecificResumeOutput = z.infer<typeof jobSpecificResumeOutputSchema>;

export async function generateJobSpecificResume(input: { baseResume: ResumeData; jobApplication: JobApplication }): Promise<GenerateJobSpecificResumeOutput> {
  return executeAIFlow(
    () => generateJobSpecificResumeFlow(input),
    'job-specific resume generation'
  );
}

const prompt = ai.definePrompt({
  name: 'generateJobSpecificResumePrompt',
  input: {
    schema: z.object({
      baseResume: z.string(),
      jobApplication: z.string(), 
      jobDescription: z.string(),
    }),
  },
  output: { schema: jobSpecificResumeOutputSchema },
  prompt: `You are an expert resume writer. Customize the given resume for a specific job application.

Base Resume:
{{baseResume}}

Job Application:
{{jobApplication}}

Job Description:
{{jobDescription}}

IMPORTANT INSTRUCTIONS:
- Do NOT mention the target company name anywhere in the resume
- Do NOT reference the specific company in experience descriptions
- Use generic terms like "previous employer", "current company", or industry-specific terms
- Focus on skills and achievements that are transferable to the target role

Return the customized resume with:
1. Keep all contact info exactly the same
2. Update the summary title and text to match the job role (without mentioning target company)
3. Reorder and enhance skills to match job requirements
4. Rewrite work experience descriptions to highlight relevant achievements without company-specific references
5. Enhance project descriptions to showcase relevant skills
6. Keep education details factual
7. Use action verbs and quantifiable achievements
8. Ensure all content is generic enough to be applicable to similar roles at different companies

Make the resume compelling for this specific job while staying truthful and company-agnostic.`,
});

const generateJobSpecificResumeFlow = ai.defineFlow(
  {
    name: 'generateJobSpecificResumeFlow',
    inputSchema: generateJobSpecificResumeInputSchema,
    outputSchema: jobSpecificResumeOutputSchema,
  },
  async (input) => {
    try {
      console.log('🔧 Generating job-specific resume for:', input.jobApplication?.company || 'Unknown Company');
      
      const response = await prompt({
        baseResume: JSON.stringify(input.baseResume, null, 2),
        jobApplication: JSON.stringify(input.jobApplication, null, 2),
        jobDescription: input.jobApplication?.additionalDescription || 'No additional job description provided',
      });

      console.log('✅ Successfully generated job-specific resume');
      return response.output || input.baseResume;
    } catch (error) {
      console.error('❌ Error in generateJobSpecificResumeFlow:', error);
      throw error;
    }
  }
);
