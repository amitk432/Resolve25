'use server';

import { generateGoalTips, GenerateGoalTipsInput } from '@/ai/flows/generate-goal-tips';

export async function getAITips(input: GenerateGoalTipsInput): Promise<{ tips: string[] } | { error: string }> {
  try {
    const output = await generateGoalTips(input);
    return output;
  } catch (e: any) {
    console.error(e);
    return { error: e.message || 'Failed to generate tips.' };
  }
}
