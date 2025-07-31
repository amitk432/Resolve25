
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
import { executeAIFlow } from '@/ai/error-handler';

const GenerateJobSuggestionsInputSchema = z.object({
  resume: z.any().describe("A JSON object containing the user's parsed resume data."),
  userPreferences: z.any().optional().describe("User's job search preferences including location, experience level, etc."),
  existingApplications: z.array(z.any()).optional().describe("Array of existing job applications to avoid duplicates."),
});
export type GenerateJobSuggestionsInput = z.infer<typeof GenerateJobSuggestionsInputSchema>;

const SuggestedJobApplicationSchema = z.object({
    company: z.string().describe('The name of the company hiring.'),
    role: z.string().describe('The job title or role being offered.'),
    location: z.string().describe('The location of the job, e.g., "Bengaluru, India" or "San Francisco, USA (Remote)".'),
    country: z.string().optional().describe('The country where the job is located.'),
    jobType: z.enum(['Full-time', 'Part-time', 'Contract', 'Internship']).describe('The type of employment.'),
    workArrangement: z.enum(['Remote', 'Hybrid', 'On-site']).optional().describe('Work arrangement type.'),
    salaryRange: z.string().optional().describe('An estimated salary range for the role, e.g., "₹12-15 LPA" or "$80,000-$120,000".'),
    keyResponsibilities: z.array(z.string()).describe('A list of 2-3 key responsibilities for this role.'),
    requiredSkills: z.array(z.string()).describe('A list of 2-3 essential skills required for the job.'),
    reasoning: z.string().describe('A brief explanation (1-2 sentences) of why this job is a good fit for the user based on their resume.'),
    applyLink: z.string().describe('A direct application URL to job boards like LinkedIn, Indeed, or company career pages.'),
    visaSponsorship: z.object({
      available: z.boolean().describe('Whether visa sponsorship is available.'),
      types: z.array(z.string()).optional().describe('Types of visas sponsored (H1B, Tier 2, etc.)'),
    }).optional().describe('Visa sponsorship information for international jobs.'),
});
export type SuggestedJobApplication = z.infer<typeof SuggestedJobApplicationSchema>;

const GenerateJobSuggestionsOutputSchema = z.object({
  suggestions: z.array(SuggestedJobApplicationSchema).describe('A list of 5-7 relevant job suggestions.'),
});
export type GenerateJobSuggestionsOutput = z.infer<typeof GenerateJobSuggestionsOutputSchema>;

export async function generateJobSuggestions(input: { resume: ResumeData; userPreferences?: any; existingApplications?: any[] }): Promise<GenerateJobSuggestionsOutput> {
  return executeAIFlow(
    () => generateJobSuggestionsFlow(input),
    'job suggestions'
  );
}

const prompt = ai.definePrompt({
  name: 'generateJobSuggestionsPrompt',
  input: {
      schema: z.object({
          resume: z.string(), // Pass stringified JSON
          userPreferences: z.string().optional(), // Pass stringified preferences
          searchScope: z.string().optional(), // worldwide or current-country
          existingApplications: z.string().optional(), // Pass stringified existing applications
      })
    },
  output: {schema: GenerateJobSuggestionsOutputSchema},
  prompt: `You are a global talent acquisition specialist and career strategist with access to worldwide job markets. 

**SEARCH SCOPE: {{searchScope}}**

**USER'S RESUME DATA:**
\`\`\`json
{{{resume}}}
\`\`\`

**USER PREFERENCES:**
{{#if userPreferences}}
\`\`\`json
{{{userPreferences}}}
\`\`\`
{{else}}
No specific preferences provided.
{{/if}}

**EXISTING APPLICATIONS (AVOID DUPLICATES):**
{{#if existingApplications}}
The user has already applied to or been suggested these companies/roles:
\`\`\`json
{{{existingApplications}}}
\`\`\`

**CRITICAL: DO NOT suggest any job from the same company with the same or similar role title as listed above.**
{{else}}
No previous applications found.
{{/if}}

**SEARCH INSTRUCTIONS:**

If searchScope is "worldwide":
🌍 **INTERNATIONAL SEARCH MODE - FOCUS ON OVERSEAS OPPORTUNITIES**

**PROVIDE INTERNATIONAL JOBS FROM THESE COUNTRIES (ALL COMPANY SIZES):**

**🇺🇸 United States:**
- **Large Tech**: Google, Microsoft, Meta, Amazon, Netflix, Uber, Stripe, Airbnb
- **Mid-size**: Shopify, Snowflake, Databricks, Figma, Discord, Notion, Canva
- **Startups/Scale-ups**: OpenAI, Anthropic, Vercel, Linear, Retool, Supabase

**🇬🇧 United Kingdom:**  
- **Large**: Monzo, Revolut, DeepMind, ARM, Ocado Technology, Sky, Wise
- **Mid-size**: Starling Bank, Checkout.com, GoCardless, Improbable, FiveAI
- **Startups**: Paddle, Typeform, Cleo, Marshmallow, Zego

**🇨🇦 Canada:**
- **Large**: Shopify, Wealthsimple, Coinsquare, Lightspeed, Hootsuite
- **Mid-size**: Mogo, Nuvei, Elastic Path, Clio, Wave Financial
- **Startups**: Ritual, League, Drop, Paymi, Vendasta

**🇦🇺 Australia:**
- **Large**: Atlassian, Canva, SafetyCulture, Freelancer, REA Group
- **Mid-size**: Campaign Monitor, BigCommerce, Deputy, Culture Amp, Airtasker
- **Startups**: Linktree, Employment Hero, Airwallex, Buildkite, Go1

**🇩🇪 Germany:**
- **Large**: SAP, Rocket Internet, Zalando, SoundCloud, N26
- **Mid-size**: Auto1, Delivery Hero, HelloFresh, GetYourGuide, Flixbus
- **Startups**: Personio, Celonis, Pitch, Contentful, Mambu

**🇳🇱 Netherlands:**
- **Large**: Booking.com, Adyen, TomTom, Philips, ING Tech
- **Mid-size**: Mollie, MessageBird, Takeaway.com, Coolblue, bol.com
- **Startups**: Bunq, Picnic, Swapfiets, WeTransfer, Bux

**🇸🇬 Singapore:**
- **Large**: Grab, Sea Limited, Shopee, Carousell, PropertyGuru
- **Mid-size**: Razer, StashAway, Circles.Life, Ninja Van, RedMart
- **Startups**: Coda Payments, Glints, Pomelo, Pawnhero, HungryGoWhere

**REQUIREMENTS FOR WORLDWIDE SEARCH:**
- AT LEAST 5 OUT OF 7 JOBS MUST BE FROM COUNTRIES OTHER THAN INDIA
- Focus on companies that EXPLICITLY sponsor work visas
- Use international salary standards (USD, GBP, EUR, CAD, AUD)
- Include visa sponsorship information

If searchScope is "current-country" or not specified:
🏠 **LOCAL SEARCH MODE:** Focus on opportunities in India and nearby regions.

**REAL JOB LINK REQUIREMENTS:**
Provide authentic, direct application URLs using these company-specific patterns:

**USA Companies:**
- Google: https://careers.google.com/jobs/results/[8-digit-id]/
- Microsoft: https://careers.microsoft.com/us/en/job/[6-digit-id]/
- Meta: https://www.metacareers.com/jobs/[10-digit-id]/
- Amazon: https://amazon.jobs/en/jobs/[7-digit-id]/
- Netflix: https://jobs.netflix.com/jobs/[9-digit-id]/
- Uber: https://www.uber.com/careers/list/[8-digit-id]/
- Stripe: https://stripe.com/jobs/listing/[role-slug]-[6-digit-id]/
- Shopify: https://www.shopify.com/careers/[role-slug]-[7-digit-id]

**UK Companies:**
- Monzo: https://monzo.com/careers/[role-slug]-[6-digit-id]/
- Revolut: https://www.revolut.com/careers/[role-slug]/[8-digit-id]/
- DeepMind: https://deepmind.com/careers/[role-slug]-[7-digit-id]/

**Canada Companies:**
- Shopify: https://www.shopify.com/careers/[role-slug]-[7-digit-id]
- Wealthsimple: https://www.wealthsimple.com/en-ca/careers/[role-slug]/[6-digit-id]

**Australia Companies:**
- Atlassian: https://www.atlassian.com/company/careers/detail/[8-digit-id]
- Canva: https://www.canva.com/careers/jobs/[role-slug]/[7-digit-id]/

**Germany Companies:**
- SAP: https://jobs.sap.com/job/[city]-[role-slug]-[8-digit-id]
- Zalando: https://jobs.zalando.com/en/jobs/[8-digit-id]/

**Netherlands Companies:**
- Booking.com: https://jobs.booking.com/careers/job/[8-digit-id]
- Adyen: https://www.adyen.com/careers/vacancies/[8-digit-id]

**Singapore Companies:**
- Grab: https://grab.careers/job-details/?id=[7-digit-id]
- Sea Limited: https://career.sea.com/position/[8-digit-id]

**For Indian/Local Companies:**
- Use LinkedIn: https://www.linkedin.com/jobs/view/3[9-digit-number]/
- Use Naukri: https://www.naukri.com/job-listings-[role-slug]-[company-slug]-[8-digit-id]

**ANALYSIS REQUIREMENTS:**

For each job suggestion, provide:

1. **Company Details**:
   - Real company name (prioritize international companies for worldwide search)
   - Specific location with country
   - Work arrangement (Remote/Hybrid/On-site)

2. **Compensation**:
   - Realistic salary in appropriate currency
   - Consider user's experience level and location preferences

3. **Visa Information** (for international jobs):
   - Whether visa sponsorship is available
   - Types of visas (H1B, Tier 2, EU Blue Card, etc.)

4. **Skills Matching**:
   - Match with user's actual skills from resume
   - Consider experience level preferences
   - Highlight relevant qualifications

5. **Application Links & Accuracy**:
   - Use the EXACT company career page URL patterns provided above
   - Generate realistic job IDs (6-8 digits for most companies)
   - For role slugs, use lowercase with hyphens (e.g., "software-engineer", "product-manager")
   - Ensure URLs point to actual company career domains
   - Double-check URL format matches the company's actual career page structure

**CRITICAL SUCCESS REQUIREMENTS:**
- For worldwide search: MAX 2 jobs from India, MIN 5 jobs from other countries
- Every international job MUST mention visa sponsorship
- Use realistic company names and locations  
- Include proper currency and salary standards
- **AVOID DUPLICATES**: Never suggest the same company+role combination twice
- **ENSURE DIVERSITY**: Mix large tech companies, mid-size companies, and promising startups
- **TARGET ALL COMPANY SIZES**: Don't only focus on FAANG/top-tier companies
- Generate realistic 6-8 digit job IDs for company career pages
- Use actual company career page URL structures

Generate 7 unique job opportunities with company size diversity for worldwide search.`,
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
    const userPreferences = input.userPreferences ? JSON.stringify(input.userPreferences, null, 2) : undefined;
    const searchScope = input.userPreferences?.jobLocationPreference || 'current-country';
    const existingApplications = input.existingApplications && input.existingApplications.length > 0 
      ? JSON.stringify(input.existingApplications.map(app => ({ company: app.company, role: app.role })), null, 2) 
      : undefined;
    
    const {output} = await prompt({
        resume: resumeString,
        userPreferences,
        searchScope,
        existingApplications,
    });
    
    if (!output) {
        throw new Error('The AI model failed to generate valid job suggestions. This may be a temporary issue.');
    }
    return output;
  }
);
