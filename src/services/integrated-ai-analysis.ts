/**
 * Enhanced AI Analysis Service for Integrated Browser Automation
 * 
 * This service provides AI-powered task analysis optimized for browser-based
 * automation without requiring a separate backend server.
 */

import { BrowserAutomationAction } from './browser-automation';

export interface IntegratedTaskAnalysis {
  type: 'browser' | 'information' | 'automation' | 'conversation';
  confidence: number;
  intent: string;
  actions: BrowserAutomationAction[];
  reasoning: string;
  estimatedDuration: number;
  complexity: 'simple' | 'medium' | 'complex';
  requiresUserInput: boolean;
  warnings?: string[];
}

export interface TaskContext {
  currentUrl?: string;
  browserHistory: string[];
  recentSearches: string[];
  userPreferences: {
    searchEngine: 'google' | 'bing' | 'duckduckgo';
    language: string;
    region: string;
  };
}

export class IntegratedAIAnalysisService {
  private apiKey: string;
  private model: string;
  private context: TaskContext;

  constructor(apiKey?: string, model: string = 'gemini-1.5-flash') {
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyB1z6g4Ochu1Xw5L33Lrgj-vrOJm56Ikck';
    this.model = model;
    this.context = {
      browserHistory: [],
      recentSearches: [],
      userPreferences: {
        searchEngine: 'google',
        language: 'en',
        region: 'US'
      }
    };
  }

  async analyzeTask(userInput: string): Promise<IntegratedTaskAnalysis> {
    try {
      const analysis = await this.callGeminiAPI(this.buildPrompt(userInput));
      return this.parseAnalysis(analysis, userInput);
    } catch (error) {
      console.error('AI analysis failed:', error);
      return this.getFallbackAnalysis(userInput);
    }
  }

  private buildPrompt(userInput: string): string {
    const contextInfo = this.buildContextInfo();
    
    return `You are an AI assistant that analyzes user requests for browser automation tasks. 

Context:
${contextInfo}

User Request: "${userInput}"

Analyze this request and respond with ONLY a JSON object containing:
{
  "type": "browser|information|automation|conversation",
  "confidence": 0-100,
  "intent": "clear description of what user wants",
  "actions": [
    {
      "type": "navigate|search|click|type|scroll|wait|extract",
      "target": "url or element selector",
      "value": "text to type or search",
      "description": "what this action does",
      "timeout": 5000
    }
  ],
  "reasoning": "why this classification and these actions",
  "estimatedDuration": "milliseconds",
  "complexity": "simple|medium|complex",
  "requiresUserInput": false,
  "warnings": ["any limitations or issues"]
}

Action Types:
- navigate: Go to a URL
- search: Search on current search engine
- click: Click an element (limited by CORS)
- type: Type text into input field (limited by CORS)
- scroll: Scroll page up/down
- wait: Pause execution
- extract: Get page content/data

Guidelines:
- For web searches, use "search" action with the query
- For visiting specific sites, use "navigate" action
- Add "wait" actions between navigation steps (2-3 seconds)
- Include "extract" actions to get information from pages
- Be realistic about cross-origin limitations
- Provide warnings for actions that might fail due to CORS

Examples:
- "search for latest AI news" → search action with query
- "go to youtube" → navigate to https://www.youtube.com
- "check twitter trends" → navigate to https://x.com then extract
- "find flights to tokyo" → navigate to Google Flights with search

Return ONLY the JSON object, no other text.`;
  }

  private buildContextInfo(): string {
    const { currentUrl, browserHistory, recentSearches, userPreferences } = this.context;
    
    return `
Current Page: ${currentUrl || 'None'}
Recent Pages: ${browserHistory.slice(-5).join(', ') || 'None'}
Recent Searches: ${recentSearches.slice(-3).join(', ') || 'None'}
Search Engine: ${userPreferences.searchEngine}
Language: ${userPreferences.language}
Region: ${userPreferences.region}
`.trim();
  }

  private async callGeminiAPI(prompt: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          topK: 1,
          topP: 0.8,
          maxOutputTokens: 2000,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }
    
    throw new Error('Invalid API response format');
  }

  private parseAnalysis(response: string, originalInput: string): IntegratedTaskAnalysis {
    try {
      // Extract JSON from response
      let jsonStr = this.extractJSON(response);
      const parsed = JSON.parse(jsonStr);
      
      // Validate and normalize the response
      return {
        type: parsed.type || 'conversation',
        confidence: Math.min(100, Math.max(0, parsed.confidence || 70)),
        intent: parsed.intent || 'Process user request',
        actions: this.validateActions(parsed.actions || []),
        reasoning: parsed.reasoning || 'AI analysis of user request',
        estimatedDuration: parsed.estimatedDuration || this.estimateDuration(parsed.actions || []),
        complexity: parsed.complexity || 'medium',
        requiresUserInput: parsed.requiresUserInput || false,
        warnings: parsed.warnings || []
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return this.getFallbackAnalysis(originalInput);
    }
  }

  private extractJSON(response: string): string {
    // Remove markdown code blocks
    let cleaned = response.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
    
    // Find JSON object
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    
    if (start !== -1 && end !== -1 && end > start) {
      return cleaned.substring(start, end + 1);
    }
    
    throw new Error('No valid JSON found in response');
  }

  private validateActions(actions: any[]): BrowserAutomationAction[] {
    return actions.filter(action => action && typeof action === 'object').map(action => ({
      type: action.type || 'wait',
      target: action.target || '',
      value: action.value || '',
      description: action.description || 'Automated action',
      timeout: action.timeout || 5000
    }));
  }

  private estimateDuration(actions: BrowserAutomationAction[]): number {
    let total = 0;
    
    for (const action of actions) {
      switch (action.type) {
        case 'navigate':
          total += 3000; // Page load time
          break;
        case 'search':
          total += 2000; // Search execution
          break;
        case 'click':
        case 'type':
          total += 500; // Interaction time
          break;
        case 'scroll':
          total += 300; // Scroll time
          break;
        case 'wait':
          total += parseInt(action.value || '1000');
          break;
        case 'extract':
          total += 1000; // Data extraction time
          break;
        default:
          total += 1000;
      }
    }
    
    return total + (actions.length * 200); // Base time per action
  }

  private getFallbackAnalysis(userInput: string): IntegratedTaskAnalysis {
    const input = userInput.toLowerCase();
    
    // Simple keyword-based fallback
    if (input.includes('search') || input.includes('find') || input.includes('look')) {
      const searchQuery = userInput.replace(/^(search|find|look)\s+(for\s+)?/i, '');
      return {
        type: 'browser',
        confidence: 60,
        intent: `Search for: ${searchQuery}`,
        actions: [
          {
            type: 'search',
            value: searchQuery,
            description: `Search for ${searchQuery}`,
            timeout: 5000
          }
        ],
        reasoning: 'Keyword-based analysis detected search intent',
        estimatedDuration: 5000,
        complexity: 'simple',
        requiresUserInput: false,
        warnings: ['Using fallback analysis due to AI service error']
      };
    }
    
    if (input.includes('go to') || input.includes('visit') || input.includes('open')) {
      const url = this.extractURL(userInput) || this.guessWebsite(userInput);
      return {
        type: 'browser',
        confidence: 60,
        intent: `Navigate to ${url}`,
        actions: [
          {
            type: 'navigate',
            target: url,
            description: `Navigate to ${url}`,
            timeout: 5000
          },
          {
            type: 'wait',
            value: '2000',
            description: 'Wait for page to load',
            timeout: 2000
          }
        ],
        reasoning: 'Keyword-based analysis detected navigation intent',
        estimatedDuration: 7000,
        complexity: 'simple',
        requiresUserInput: false,
        warnings: ['Using fallback analysis due to AI service error']
      };
    }
    
    // Default fallback
    return {
      type: 'conversation',
      confidence: 30,
      intent: 'Unable to analyze request',
      actions: [],
      reasoning: 'Could not determine user intent',
      estimatedDuration: 0,
      complexity: 'simple',
      requiresUserInput: true,
      warnings: ['AI analysis failed, please rephrase your request']
    };
  }

  private extractURL(text: string): string | null {
    const urlRegex = /(https?:\/\/[^\s]+)/i;
    const match = text.match(urlRegex);
    return match ? match[1] : null;
  }

  private guessWebsite(text: string): string {
    const input = text.toLowerCase();
    
    const sites: Record<string, string> = {
      'youtube': 'https://www.youtube.com',
      'google': 'https://www.google.com',
      'twitter': 'https://x.com',
      'facebook': 'https://www.facebook.com',
      'instagram': 'https://www.instagram.com',
      'linkedin': 'https://www.linkedin.com',
      'github': 'https://www.github.com',
      'reddit': 'https://www.reddit.com',
      'amazon': 'https://www.amazon.com',
      'netflix': 'https://www.netflix.com'
    };
    
    for (const [keyword, url] of Object.entries(sites)) {
      if (input.includes(keyword)) {
        return url;
      }
    }
    
    // Try to extract domain-like patterns
    const domainMatch = input.match(/([a-z0-9-]+\.(com|org|net|edu|gov))/i);
    if (domainMatch) {
      return `https://www.${domainMatch[1]}`;
    }
    
    return 'https://www.google.com';
  }

  updateContext(update: Partial<TaskContext>) {
    this.context = { ...this.context, ...update };
  }

  addToHistory(url: string) {
    this.context.browserHistory.push(url);
    if (this.context.browserHistory.length > 20) {
      this.context.browserHistory = this.context.browserHistory.slice(-20);
    }
  }

  addToSearchHistory(query: string) {
    this.context.recentSearches.push(query);
    if (this.context.recentSearches.length > 10) {
      this.context.recentSearches = this.context.recentSearches.slice(-10);
    }
  }
}

export default IntegratedAIAnalysisService;
