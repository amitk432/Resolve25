
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
  prompt: `You are an expert global relocation advisor. Your task is to analyze the user's profile and recommend the most suitable countries for them to live and work/study in.

Analyze the user's resume (if provided) and their answers to the detailed questionnaire. The resume is the primary source for their profession, skills, and current location. The questionnaire provides lifestyle, family, and specific relocation preferences.

**The user's primary reason for relocating is: {{questionnaire.reasonForRelocation}}**

Based on all available information, generate a list of 3-5 suitable countries.

For each country, provide:
1.  A suitability score (1-100) based on how well it matches the user's entire profile.
2.  A brief summary explaining the recommendation.
3.  A list of specific pros (advantages) for the user.
4.  A list of specific cons (challenges) for the user.

Consider all factors:
- **If relocating for 'Jobs':** Focus on the job market for their profession, cost of living vs. potential salary, and career growth opportunities.
- **If relocating for 'Study':** Focus on top universities for their field, student life, post-study work visa options, and affordability for students.
- **General Factors:** Quality of life, healthcare, education (if family size > 1), cultural aspects, and language.


**User's Questionnaire Data:**
\`\`\`json
{{{questionnaire}}}
\`\`\`

{{#if resume}}
**User's Resume Data (Primary source for profession, skills, and current country):**
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

Based on the selected country and the user's profile, generate a comprehensive relocation plan. The user's primary reason for moving is **{{profile.questionnaire.reasonForRelocation}}**.

**Selected Country:** {{country}}

**User's Profile:**
\`\`\`json
{{{profile}}}
\`\`\`

Create a roadmap with the following sections. Each section must contain a title and a list of detailed, actionable points. For the career/study section, include specific milestones.

1.  **Visa & Documentation:** Outline the most likely visa pathway (based on their reason for relocation and profession) and the key steps to apply. Include required documents.
2.  **Career & Job Search (if reason is 'Jobs') OR Study Plan (if reason is 'Study'):**
    - **If 'Jobs':** Provide specific job search strategies tailored to the user's profession and the local market. Suggest key milestones for their career progression with estimated timelines (e.g., "0-3 Months: Network and apply", "3-6 Months: Secure first interviews"). Include suggested resources like local job boards or professional networks. The title for this section should be "Career & Job Search".
    - **If 'Study':** Provide a plan for university applications. Suggest top universities for their field of interest in the selected country. Outline milestones like "6-9 Months Out: Prepare for entrance exams (e.g., GRE, TOEFL)", "3-6 Months Out: Submit applications", "0-3 Months Out: Arrange student visa and accommodation". Include resources for university rankings and application portals. The title for this section should be "University & Study Plan".
3.  **Housing & Living:** Describe typical housing options and provide realistic monthly cost estimates. Include tips on finding accommodation.
4.  **Cultural Integration:** Offer practical tips for integrating into the local culture, including social etiquette, networking, and language basics.
5.  **Helpful Local Resources:** List helpful online resources like specific expat forums, government sites, or community groups.

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
