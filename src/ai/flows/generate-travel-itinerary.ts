
'use server';
/**
 * @fileOverview A flow to generate a budget-friendly travel itinerary.
 *
 * - generateTravelItinerary - Generates the itinerary.
 * - GenerateTravelItineraryInput - The input type for the function.
 * - GenerateTravelItineraryOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GenerateTravelItineraryInputSchema = z.object({
  destination: z.string().describe('The travel destination, e.g., "Goa, India".'),
});
export type GenerateTravelItineraryInput = z.infer<typeof GenerateTravelItineraryInputSchema>;

export const GenerateTravelItineraryOutputSchema = z.object({
  flights: z.object({
    title: z.string().default('✈️ Budget Flights'),
    tips: z.array(z.string()).describe('Tips for finding the cheapest flights.'),
  }),
  accommodation: z.object({
    title: z.string().default('🏨 Affordable Accommodation'),
    tips: z.array(z.string()).describe('Recommendations for budget-friendly places to stay.'),
  }),
  attractions: z.object({
    title: z.string().default('🏞️ Top Attractions & Activities'),
    places: z.array(z.string()).describe('A list of must-visit places and major attractions.'),
  }),
  budgetTips: z.object({
    title: z.string().default('💰 Money-Saving Tips'),
    tips: z.array(z.string()).describe('General budget-friendly travel tips for the destination.'),
  }),
});
export type GenerateTravelItineraryOutput = z.infer<typeof GenerateTravelItineraryOutputSchema>;


export async function generateTravelItinerary(input: GenerateTravelItineraryInput): Promise<GenerateTravelItineraryOutput> {
  return generateTravelItineraryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTravelItineraryPrompt',
  input: {schema: GenerateTravelItineraryInputSchema},
  output: {schema: GenerateTravelItineraryOutputSchema},
  prompt: `You are an expert budget travel agent. A user wants to travel to {{destination}}.

Your task is to create a structured, budget-friendly travel plan.

Provide the following:
1.  **Budget Flights:** Give 2-3 actionable tips on how to find the cheapest flights to {{destination}}. For example, mention the best time to book, budget airlines that fly there, or useful search websites.
2.  **Affordable Accommodation:** Suggest 2-3 types of budget-friendly accommodation (e.g., hostels, guesthouses, budget hotel chains) and areas to stay in {{destination}}.
3.  **Top Attractions & Activities:** List 4-5 must-visit places and major attractions in {{destination}} that are either free or low-cost.
4.  **Money-Saving Tips:** Provide 2-3 general tips for saving money while traveling in {{destination}} (e.g., local transportation, food, etc.).

Present the information in the specified JSON format.
  `,
});

const generateTravelItineraryFlow = ai.defineFlow(
  {
    name: 'generateTravelItineraryFlow',
    inputSchema: GenerateTravelItineraryInputSchema,
    outputSchema: GenerateTravelItineraryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('The AI model failed to generate a travel itinerary. This may be a temporary issue.');
    }
    return output;
  }
);
