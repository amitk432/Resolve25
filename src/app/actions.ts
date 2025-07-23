
'use server';

import { generateGoalTips, type GenerateGoalTipsInput } from '@/ai/flows/generate-goal-tips';
import { generateGoalStepSuggestions, type GenerateGoalStepSuggestionsInput } from '@/ai/flows/generate-goal-step-suggestions';
import { generateModuleSuggestions, type ModuleSuggestionInput } from '@/ai/flows/generate-module-suggestions';
import { generateGoalSuggestions, type GenerateGoalSuggestionsInput } from '@/ai/flows/generate-goal-suggestions';
import { generateTaskSuggestions, type GenerateTaskSuggestionsInput } from '@/ai/flows/generate-task-suggestions';
import { generateMonthlyPlanSuggestions, type GenerateMonthlyPlanSuggestionsInput } from '@/ai/flows/generate-monthly-plan-suggestions';
import { parseResume, type ParseResumeInput, type ResumeData } from '@/ai/flows/parse-resume';
import { generateJobSuggestions, type GenerateJobSuggestionsInput } from '@/ai/flows/generate-job-suggestions';
import { generateApplicationEmail, type GenerateApplicationEmailInput } from '@/ai/flows/generate-application-email';
import { generateRelocationAdvice, generateRelocationRoadmap } from '@/ai/flows/generate-relocation-advice';
import { generateTravelItinerary } from '@/ai/flows/generate-travel-itinerary';
import type { GenerateTravelItineraryInput, GenerateTravelItineraryOutput, RelocationAdviceInput, RelocationRoadmapInput, GenerateTravelSuggestionOutput, GenerateTravelSuggestionInput, AppData, CriticalStepsData } from '@/lib/types';
import { generateTravelSuggestion } from '@/ai/flows/generate-travel-suggestion';
import { generateCriticalSteps } from '@/ai/flows/generate-critical-steps';


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

export async function getAIGoalStepSuggestions(input: GenerateGoalStepSuggestionsInput) {
  try {
    const result = await generateGoalStepSuggestions(input);
    return result;
  } catch (error) {
    console.error('Error getting AI goal step suggestions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate AI step suggestions. Please try again.';
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

export async function getOrGenerateCriticalSteps(data: AppData): Promise<CriticalStepsData | { error: string }> {
  try {
    // Create hash of critical data
    const criticalDataHash = JSON.stringify({
      goals: data.goals,
      monthlyPlan: data.monthlyPlan,
      jobApplications: data.jobApplications,
      loans: data.loans,
      emergencyFund: data.emergencyFund,
      sips: data.sips,
      incomeSources: data.incomeSources,
    });

    // Check if we have cached critical steps with the same data hash
    if (data.criticalSteps && data.criticalSteps.dataHash === criticalDataHash) {
      // Return cached steps if data hasn't changed
      return data.criticalSteps;
    }

    // Generate new critical steps
    const result = await generateCriticalSteps({ context: data });
    
    return {
      steps: result.steps,
      generatedAt: new Date().toISOString(),
      dataHash: criticalDataHash,
    };
  } catch (error) {
    console.error('Error getting/generating critical steps:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate critical steps. Please try again.';
    return { error: errorMessage };
  }
}
