'use server';
/**
 * @fileOverview A flow to generate a budget-friendly, day-by-day travel itinerary.
 *
 * - generateTravelItinerary - Generates the itinerary.
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
  prompt: `You are an expert budget travel agent. A user wants to travel to {{destination}} for {{duration}} days, starting around {{travelDate}}.

Your task is to create a detailed, day-by-day, budget-friendly travel plan.

**Key Instructions:**
1.  **Budget Focus:** Prioritize free or low-cost activities, affordable local food spots, and efficient public transportation.
2.  **Practicality:** Group activities logically by location for each day to minimize travel time.
3.  **Variety:** Include a mix of popular attractions, local experiences, and some relaxation time.
4.  **Contextual Suggestions:** Consider the travel date ({{travelDate}}) for seasonal events or weather-appropriate activities.
5.  **Details per Activity:** For each activity, you MUST provide:
    - A brief, helpful description.
    - An estimated budget range (e.g., "Free", "₹200 - ₹500", "₹1000+").
    - A user rating (e.g., "4.5/5", "4.8/5").

**Structure:**
- First, provide a section with **General Tips** covering advice on finding budget flights and accommodation suitable for {{destination}}.
- Then, create a detailed plan for each day of the {{duration}}-day trip.
- For each day, provide a title (e.g., "Day 1: Arrival and Exploration"), a theme, and a list of 3-4 specific activities or places to visit with all the required details (description, budget, rating).

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
