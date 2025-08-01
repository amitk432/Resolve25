import { ai, getGeminiModel } from '@/ai/genkit';

export interface TaskAnalysis {
  type: 'browser' | 'app_task' | 'conversation' | 'calculation' | 'unknown';
  confidence: number;
  intent: string;
  parameters?: {
    browserActions?: BrowserActionPlan[];
    appAction?: AppActionPlan;
    response?: string;
    calculation?: string;
  };
  reasoning: string;
}

export interface BrowserActionPlan {
  action: 'navigate' | 'search' | 'click' | 'scroll' | 'back' | 'forward';
  target?: string;
  value?: string;
  description: string;
  contextDependent?: boolean;
}

export interface AppActionPlan {
  module: 'daily_tasks' | 'goals' | 'monthly_plan' | 'travel_goals' | 'finance' | 'job_search' | 'living_advisor';
  action: 'create' | 'update' | 'delete' | 'list' | 'search';
  data: Record<string, any>;
  description: string;
}

export interface SessionContext {
  currentPage?: string;
  lastSearchTerm?: string;
  lastVisitedSite?: string;
  recentActions: string[];
  browserState: 'idle' | 'search_results' | 'website' | 'specific_page';
}

export class AIAnalysisService {
  private model: string;

  constructor(modelId: string = 'gemini-2.5-pro') {
    this.model = getGeminiModel(modelId);
  }

  async analyzeUserInput(
    userInput: string, 
    sessionContext: SessionContext
  ): Promise<TaskAnalysis> {
    const prompt = `
You are an intelligent task analyzer for an AI Task Manager application. Analyze the user's input and determine what type of task they want to perform.

**Available App Modules:**
- daily_tasks: Daily to-do list management
- goals: Goal setting and tracking
- monthly_plan: Monthly planning
- travel_goals: Travel planning
- finance: Financial management
- job_search: Job search assistance
- living_advisor: Living advice and tips

**Context Information:**
- Current browser state: ${sessionContext.browserState}
- Last search term: ${sessionContext.lastSearchTerm || 'none'}
- Current page: ${sessionContext.currentPage || 'none'}
- Recent actions: ${sessionContext.recentActions.join(', ') || 'none'}

**User Input:** "${userInput}"

**Analysis Required:**
1. Determine the task type: browser, app_task, conversation, calculation, or unknown
2. Provide confidence level (0-100)
3. Extract intent and parameters
4. Provide reasoning

**Response Format (JSON):**
{
  "type": "browser|app_task|conversation|calculation|unknown",
  "confidence": 85,
  "intent": "clear description of what user wants",
  "parameters": {
    // For browser tasks:
    "browserActions": [
      {
        "action": "navigate|search|click|scroll|back|forward",
        "target": "url or element",
        "value": "search term or input",
        "description": "what this action does",
        "contextDependent": true/false
      }
    ],
    // For app tasks:
    "appAction": {
      "module": "daily_tasks|goals|monthly_plan|etc",
      "action": "create|update|delete|list|search",
      "data": {
        "title": "task title",
        "description": "task description",
        "priority": "high|medium|low",
        "category": "work|personal|health|etc",
        "dueDate": "date string or null"
      },
      "description": "what will be created/modified"
    },
    // For conversations:
    "response": "AI generated response text",
    // For calculations:
    "calculation": "mathematical expression and result"
  },
  "reasoning": "explanation of why this classification was chosen"
}

**Examples:**

Input: "add task buy groceries tomorrow"
→ Type: app_task, Module: daily_tasks, Action: create

Input: "search for AI news"
→ Type: browser, Action: search

Input: "click first link" (when browserState is 'search_results')
→ Type: browser, Action: click, contextDependent: true

Input: "what's the weather like?"
→ Type: conversation (suggest browser search) or browser (direct search)

Input: "calculate 15 * 24"
→ Type: calculation

Input: "help me plan a trip to Japan"
→ Type: app_task, Module: travel_goals

Be smart about context - if user says "click first link" and they're on search results, it's a browser task. If they're idle, explain what they need to do first.

Respond ONLY with valid JSON.
`;

    try {
      const response = await ai.generate({
        model: this.model,
        prompt,
        config: {
          temperature: 0.3, // Lower temperature for more consistent analysis
          maxOutputTokens: 1000,
        },
      });

      const analysis = JSON.parse(response.text) as TaskAnalysis;
      
      // Validate the response
      if (!analysis.type || !analysis.intent || typeof analysis.confidence !== 'number') {
        throw new Error('Invalid analysis response format');
      }

      return analysis;
    } catch (error) {
      console.error('AI Analysis failed:', error);
      
      // Fallback analysis
      return {
        type: 'unknown',
        confidence: 0,
        intent: 'Unable to analyze user input',
        parameters: {
          response: `I had trouble understanding your request: "${userInput}". Could you please rephrase it? I can help with web tasks, app tasks, questions, and calculations.`
        },
        reasoning: `AI analysis failed: ${error}`
      };
    }
  }

  async generateResponse(
    userInput: string,
    analysis: TaskAnalysis,
    sessionContext: SessionContext
  ): Promise<string> {
    if (analysis.type === 'conversation' && analysis.parameters?.response) {
      return analysis.parameters.response;
    }

    if (analysis.type === 'calculation' && analysis.parameters?.calculation) {
      return `🧮 **Calculation Result:**\n${analysis.parameters.calculation}`;
    }

    if (analysis.type === 'app_task' && analysis.parameters?.appAction) {
      const action = analysis.parameters.appAction;
      return `✅ **Task Created Successfully!**\n\n📋 **Details:**\n${JSON.stringify(action.data, null, 2)}\n\nThis has been added to your ${action.module.replace('_', ' ')} module.`;
    }

    // Default response
    return `I understand you want to: ${analysis.intent}\n\nConfidence: ${analysis.confidence}%\nReasoning: ${analysis.reasoning}`;
  }
}

export default AIAnalysisService;
