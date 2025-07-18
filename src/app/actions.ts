
'use server';

import { generateGoalTips, type GenerateGoalTipsInput } from '@/ai/flows/generate-goal-tips';
import { generateModuleSuggestions, type ModuleSuggestionInput } from '@/ai/flows/generate-module-suggestions';
import { generateGoalSuggestions, type GenerateGoalSuggestionsInput } from '@/ai/flows/generate-goal-suggestions';
import { generateTaskSuggestions, type GenerateTaskSuggestionsInput } from '@/ai/flows/generate-task-suggestions';
import { generateMonthlyPlanSuggestions, type GenerateMonthlyPlanSuggestionsInput } from '@/ai/flows/generate-monthly-plan-suggestions';
import { parseResume, type ParseResumeInput, type ResumeData } from '@/ai/flows/parse-resume';
import { generateJobSuggestions, type GenerateJobSuggestionsInput } from '@/ai/flows/generate-job-suggestions';
import { generateApplicationEmail, type GenerateApplicationEmailInput } from '@/ai/flows/generate-application-email';
import { generateRelocationAdvice, generateRelocationRoadmap, type RelocationRoadmapInput } from '@/ai/flows/generate-relocation-advice';
import { generateTravelItinerary } from '@/ai/flows/generate-travel-itinerary';
import type { GenerateTravelItineraryInput, GenerateTravelItineraryOutput, RelocationAdviceInput, GenerateTravelSuggestionOutput } from '@/lib/types';
import { generateTravelSuggestion, type GenerateTravelSuggestionInput } from '@/ai/flows/generate-travel-suggestion';


export async function getModuleSuggestions(input: ModuleSuggestionInput) {
    try {
        const result = await generateModuleSuggestions(input);
        return result;
    } catch (error) {
        console.error('Error getting module suggestions:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate AI suggestions. Please try again.';
        return { error: errorMessage };
    }
}

export async function getAITips(input: GenerateGoalTipsInput) {
  try {
    const result = await generateGoalTips(input);
    return result;
  } catch (error) {
    console.error('Error getting AI tips:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate AI tips. Please try again.';
    return { error: errorMessage };
  }
}

export async function getAIGoalSuggestions(input: GenerateGoalSuggestionsInput) {
  try {
    const result = await generateGoalSuggestions(input);
    return result;
  } catch (error) {
    console.error('Error getting AI goal suggestions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate AI suggestions. Please try again.';
    return { error: errorMessage };
  }
}

export async function getAITaskSuggestions(input: GenerateTaskSuggestionsInput) {
  try {
    const result = await generateTaskSuggestions(input);
    return result;
  } catch (error) {
    console.error('Error getting AI task suggestions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate AI suggestions. Please try again.';
    return { error: errorMessage };
  }
}

export async function getAIMonthlyPlanSuggestions(input: GenerateMonthlyPlanSuggestionsInput) {
  try {
    const result = await generateMonthlyPlanSuggestions(input);
    return result;
  } catch (error) {
    console.error('Error getting AI monthly plan suggestions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate AI suggestions. Please try again.';
    return { error: errorMessage };
  }
}

export async function getParsedResume(input: ParseResumeInput): Promise<ResumeData | { error: string }> {
  try {
    const result = await parseResume(input);
    return result;
  } catch (error) {
    console.error('Error parsing resume:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to parse resume. Please try again.';
    return { error: errorMessage };
  }
}

export async function getAIJobSuggestions(input: GenerateJobSuggestionsInput) {
  try {
    const result = await generateJobSuggestions(input);
    return result;
  } catch (error) {
    console.error('Error getting AI job suggestions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate AI suggestions. Please try again.';
    return { error: errorMessage };
  }
}

export async function getAIEmailTemplate(input: GenerateApplicationEmailInput) {
  try {
    const result = await generateApplicationEmail(input);
    return result;
  } catch (error) {
    console.error('Error getting AI email template:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate email template. Please try again.';
    return { error: errorMessage };
  }
}

export async function getRelocationAdvice(input: RelocationAdviceInput) {
    try {
        const result = await generateRelocationAdvice(input);
        return result;
    } catch (error) {
        console.error('Error getting relocation advice:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate AI advice. Please try again.';
        return { error: errorMessage };
    }
}

export async function getRelocationRoadmap(input: RelocationRoadmapInput) {
    try {
        const result = await generateRelocationRoadmap(input);
        return result;
    } catch (error) {
        console.error('Error getting relocation roadmap:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate AI roadmap. Please try again.';
        return { error: errorMessage };
    }
}

export async function getTravelItinerary(input: GenerateTravelItineraryInput): Promise<GenerateTravelItineraryOutput | { error: string }> {
  try {
    const result = await generateTravelItinerary(input);
    return result;
  } catch (error) {
    console.error('Error getting AI travel itinerary:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate itinerary. Please try again.';
    return { error: errorMessage };
  }
}

export async function getAITravelSuggestion(input?: GenerateTravelSuggestionInput): Promise<GenerateTravelSuggestionOutput | { error: string }> {
  try {
    const result = await generateTravelSuggestion(input);
    return result;
  } catch (error) {
    console.error('Error getting AI travel suggestion:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate suggestion. Please try again.';
    return { error: errorMessage };
  }
}
