/**
 * @fileOverview Utility functions for handling AI-related errors consistently across all flows
 */

/**
 * Handles common AI flow errors and provides user-friendly error messages
 * @param error - The error caught from an AI flow
 * @param context - Context about which operation failed (e.g., "goal suggestions", "task suggestions")
 * @returns A user-friendly error message
 */
export function handleAIError(error: unknown, context: string): Error {
  // Handle API key configuration errors
  if (error instanceof Error && error.message.includes('FAILED_PRECONDITION')) {
    return new Error(
      'Please configure your Gemini API key in the .env.local file. ' +
      'Get your key from https://aistudio.google.com/app/apikey and add it as GEMINI_API_KEY or GOOGLE_API_KEY.'
    );
  }
  
  // Handle quota exceeded errors
  if (error instanceof Error && error.message.includes('QUOTA_EXCEEDED')) {
    return new Error(
      'You have exceeded your Gemini API quota. Please check your usage at https://aistudio.google.com/ and try again later.'
    );
  }
  
  // Handle rate limiting errors
  if (error instanceof Error && error.message.includes('RATE_LIMIT_EXCEEDED')) {
    return new Error(
      'Too many requests to the Gemini API. Please wait a moment and try again.'
    );
  }
  
  // Handle network/connection errors
  if (error instanceof Error && (
    error.message.includes('NETWORK_ERROR') || 
    error.message.includes('Connection') ||
    error.message.includes('timeout')
  )) {
    return new Error(
      'Network error occurred while contacting the Gemini API. Please check your internet connection and try again.'
    );
  }
  
  // Handle model errors
  if (error instanceof Error && error.message.includes('model')) {
    return new Error(
      `The AI model encountered an issue while generating ${context}. Please try again with different input.`
    );
  }
  
  // Handle generic errors
  if (error instanceof Error) {
    return new Error(`Failed to generate ${context}: ${error.message}`);
  }
  
  // Fallback for unknown errors
  return new Error(`Failed to generate ${context}. Please try again.`);
}

/**
 * Wrapper function for AI flow operations with consistent error handling
 * @param operation - The AI flow operation to execute
 * @param context - Context about the operation for error messages
 * @returns Promise that resolves to the operation result or throws a user-friendly error
 */
export async function executeAIFlow<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw handleAIError(error, context);
  }
}
