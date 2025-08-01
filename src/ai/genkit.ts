import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Get API key from environment variables - support both GEMINI_API_KEY and GOOGLE_API_KEY
const getApiKey = () => {
  const geminiKey = process.env.GEMINI_API_KEY;
  const googleKey = process.env.GOOGLE_API_KEY;
  
  if (geminiKey) {
    return geminiKey;
  }
  
  if (googleKey) {
    return googleKey;
  }
  
  throw new Error(
    'FAILED_PRECONDITION: Please pass in the API key or set the GEMINI_API_KEY or GOOGLE_API_KEY environment variable. ' +
    'For more details see https://genkit.dev/docs/plugins/google-genai'
  );
};

// Available Gemini models mapping
export const GEMINI_MODELS = {
  'gemini-2.5-pro': 'googleai/gemini-2.5-pro',
  'gemini-2.0-flash': 'googleai/gemini-2.0-flash',
  'gemini-1.5-pro': 'googleai/gemini-1.5-pro',
  'gemini-1.5-flash': 'googleai/gemini-1.5-flash',
  'gemini-1.0-pro': 'googleai/gemini-1.0-pro',
} as const;

export const ai = genkit({
  plugins: [googleAI({apiKey: getApiKey()})],
  model: 'googleai/gemini-2.5-pro', // Default model
});

// Helper function to get the correct model identifier
export const getGeminiModel = (modelId: string): string => {
  return GEMINI_MODELS[modelId as keyof typeof GEMINI_MODELS] || 'googleai/gemini-2.5-pro';
};
