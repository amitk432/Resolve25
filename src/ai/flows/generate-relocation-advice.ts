'use server';
/**
 * @fileOverview A flow to provide global relocation advice.
 *
 * - generateRelocationAdvice - Generates country recommendations based on user profile.
 * - generateRelocationRoadmap - Generates a detailed roadmap for a chosen country.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { ResumeData } from '@/lib/types';

// Schema for the questionnaire input
export const RelocationQuestionnaireSchema = z.object({
  currentProfession: z.string().describe('The user\'s current profession or field of work.'),
  lifestyle: z.enum(['City', 'Suburban', 'Rural', 'Flexible']).describe('The user\'s preferred lifestyle.'),
  familySize: z.number().int().positive().describe('The number of people in the user\'s family who would be relocating.'),
  languageSkills: z.string().describe('A comma-separated list of languages the user speaks and their proficiency (e.g., "English (Fluent), Spanish (Beginner)").'),
  climatePreference: z.enum(['Warm', 'Cold', 'Temperate', 'No Preference']).describe('The user\'s preferred climate.'),
  workLifeBalance: z.enum(['Priority', 'Important', 'Balanced', 'Flexible']).describe('The importance of work-life balance to the user.'),
  careerGoals: z.string().describe('The user\'s primary career goals for the relocation (e.g., "Growth in tech sector", "Start a business", "Better salary").'),
});
export type RelocationQuestionnaire = z.infer<typeof RelocationQuestionnaireSchema>;


// Schema for the main analysis input
const RelocationAdviceInputSchema = z.object({
  resume: z.any().optional().describe("The user's full resume data as a JSON object."),
  questionnaire: RelocationQuestionnaireSchema,
});
export type RelocationAdviceInput = z.infer<typeof RelocationAdviceInputSchema>;


// Schema for a single country recommendation
const CountryRecommendationSchema = z.object({
  country: z.string().describe('The name of the recommended country.'),
  suitabilityScore: z.number().min(1).max(100).describe('A score from 1-100 indicating how suitable the country is for the user.'),
  summary: z.string().describe('A brief, 2-3 sentence summary explaining why this country is a good match.'),
  pros: z.array(z.string()).describe('A list of 3-5 key advantages (pros) for the user to relocate to this country.'),
  cons: z.array(z.string()).describe('A list of 3-5 key disadvantages (cons) or challenges the user might face.'),
});
export type CountryRecommendation = z.infer<typeof CountryRecommendationSchema>;


// Schema for the main analysis output
const RelocationAdviceOutputSchema = z.object({
  recommendations: z.array(CountryRecommendationSchema).describe('A list of 3-5 recommended countries for relocation, sorted by suitability score.'),
});
export type RelocationAdviceOutput = z.infer<typeof RelocationAdviceOutputSchema>;

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


// --- Schemas and Flow for Relocation Roadmap ---

const RelocationRoadmapInputSchema = z.object({
    country: z.string().describe('The country selected by the user for the roadmap.'),
    profile: RelocationAdviceInputSchema.describe('The user\'s full profile (resume + questionnaire).'),
});
export type RelocationRoadmapInput = z.infer<typeof RelocationRoadmapInputSchema>;

const RelocationRoadmapOutputSchema = z.object({
    visa: z.object({
        title: z.string().describe('Title for the visa section.'),
        steps: z.array(z.string()).describe('Step-by-step visa requirements and application process.'),
    }),
    housing: z.object({
        title: z.string().describe('Title for the housing section.'),
        options: z.array(z.string()).describe('A list of typical housing options and their estimated monthly costs (e.g., "1-bedroom city apartment: $1500", "3-bedroom suburban house: $2500").'),
    }),
    jobSearch: z.object({
        title: z.string().describe('Title for the job search section.'),
        strategies: z.array(z.string()).describe('Actionable job search strategies and insights into the local market relevant to the user\'s profession.'),
    }),
    culturalAdaptation: z.object({
        title: z.string().describe('Title for the cultural adaptation section.'),
        tips: z.array(z.string()).describe('Tips for cultural integration and adaptation.'),
    }),
    localResources: z.object({
        title: z.string().describe('Title for the local resources section.'),
        resources: z.array(z.string()).describe('A list of useful local resources like expat forums, community groups, or official websites.'),
    }),
});
export type RelocationRoadmapOutput = z.infer<typeof RelocationRoadmapOutputSchema>;

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
