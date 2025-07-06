'use server';
/**
 * @fileOverview A flow that generates an image for a travel destination.
 *
 * - generateTravelImage - A function that generates an image based on a destination.
 * - GenerateTravelImageInput - The input type for the generateTravelImage function.
 * - GenerateTravelImageOutput - The return type for the generateTravelImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTravelImageInputSchema = z.object({
  destination: z.string().describe('The travel destination, e.g., "Paris, France".'),
});
export type GenerateTravelImageInput = z.infer<typeof GenerateTravelImageInputSchema>;

const GenerateTravelImageOutputSchema = z.object({
  imageDataUri: z.string().describe("The generated image as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type GenerateTravelImageOutput = z.infer<typeof GenerateTravelImageOutputSchema>;

export async function generateTravelImage(input: GenerateTravelImageInput): Promise<GenerateTravelImageOutput> {
  return generateTravelImageFlow(input);
}

const generateTravelImageFlow = ai.defineFlow(
  {
    name: 'generateTravelImageFlow',
    inputSchema: GenerateTravelImageInputSchema,
    outputSchema: GenerateTravelImageOutputSchema,
  },
  async ({ destination }) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `A beautiful, high-quality, vibrant travel photograph of ${destination}. Cinematic, professional photography.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('Image generation failed to return a valid image.');
    }

    return { imageDataUri: media.url };
  }
);
