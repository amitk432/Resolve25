
'use server';
/**
 * @fileOverview A flow to provide global relocation advice.
 *
 * - generateRelocationAdvice - Generates country recommendations based on user profile.
 * - generateRelocationRoadmap - Generates a detailed roadmap for a chosen country.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {
    RelocationQuestionnaireSchema,
    RelocationAdviceInputSchema,
    RelocationAdviceOutputSchema,
    RelocationRoadmapInputSchema,
    RelocationRoadmapOutputSchema,
    type RelocationAdviceInput,
    type RelocationAdviceOutput,
    type RelocationRoadmapInput,
    type RelocationRoadmapOutput
} from '@/lib/types';


/**
 * Generates relocation advice based on resume and questionnaire.
 */
export async function generateRelocationAdvice(input: RelocationAdviceInput): Promise<RelocationAdviceOutput> {
  return relocationAdviceFlow(input);
}

const relocationAdvicePrompt = ai.definePrompt({
  name: 'relocationAdvicePrompt',
  input: {
      schema: z.object({
          resume: z.string().optional(),
          questionnaire: z.string(),
      })
    },
  output: {schema: RelocationAdviceOutputSchema},
  prompt: `You are an expert global relocation advisor. Your task is to analyze the user's profile and recommend the most suitable countries for them to live and work in.

Analyze the user's resume (if provided) and their answers to the detailed questionnaire. Based on their profession, skills, lifestyle preferences, family size, and career goals, generate a list of 3-5 suitable countries.

For each country, provide:
1.  A suitability score (1-100) based on how well it matches the user's entire profile.
2.  A brief summary explaining the recommendation.
3.  A list of specific pros (advantages) for the user.
4.  A list of specific cons (challenges) for the user.

Consider all factors: job market for their profession, cost of living vs. potential salary, quality of life, healthcare, education (if family size > 1), cultural aspects, and language.

**User's Questionnaire Data:**
\`\`\`json
{{{questionnaire}}}
\`\`\`

{{#if resume}}
**User's Resume Data:**
\`\`\`json
{{{resume}}}
\`\`\`
{{/if}}

Provide the recommendations in the specified JSON format, sorted from the highest suitability score to the lowest.
  `,
});

const relocationAdviceFlow = ai.defineFlow(
  {
    name: 'relocationAdviceFlow',
    inputSchema: RelocationAdviceInputSchema,
    outputSchema: RelocationAdviceOutputSchema,
  },
  async (input) => {
    const questionnaireString = JSON.stringify(input.questionnaire, null, 2);
    const resumeString = input.resume ? JSON.stringify(input.resume, null, 2) : undefined;
    
    const {output} = await relocationAdvicePrompt({
        resume: resumeString,
        questionnaire: questionnaireString,
    });
    if (!output) {
        throw new Error('The AI model failed to generate relocation advice. This may be a temporary issue.');
    }
    return output;
  }
);


// --- Flow for Relocation Roadmap ---

/**
 * Generates a detailed relocation roadmap for a specific country.
 */
export async function generateRelocationRoadmap(input: RelocationRoadmapInput): Promise<RelocationRoadmapOutput> {
    return relocationRoadmapFlow(input);
}

const relocationRoadmapPrompt = ai.definePrompt({
    name: 'relocationRoadmapPrompt',
    input: {
        schema: z.object({
            country: z.string(),
            profile: z.string(),
        })
    },
    output: { schema: RelocationRoadmapOutputSchema },
    prompt: `You are an expert global relocation advisor. The user has chosen a country and needs a detailed step-by-step roadmap.

Based on the selected country and the user's profile, generate a comprehensive relocation plan.

**Selected Country:** {{country}}

**User's Profile:**
\`\`\`json
{{{profile}}}
\`\`\`

Create a roadmap with the following sections:
1.  **Visa Requirements:** Outline the most likely visa pathway for the user (based on their profession) and the key steps to apply.
2.  **Housing Options:** Describe typical housing options and provide realistic monthly cost estimates.
3.  **Job Search:** Provide specific job search strategies tailored to the user's profession and the local market of the selected country.
4.  **Cultural Adaptation:** Offer practical tips for integrating into the local culture.
5.  **Local Resources:** List helpful online resources like specific expat forums, government sites, or community groups.

Provide the roadmap in the specified JSON format.
    `,
});

const relocationRoadmapFlow = ai.defineFlow(
    {
        name: 'relocationRoadmapFlow',
        inputSchema: RelocationRoadmapInputSchema,
        outputSchema: RelocationRoadmapOutputSchema,
    },
    async (input) => {
        const profileString = JSON.stringify(input.profile, null, 2);
        
        const { output } = await relocationRoadmapPrompt({
            country: input.country,
            profile: profileString,
        });

        if (!output) {
            throw new Error('The AI model failed to generate a relocation roadmap.');
        }

        return output;
    }
);
