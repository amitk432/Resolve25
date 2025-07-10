'use server';
/**
 * @fileOverview A flow to generate a budget-friendly, day-by-day travel itinerary.
 *
 * - generateTravelItinerary - Generates the itinerary.
 * - GenerateTravelItineraryInput - The input type for the function.
 * - GenerateTravelItineraryOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {
    GenerateTravelItineraryInputSchema,
    GenerateTravelItineraryOutputSchema,
    type GenerateTravelItineraryInput,
    type GenerateTravelItineraryOutput,
} from '@/lib/types';


export async function generateTravelItinerary(input: GenerateTravelItineraryInput): Promise<GenerateTravelItineraryOutput> {
  return generateTravelItineraryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTravelItineraryPrompt',
  input: {schema: GenerateTravelItineraryInputSchema},
  output: {schema: GenerateTravelItineraryOutputSchema},
  prompt: `You are an expert budget travel agent. A user wants to travel to {{destination}} for {{duration}} days.

Your task is to create a detailed, day-by-day, budget-friendly travel plan.

**General Guidelines:**
1.  **Budget Focus:** Suggest free or low-cost activities, affordable local food spots, and efficient public transportation options.
2.  **Practicality:** Group activities logically by location for each day to minimize travel time.
3.  **Variety:** Include a mix of popular attractions, local experiences, and some relaxation time.

**Structure:**
- First, provide a section with **General Tips** covering advice on finding budget flights and accommodation suitable for {{destination}}.
- Then, create a detailed plan for each day of the {{duration}}-day trip.
- For each day, provide a title (e.g., "Day 1: Arrival and Exploration"), a theme, and a list of 3-4 specific activities or places to visit. For each activity, provide a brief, helpful description.

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
