// Browser-compatible AI analysis service using direct API calls
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
  browserState: 'idle' | 'search_results' | 'website' | 'specific_page' | 'content_loaded';
  // New context awareness fields
  userPreferences?: UserPreferences;
  recentSites?: RecentSiteVisit[];
  searchHistory?: SearchHistoryItem[];
  behaviorPatterns?: BehaviorPattern[];
  // Browser state integration fields
  selectedText?: string;
  availableActions?: {
    type: string;
    target: string;
    description: string;
  }[];
  pageContext?: {
    keywords: string[];
    category: string;
    hasSearchBox: boolean;
    hasNavigation: boolean;
  };
}

export interface UserPreferences {
  preferredSearchEngine: 'google' | 'bing' | 'duckduckgo';
  favoriteWebsites: string[];
  defaultBrowserAction: 'navigate' | 'search';
  language: string;
  timezone: string;
  frequentlyUsedSites: Record<string, number>; // site -> frequency count
  feedbackLearning?: FeedbackLearningEntry[];
  correctionPatterns?: Record<string, CorrectionPattern>;
  contextPreferences?: Record<string, Record<string, ContextPreference>>;
}

export interface FeedbackLearningEntry {
  userInput: string;
  originalAnalysis: {
    type: string;
    intent: string;
    confidence: number;
  };
  feedback: {
    wasCorrect: boolean;
    correctType?: string;
    correctIntent?: string;
    correctTarget?: string;
  };
  timestamp: number;
  context: {
    browserState: string;
    recentActions: string[];
  };
}

export interface CorrectionPattern {
  frequency: number;
  corrections: {
    type?: string;
    intent?: string;
    target?: string;
    timestamp: number;
  }[];
}

export interface ContextPreference {
  preferredType?: string;
  preferredIntent?: string;
  confidence: number;
}

export interface RecentSiteVisit {
  site: string;
  url: string;
  timestamp: number;
  frequency: number;
  category: 'social' | 'work' | 'entertainment' | 'shopping' | 'news' | 'other';
}

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  resultClicked?: string;
  successful: boolean;
}

export interface BehaviorPattern {
  pattern: string;
  frequency: number;
  lastUsed: number;
  context: string[];
}

export class AIAnalysisService {
  private model: string;
  private apiKey: string;
  private contextMemory: Map<string, SessionContext> = new Map();
  private globalPreferences: UserPreferences;
  private automationServerUrl: string;

  constructor(modelId: string = 'gemini-2.5-pro') {
    this.model = this.getGeminiModel(modelId);
    this.apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || 'AIzaSyB1z6g4Ochu1Xw5L33Lrgj-vrOJm56Ikck';
    
    // Initialize default preferences
    this.globalPreferences = {
      preferredSearchEngine: 'google',
      favoriteWebsites: ['youtube.com', 'google.com', 'github.com'],
      defaultBrowserAction: 'navigate',
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      frequentlyUsedSites: {}
    };
    
    // Set automation server URL based on environment
    this.automationServerUrl = process.env.AUTOMATION_SERVER_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://your-automation-server.railway.app' // Replace with your actual URL
        : 'http://localhost:3003'
      );
      
    console.log(`🔗 AI Analysis Service initialized with automation server: ${this.automationServerUrl}`);
  }

  private getGeminiModel(modelId: string): string {
    const models: Record<string, string> = {
      'gemini-2.5-pro': 'gemini-2.5-pro',
      'gemini-2.0-flash': 'gemini-2.0-flash',
      'gemini-1.5-pro': 'gemini-1.5-pro',
      'gemini-1.5-flash': 'gemini-1.5-flash',
      'gemini-1.0-pro': 'gemini-1.0-pro',
    };
    return models[modelId] || 'gemini-2.5-pro';
  }

  private extractJsonFromResponse(response: string): string {
    if (!response || response.trim().length === 0) {
      return '';
    }
    
    let cleaned = response.trim();
    
    // Method 1: Try to find JSON between code blocks with various patterns
    const codeBlockPatterns = [
      /```json\s*(\{[\s\S]*?\})\s*```/i,
      /```\s*(\{[\s\S]*?\})\s*```/i,
      /`{3,}\s*json\s*(\{[\s\S]*?\})\s*`{3,}/i,
      /`{3,}\s*(\{[\s\S]*?\})\s*`{3,}/i
    ];
    
    for (const pattern of codeBlockPatterns) {
      const match = cleaned.match(pattern);
      if (match && match[1]) {
        let jsonStr = match[1].trim();
        jsonStr = this.cleanJsonString(jsonStr);
        if (jsonStr && jsonStr.startsWith('{')) {
          return jsonStr;
        }
      }
    }
    
    // Method 2: Find JSON object by looking for { to } pattern with proper bracket counting
    const jsonMatch = this.extractCompleteJsonObject(cleaned);
    if (jsonMatch) {
      let jsonStr = jsonMatch.trim();
      jsonStr = this.cleanJsonString(jsonStr);
      return jsonStr;
    }
    
    // Method 3: Clean common markdown patterns
    cleaned = cleaned
      .replace(/^```json\s*/gmi, '')
      .replace(/^```\s*/gm, '')
      .replace(/\s*```$/gm, '')
      .replace(/^`+/gm, '')
      .replace(/`+$/gm, '')
      .trim();
    
    // Method 4: If it starts and ends with { }, assume it's JSON
    if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
      cleaned = this.cleanJsonString(cleaned);
      return cleaned;
    }
    
    // Method 5: Look for JSON-like content in the response line by line
    const lines = cleaned.split('\n');
    let jsonStart = -1;
    let jsonEnd = -1;
    let braceCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('{') && jsonStart === -1) {
        jsonStart = i;
        braceCount = 1;
      } else if (jsonStart !== -1) {
        // Count braces to find the end
        for (const char of line) {
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;
        }
        if (braceCount === 0) {
          jsonEnd = i;
          break;
        }
      }
    }
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      let jsonStr = lines.slice(jsonStart, jsonEnd + 1).join('\n').trim();
      jsonStr = this.cleanJsonString(jsonStr);
      return jsonStr;
    }
    
    // Method 6: Last resort - try to extract any JSON-like structure
    const fallbackMatch = cleaned.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
    if (fallbackMatch) {
      return this.cleanJsonString(fallbackMatch[0]);
    }
    
    // If all else fails, return the cleaned response and hope for the best
    return this.cleanJsonString(cleaned);
  }

  /**
   * Extracts a complete JSON object by counting braces properly
   */
  private extractCompleteJsonObject(text: string): string | null {
    let braceCount = 0;
    let startIndex = -1;
    let inString = false;
    let escaped = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (escaped) {
        escaped = false;
        continue;
      }
      
      if (char === '\\') {
        escaped = true;
        continue;
      }
      
      if (char === '"') {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') {
          if (startIndex === -1) {
            startIndex = i;
          }
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0 && startIndex !== -1) {
            return text.substring(startIndex, i + 1);
          }
        }
      }
    }
    
    return null;
  }

  private cleanJsonString(jsonStr: string): string {
    // Remove trailing commas before closing braces/brackets
    jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
    
    // Fix null values that might be causing issues
    jsonStr = jsonStr.replace(/:\s*null/g, ': null');
    
    // Remove any non-printable characters
    jsonStr = jsonStr.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    
    // Ensure proper spacing around colons and commas
    jsonStr = jsonStr.replace(/:\s*/g, ': ');
    jsonStr = jsonStr.replace(/,\s*/g, ', ');
    
    return jsonStr.trim();
  }

  private fixCommonJsonIssues(jsonStr: string): string {
    let fixed = jsonStr;
    
    // Fix unterminated strings by finding unclosed quotes
    fixed = this.fixUnterminatedStrings(fixed);
    
    // Fix trailing commas before closing braces/brackets
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
    
    // Fix unquoted property names
    fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
    
    // Fix single quotes to double quotes (but be careful with contractions)
    fixed = fixed.replace(/'/g, '"');
    
    // Fix undefined values to null
    fixed = fixed.replace(/:\s*undefined/g, ': null');
    
    // Fix NaN values to null
    fixed = fixed.replace(/:\s*NaN/g, ': null');
    
    // Remove any trailing commas in objects/arrays
    fixed = fixed.replace(/,(\s*})/g, '$1');
    fixed = fixed.replace(/,(\s*\])/g, '$1');
    
    // Remove comments (// and /* */)
    fixed = fixed.replace(/\/\/.*$/gm, '');
    fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Fix URLs with spaces (common AI response issue) - more comprehensive
    fixed = fixed.replace(/"(https?:)\s+\/\//g, '"$1//');
    fixed = fixed.replace(/"(https?:\/\/)\s+/g, '"$1');
    fixed = fixed.replace(/"(https?:\s*\/\/[^"]*?)"/g, (match, url) => {
      return '"' + url.replace(/\s+/g, '') + '"';
    });
    // Fix specific spacing patterns in URLs
    fixed = fixed.replace(/"https\s*:\s*\/\/"/g, '"https://"');
    fixed = fixed.replace(/"http\s*:\s*\/\/"/g, '"http://"');
    // Fix %20 encoding issues in URLs within JSON
    fixed = fixed.replace(/"(https?:\/\/)%20\/\/([^"]+)"/g, '"$1$2"');
    
    // Fix escaped quotes that shouldn't be escaped
    fixed = fixed.replace(/\\"/g, '"');
    
    // Clean up extra whitespace
    fixed = fixed.replace(/\s+/g, ' ').trim();
    
    // Try to auto-close truncated JSON if needed
    fixed = this.autoCloseJson(fixed);
    
    return fixed;
  }

  /**
   * Attempts to fix unterminated strings in JSON by finding and closing them
   */
  private fixUnterminatedStrings(jsonStr: string): string {
    let fixed = jsonStr;
    let inString = false;
    let escaped = false;
    let result = '';
    
    for (let i = 0; i < fixed.length; i++) {
      const char = fixed[i];
      const nextChar = fixed[i + 1];
      
      if (escaped) {
        escaped = false;
        result += char;
        continue;
      }
      
      if (char === '\\') {
        escaped = true;
        result += char;
        continue;
      }
      
      if (char === '"') {
        inString = !inString;
        result += char;
        continue;
      }
      
      result += char;
    }
    
    // If we're still in a string at the end, close it
    if (inString) {
      result += '"';
    }
    
    return result;
  }

  /**
   * Validates basic JSON structure before attempting to parse
   */
  private isValidJsonStructure(jsonStr: string): boolean {
    const trimmed = jsonStr.trim();
    
    // Must start and end with braces
    if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
      return false;
    }
    
    // Check for balanced braces and brackets
    let braceCount = 0;
    let bracketCount = 0;
    let inString = false;
    let escaped = false;
    
    for (let i = 0; i < trimmed.length; i++) {
      const char = trimmed[i];
      
      if (escaped) {
        escaped = false;
        continue;
      }
      
      if (char === '\\') {
        escaped = true;
        continue;
      }
      
      if (char === '"') {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        if (char === '[') bracketCount++;
        if (char === ']') bracketCount--;
      }
    }
    
    // Check if we're still in a string (unterminated string)
    if (inString) {
      return false;
    }
    
    // Check if braces and brackets are balanced
    return braceCount === 0 && bracketCount === 0;
  }

  /**
   * Attempts to auto-close a truncated JSON string by counting braces/brackets and appending missing ones.
   * Only adds closing braces/brackets if the string starts with { or [ and is missing closing ones.
   */
  private autoCloseJson(jsonStr: string): string {
    let s = jsonStr.trim();
    if (!s) return s;
    // Only try to fix if it starts with { or [
    if (!(s.startsWith('{') || s.startsWith('['))) return s;
    let openCurly = 0, closeCurly = 0, openSquare = 0, closeSquare = 0;
    for (let c of s) {
      if (c === '{') openCurly++;
      if (c === '}') closeCurly++;
      if (c === '[') openSquare++;
      if (c === ']') closeSquare++;
    }
    let toAdd = '';
    if (openCurly > closeCurly) toAdd += '}'.repeat(openCurly - closeCurly);
    if (openSquare > closeSquare) toAdd += ']'.repeat(openSquare - closeSquare);
    return s + toAdd;
  }

  /**
   * Cleans and normalizes URLs to fix common issues like extra spaces, incorrect formatting, etc.
   */
  private cleanUrl(url: string): string {
    if (!url) return url;
    
    // Remove extra spaces and normalize
    let cleaned = url.trim();
    
    // Fix common URL spacing issues - be more aggressive
    cleaned = cleaned.replace(/https?\s*:\s*\/\//g, match => {
      return match.includes('https') ? 'https://' : 'http://';
    });
    cleaned = cleaned.replace(/https?:\/\/\s+/g, match => {
      return match.includes('https') ? 'https://' : 'http://';
    });
    
    // Remove any remaining spaces in URLs (aggressive cleanup)
    if (cleaned.includes('://')) {
      const parts = cleaned.split('://');
      if (parts.length === 2) {
        const protocol = parts[0].replace(/\s/g, '');
        const domain = parts[1].replace(/\s/g, '');
        cleaned = `${protocol}://${domain}`;
      }
    }
    
    // Decode URL encoded spaces that shouldn't be there
    cleaned = cleaned.replace(/%20/g, '');
    
    // Ensure proper protocol if missing
    if (cleaned.includes('www.') && !cleaned.includes('://')) {
      cleaned = 'https://' + cleaned;
    }
    
    // Validate the cleaned URL
    if (!this.isValidUrl(cleaned)) {
      console.warn(`⚠️ Invalid URL detected: "${cleaned}". Attempting to fix...`);
      cleaned = this.fixInvalidUrl(cleaned, url);
    }
    
    console.log(`🔧 URL cleaned: "${url}" → "${cleaned}"`);
    return cleaned;
  }

  /**
   * Validates if a URL is properly formatted
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Attempts to fix invalid URLs using common patterns
   */
  private fixInvalidUrl(invalidUrl: string, originalUrl: string): string {
    // Common website mappings
    const commonSites: Record<string, string> = {
      'youtube': 'https://www.youtube.com',
      'google': 'https://www.google.com',
      'facebook': 'https://www.facebook.com',
      'twitter': 'https://www.twitter.com',
      'instagram': 'https://www.instagram.com',
      'linkedin': 'https://www.linkedin.com',
      'github': 'https://www.github.com',
      'stackoverflow': 'https://stackoverflow.com',
      'reddit': 'https://www.reddit.com',
      'amazon': 'https://www.amazon.com'
    };

    // Check if the original input matches a common site
    const lowerOriginal = originalUrl.toLowerCase();
    for (const [key, value] of Object.entries(commonSites)) {
      if (lowerOriginal.includes(key)) {
        console.log(`🎯 Matched common site: ${key} → ${value}`);
        return value;
      }
    }

    // If we can't fix it, return the cleaned version anyway
    return invalidUrl;
  }

  /**
   * Checks if the input contains a website name
   */
  private containsWebsiteName(input: string): boolean {
    const websites = ['youtube', 'google', 'facebook', 'twitter', 'instagram', 'linkedin', 'github', 'stackoverflow', 'reddit', 'amazon', 'netflix', 'spotify', 'discord', 'slack', 'zoom'];
    return websites.some(site => input.toLowerCase().includes(site));
  }

  /**
   * Detects and returns website information from user input with multi-language support
   */
  private detectWebsite(input: string): { name: string; url: string } | null {
    const websites: Record<string, { name: string; url: string; aliases: string[] }> = {
      'youtube': { 
        name: 'YouTube', 
        url: 'https://www.youtube.com',
        aliases: ['youtube', 'yt', 'video', 'videos', 'youtu.be', '유튜브', 'ユーチューブ', 'يوتيوب']
      },
      'google': { 
        name: 'Google', 
        url: 'https://www.google.com',
        aliases: ['google', 'search', 'googl', '구글', 'グーグル', 'جوجل', 'گوگل']
      },
      'facebook': { 
        name: 'Facebook', 
        url: 'https://www.facebook.com',
        aliases: ['facebook', 'fb', 'meta', '페이스북', 'フェイスブック', 'فيسبوك']
      },
      'twitter': { 
        name: 'Twitter', 
        url: 'https://www.twitter.com',
        aliases: ['twitter', 'x', 'tweet', '트위터', 'ツイッター', 'تويتر']
      },
      'instagram': { 
        name: 'Instagram', 
        url: 'https://www.instagram.com',
        aliases: ['instagram', 'insta', 'ig', '인스타그램', 'インスタグラム', 'انستغرام']
      },
      'linkedin': { 
        name: 'LinkedIn', 
        url: 'https://www.linkedin.com',
        aliases: ['linkedin', 'linked', 'professional', '링크드인', 'リンクトイン', 'لينكد إن']
      },
      'github': { 
        name: 'GitHub', 
        url: 'https://www.github.com',
        aliases: ['github', 'git', 'code', 'repository', '깃허브', 'ギットハブ', 'جيت هاب']
      },
      'stackoverflow': { 
        name: 'Stack Overflow', 
        url: 'https://stackoverflow.com',
        aliases: ['stackoverflow', 'stack', 'overflow', 'programming', '스택오버플로우', 'スタックオーバーフロー']
      },
      'reddit': { 
        name: 'Reddit', 
        url: 'https://www.reddit.com',
        aliases: ['reddit', 'subreddit', '레딧', 'レディット', 'ريديت']
      },
      'amazon': { 
        name: 'Amazon', 
        url: 'https://www.amazon.com',
        aliases: ['amazon', 'shop', 'shopping', 'buy', '아마존', 'アマゾン', 'أمازون']
      },
      'netflix': { 
        name: 'Netflix', 
        url: 'https://www.netflix.com',
        aliases: ['netflix', 'movie', 'movies', 'series', '넷플릭스', 'ネットフリックス', 'نيتفليكس']
      },
      'spotify': { 
        name: 'Spotify', 
        url: 'https://www.spotify.com',
        aliases: ['spotify', 'music', 'song', 'playlist', '스포티파이', 'スポティファイ', 'سبوتيفاي']
      },
      'discord': { 
        name: 'Discord', 
        url: 'https://discord.com',
        aliases: ['discord', 'chat', 'voice', '디스코드', 'ディスコード', 'ديسكورد']
      },
      'slack': { 
        name: 'Slack', 
        url: 'https://slack.com',
        aliases: ['slack', 'work', 'team', '슬랙', 'スラック', 'سلاك']
      },
      'zoom': { 
        name: 'Zoom', 
        url: 'https://zoom.us',
        aliases: ['zoom', 'meeting', 'video call', '줌', 'ズーム', 'زوم']
      }
    };

    const lowerInput = input.toLowerCase();
    
    // Check each website and its aliases
    for (const [key, value] of Object.entries(websites)) {
      for (const alias of value.aliases) {
        if (lowerInput.includes(alias.toLowerCase())) {
          console.log(`🎯 Detected website: ${value.name} (matched: ${alias})`);
          return { name: value.name, url: value.url };
        }
      }
    }

    return null;
  }

  /**
   * Updates user context based on their behavior and preferences
   */
  private updateUserContext(sessionContext: SessionContext, userInput: string, analysis: TaskAnalysis): void {
    const now = Date.now();
    
    // Initialize context if not present
    if (!sessionContext.userPreferences) {
      sessionContext.userPreferences = { ...this.globalPreferences };
    }
    if (!sessionContext.recentSites) {
      sessionContext.recentSites = [];
    }
    if (!sessionContext.searchHistory) {
      sessionContext.searchHistory = [];
    }
    if (!sessionContext.behaviorPatterns) {
      sessionContext.behaviorPatterns = [];
    }

    // Update search history
    if (analysis.type === 'browser' && analysis.parameters?.browserActions) {
      const action = analysis.parameters.browserActions[0];
      if (action.action === 'search') {
        sessionContext.searchHistory.push({
          query: userInput,
          timestamp: now,
          successful: analysis.confidence > 80
        });
      } else if (action.action === 'navigate' && action.target) {
        // Update recent sites
        const domain = this.extractDomain(action.target);
        if (domain) {
          this.updateRecentSites(sessionContext, domain, action.target);
          this.updateSiteFrequency(sessionContext, domain);
        }
      }
    }

    // Update behavior patterns
    this.updateBehaviorPatterns(sessionContext, userInput, analysis);
    
    // Trim old data to prevent memory bloat
    this.trimOldData(sessionContext);
  }

  /**
   * Extracts domain from URL
   */
  private extractDomain(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return null;
    }
  }

  /**
   * Updates recent sites list
   */
  private updateRecentSites(context: SessionContext, domain: string, url: string): void {
    const existing = context.recentSites!.find(site => site.site === domain);
    const category = this.categorizeSite(domain);
    
    if (existing) {
      existing.frequency++;
      existing.timestamp = Date.now();
    } else {
      context.recentSites!.push({
        site: domain,
        url,
        timestamp: Date.now(),
        frequency: 1,
        category
      });
    }
    
    // Keep only last 50 sites
    context.recentSites = context.recentSites!
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50);
  }

  /**
   * Updates site frequency in user preferences
   */
  private updateSiteFrequency(context: SessionContext, domain: string): void {
    if (!context.userPreferences!.frequentlyUsedSites[domain]) {
      context.userPreferences!.frequentlyUsedSites[domain] = 0;
    }
    context.userPreferences!.frequentlyUsedSites[domain]++;
  }

  /**
   * Categorizes websites for better understanding
   */
  private categorizeSite(domain: string): 'social' | 'work' | 'entertainment' | 'shopping' | 'news' | 'other' {
    const socialSites = ['facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com', 'discord.com'];
    const workSites = ['github.com', 'stackoverflow.com', 'slack.com', 'zoom.us', 'notion.so'];
    const entertainmentSites = ['youtube.com', 'netflix.com', 'spotify.com', 'twitch.tv'];
    const shoppingSites = ['amazon.com', 'ebay.com', 'shopify.com'];
    const newsSites = ['cnn.com', 'bbc.com', 'reddit.com', 'news.ycombinator.com'];
    
    if (socialSites.includes(domain)) return 'social';
    if (workSites.includes(domain)) return 'work';
    if (entertainmentSites.includes(domain)) return 'entertainment';
    if (shoppingSites.includes(domain)) return 'shopping';
    if (newsSites.includes(domain)) return 'news';
    
    return 'other';
  }

  /**
   * Updates behavior patterns based on user actions
   */
  private updateBehaviorPatterns(context: SessionContext, userInput: string, analysis: TaskAnalysis): void {
    const pattern = this.extractPattern(userInput, analysis);
    if (!pattern) return;
    
    const existing = context.behaviorPatterns!.find(p => p.pattern === pattern);
    if (existing) {
      existing.frequency++;
      existing.lastUsed = Date.now();
    } else {
      context.behaviorPatterns!.push({
        pattern,
        frequency: 1,
        lastUsed: Date.now(),
        context: [analysis.type, analysis.intent]
      });
    }
  }

  /**
   * Extracts behavioral patterns from user input
   */
  private extractPattern(userInput: string, analysis: TaskAnalysis): string | null {
    const input = userInput.toLowerCase();
    
    // Common patterns
    if (input.includes('open') && analysis.type === 'browser') return 'direct_navigation';
    if (input.includes('search') && analysis.type === 'browser') return 'web_search';
    if (input.includes('add') && analysis.type === 'app_task') return 'task_creation';
    if (input.startsWith('go to') || input.startsWith('visit')) return 'explicit_navigation';
    
    return null;
  }

  /**
   * Trims old data to prevent memory issues
   */
  private trimOldData(context: SessionContext): void {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    // Keep only recent search history
    context.searchHistory = context.searchHistory!.filter(item => item.timestamp > oneWeekAgo);
    
    // Keep only recent behavior patterns
    context.behaviorPatterns = context.behaviorPatterns!.filter(pattern => pattern.lastUsed > oneWeekAgo);
  }

  /**
   * Builds a contextual prompt based on user history and preferences
   */
  private buildContextualPrompt(userInput: string, sessionContext: SessionContext): string {
    const searchIntent = this.recognizeSearchIntent(userInput, sessionContext);
    const userPrefs = sessionContext.userPreferences || this.globalPreferences;
    
    let contextInfo = '';
    
    // Add frequent sites context
    if (userPrefs.frequentlyUsedSites && Object.keys(userPrefs.frequentlyUsedSites).length > 0) {
      const topSites = Object.entries(userPrefs.frequentlyUsedSites)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([site]) => site);
      contextInfo += `\nUser frequently visits: ${topSites.join(', ')}`;
    }
    
    // Add recent sites context
    if (sessionContext.recentSites && sessionContext.recentSites.length > 0) {
      const recentSites = sessionContext.recentSites
        .slice(0, 3)
        .map(site => site.site);
      contextInfo += `\nRecently visited: ${recentSites.join(', ')}`;
    }
    
    // Add search intent context
    contextInfo += `\nSearch intent: ${searchIntent}`;
    
    // Add behavior pattern context
    if (sessionContext.behaviorPatterns && sessionContext.behaviorPatterns.length > 0) {
      const topPatterns = sessionContext.behaviorPatterns
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 3)
        .map(p => p.pattern);
      contextInfo += `\nCommon patterns: ${topPatterns.join(', ')}`;
    }

    const basePrompt = `You are an intelligent task analyzer for an AI Task Manager application. Analyze the user's input and determine what type of task they want to perform.

Available App Modules:
- daily_tasks: Daily to-do list management
- goals: Goal setting and tracking
- monthly_plan: Monthly planning
- travel_goals: Travel planning
- finance: Financial management
- job_search: Job search assistance
- living_advisor: Living advice and tips

Context Information:
- Current browser state: ${sessionContext.browserState}
- Last search term: ${sessionContext.lastSearchTerm || 'none'}
- Current page: ${sessionContext.currentPage || 'none'}
- Recent actions: ${sessionContext.recentActions.join(', ') || 'none'}${contextInfo}

User Input: "${userInput}"

Analysis Required:
1. Determine the task type: browser, app_task, conversation, calculation, or unknown
2. Provide confidence level (0-100)
3. Extract intent and parameters
4. Provide reasoning

CRITICAL FORMATTING RULES:
- Respond with ONLY valid JSON
- NO markdown, NO code blocks, NO explanations
- Use null instead of undefined
- NO trailing commas
- Properly quote ALL strings
- Ensure ALL strings are properly closed with quotes
- URLs must be complete: "https://www.youtube.com" (NO spaces)

Required JSON format:
{
  "type": "browser",
  "confidence": 85,
  "intent": "clear description of what user wants",
  "parameters": {
    "browserActions": [
      {
        "action": "navigate",
        "target": "url or element",
        "value": null,
        "description": "what this action does",
        "contextDependent": false
      }
    ],
    "appAction": null,
    "response": null,
    "calculation": null
  },
  "reasoning": "explanation of why this classification was chosen"
}

Examples:
- "add task buy groceries tomorrow" → Type: app_task, Module: daily_tasks, Action: create
- "search for AI news" → Type: browser, Action: search
- "open google" → Type: browser, Action: navigate, Target: "https://www.google.com"
- "open youtube" → Type: browser, Action: navigate, Target: "https://www.youtube.com"
- "go to facebook" → Type: browser, Action: navigate, Target: "https://www.facebook.com"
- "click first link" (when browserState is 'search_results') → Type: browser, Action: click, contextDependent: true
- "what's the weather like?" → Type: conversation (suggest browser search) or browser (direct search)
- "calculate 15 * 24" → Type: calculation
- "help me plan a trip to Japan" → Type: app_task, Module: travel_goals

IMPORTANT: For URLs, use exact format like "https://www.youtube.com" with NO spaces in the URL.

Return ONLY the JSON object. Do not include any other text, explanations, or formatting.`;

    return basePrompt;
  }

  /**
   * Recognizes search intent from user input and context
   */
  private recognizeSearchIntent(userInput: string, sessionContext: SessionContext): 'navigation' | 'search' | 'task' | 'mixed' {
    const input = userInput.toLowerCase();
    
    // Check for explicit navigation patterns
    const navigationPatterns = [
      /^(go to|visit|open|navigate to)/,
      /\.(com|org|net|edu|gov)/,
      /^https?:\/\//
    ];
    
    // Check for explicit search patterns  
    const searchPatterns = [
      /^(search for|find|look up|google)/,
      /^(what is|how to|where is)/,
      /\?$/
    ];
    
    // Check for task patterns
    const taskPatterns = [
      /^(add|create|make|new)/,
      /^(complete|finish|done)/,
      /^(delete|remove)/
    ];
    
    let intentScores = {
      navigation: 0,
      search: 0,
      task: 0
    };
    
    // Pattern matching
    navigationPatterns.forEach(pattern => {
      if (pattern.test(input)) intentScores.navigation += 3;
    });
    
    searchPatterns.forEach(pattern => {
      if (pattern.test(input)) intentScores.search += 3;
    });
    
    taskPatterns.forEach(pattern => {
      if (pattern.test(input)) intentScores.task += 3;
    });
    
    // Context-based adjustments
    if (sessionContext.recentSites && sessionContext.recentSites.length > 0) {
      // User recently navigated, might be continuing navigation
      if (input.includes('youtube') || input.includes('google')) {
        intentScores.navigation += 1;
      }
    }
    
    if (sessionContext.behaviorPatterns) {
      const navigationPattern = sessionContext.behaviorPatterns.find(p => p.pattern === 'direct_navigation');
      const searchPattern = sessionContext.behaviorPatterns.find(p => p.pattern === 'web_search');
      
      if (navigationPattern && navigationPattern.frequency > 5) {
        intentScores.navigation += 1;
      }
      if (searchPattern && searchPattern.frequency > 5) {
        intentScores.search += 1;
      }
    }
    
    // Determine primary intent
    const maxScore = Math.max(intentScores.navigation, intentScores.search, intentScores.task);
    const tiedIntents = Object.entries(intentScores).filter(([, score]) => score === maxScore);
    
    if (tiedIntents.length > 1 && maxScore > 0) {
      return 'mixed';
    }
    
    if (intentScores.navigation === maxScore) return 'navigation';
    if (intentScores.search === maxScore) return 'search';
    if (intentScores.task === maxScore) return 'task';
    
    // Default fallback based on common patterns
    if (input.includes('youtube') || input.includes('google') || input.includes('facebook')) {
      return 'navigation';
    }
    
    return 'search';
  }

  /**
   * Learns from user feedback to improve future predictions
   */
  learnFromFeedback(
    userInput: string,
    originalAnalysis: TaskAnalysis,
    userFeedback: {
      wasCorrect: boolean;
      correctType?: 'browser' | 'app_task' | 'conversation' | 'calculation';
      correctIntent?: string;
      correctTarget?: string;
    },
    sessionContext: SessionContext
  ): void {
    console.log(`🧠 Learning from feedback for: "${userInput}"`);
    
    // Initialize feedback learning structure if not present
    if (!this.globalPreferences.feedbackLearning) {
      this.globalPreferences.feedbackLearning = [];
    }

    const feedbackEntry = {
      userInput: userInput.toLowerCase(),
      originalAnalysis: {
        type: originalAnalysis.type,
        intent: originalAnalysis.intent,
        confidence: originalAnalysis.confidence
      },
      feedback: userFeedback,
      timestamp: Date.now(),
      context: {
        browserState: sessionContext.browserState,
        recentActions: sessionContext.recentActions.slice(-3)
      }
    };

    // Add to feedback learning
    this.globalPreferences.feedbackLearning.push(feedbackEntry);

    // Update user preferences based on feedback
    if (!userFeedback.wasCorrect && userFeedback.correctType) {
      // Learn patterns from corrections
      this.updateCorrectionPatterns(userInput, userFeedback, sessionContext);
    }

    // Update context-based preferences
    this.updateContextPreferences(userInput, userFeedback, sessionContext);

    // Trim old feedback to prevent memory bloat (keep last 1000 entries)
    if (this.globalPreferences.feedbackLearning.length > 1000) {
      this.globalPreferences.feedbackLearning = this.globalPreferences.feedbackLearning
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 1000);
    }

    console.log(`📚 Feedback learned and stored. Total feedback entries: ${this.globalPreferences.feedbackLearning.length}`);
  }

  /**
   * Updates correction patterns based on user feedback
   */
  private updateCorrectionPatterns(
    userInput: string,
    feedback: { correctType?: string; correctIntent?: string; correctTarget?: string },
    sessionContext: SessionContext
  ): void {
    if (!this.globalPreferences.correctionPatterns) {
      this.globalPreferences.correctionPatterns = {};
    }

    const inputPattern = this.extractInputPattern(userInput);
    if (!inputPattern) return;

    if (!this.globalPreferences.correctionPatterns[inputPattern]) {
      this.globalPreferences.correctionPatterns[inputPattern] = {
        frequency: 0,
        corrections: []
      };
    }

    const correction = {
      type: feedback.correctType,
      intent: feedback.correctIntent,
      target: feedback.correctTarget,
      timestamp: Date.now()
    };

    this.globalPreferences.correctionPatterns[inputPattern].frequency++;
    this.globalPreferences.correctionPatterns[inputPattern].corrections.push(correction);

    // Keep only recent corrections (last 10)
    if (this.globalPreferences.correctionPatterns[inputPattern].corrections.length > 10) {
      this.globalPreferences.correctionPatterns[inputPattern].corrections = 
        this.globalPreferences.correctionPatterns[inputPattern].corrections
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 10);
    }
  }

  /**
   * Updates context-based preferences from feedback
   */
  private updateContextPreferences(
    userInput: string,
    feedback: { correctType?: string; correctIntent?: string },
    sessionContext: SessionContext
  ): void {
    if (!this.globalPreferences.contextPreferences) {
      this.globalPreferences.contextPreferences = {};
    }

    const contextKey = `${sessionContext.browserState}_${sessionContext.recentActions.slice(-1)[0]}`;
    
    if (!this.globalPreferences.contextPreferences[contextKey]) {
      this.globalPreferences.contextPreferences[contextKey] = {};
    }

    const inputKey = userInput.toLowerCase().substring(0, 50); // Limit key length
    
    if (!this.globalPreferences.contextPreferences[contextKey][inputKey]) {
      this.globalPreferences.contextPreferences[contextKey][inputKey] = {
        preferredType: feedback.correctType,
        preferredIntent: feedback.correctIntent,
        confidence: 1
      };
    } else {
      // Increase confidence if feedback is consistent
      this.globalPreferences.contextPreferences[contextKey][inputKey].confidence++;
    }
  }

  /**
   * Extracts a pattern from user input for learning
   */
  private extractInputPattern(userInput: string): string | null {
    const input = userInput.toLowerCase().trim();
    
    // Common patterns to learn from
    if (input.startsWith('open ')) return 'open_*';
    if (input.startsWith('go to ')) return 'go_to_*';
    if (input.startsWith('search ')) return 'search_*';
    if (input.startsWith('add ')) return 'add_*';
    if (input.startsWith('create ')) return 'create_*';
    if (input.includes(' task')) return '*_task';
    if (input.includes(' youtube')) return '*_youtube';
    if (input.includes(' google')) return '*_google';
    
    // First word patterns
    const firstWord = input.split(' ')[0];
    if (firstWord.length > 2) return `${firstWord}_*`;
    
    return null;
  }

  /**
   * Gets learned preferences for similar inputs
   */
  private getLearnedPreferences(userInput: string, sessionContext: SessionContext): {
    type?: string;
    intent?: string;
    confidence: number;
  } | null {
    if (!this.globalPreferences.feedbackLearning) return null;

    const inputLower = userInput.toLowerCase();
    
    // Look for similar inputs in feedback history
    const similarFeedback = this.globalPreferences.feedbackLearning.filter(entry => {
      const similarity = this.calculateStringSimilarity(inputLower, entry.userInput);
      return similarity > 0.7; // 70% similarity threshold
    });

    if (similarFeedback.length === 0) return null;

    // Get the most recent and successful feedback
    const validFeedback = similarFeedback
      .filter(entry => entry.feedback.wasCorrect)
      .sort((a, b) => b.timestamp - a.timestamp);

    if (validFeedback.length > 0) {
      const latest = validFeedback[0];
      return {
        type: latest.feedback.correctType,
        intent: latest.feedback.correctIntent,
        confidence: Math.min(95, 60 + (validFeedback.length * 5)) // Base 60% + 5% per similar case
      };
    }

    return null;
  }

  /**
   * Calculates string similarity using simple character-based approach
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.calculateLevenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculates Levenshtein distance between two strings
   */
  private calculateLevenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Integrates current browser state for context-aware analysis
   */
  integratesBrowserState(sessionContext: SessionContext, browserInfo?: {
    currentUrl?: string;
    currentTitle?: string;
    selectedText?: string;
    visibleLinks?: string[];
    pageContent?: string;
    browserType?: 'chrome' | 'firefox' | 'safari' | 'edge';
  }): SessionContext {
    if (!browserInfo) return sessionContext;

    console.log('🔗 Integrating browser state information');

    // Update browser state with current information
    if (browserInfo.currentUrl) {
      sessionContext.currentPage = browserInfo.currentUrl;
      
      // Extract domain for recent sites tracking
      const domain = this.extractDomain(browserInfo.currentUrl);
      if (domain) {
        this.updateRecentSites(sessionContext, domain, browserInfo.currentUrl);
      }
    }

    // Update browser state based on page content
    if (browserInfo.currentTitle) {
      if (browserInfo.currentTitle.toLowerCase().includes('search')) {
        sessionContext.browserState = 'search_results';
      } else if (browserInfo.visibleLinks && browserInfo.visibleLinks.length > 0) {
        sessionContext.browserState = 'content_loaded';
      } else {
        sessionContext.browserState = 'idle';
      }
    }

    // Store additional context for AI analysis
    if (browserInfo.selectedText) {
      sessionContext.selectedText = browserInfo.selectedText;
    }

    if (browserInfo.visibleLinks) {
      sessionContext.availableActions = browserInfo.visibleLinks.map(link => ({
        type: 'click',
        target: link,
        description: `Click on ${link}`
      }));
    }

    // Update page context for better suggestions
    if (browserInfo.pageContent) {
      sessionContext.pageContext = this.extractPageContext(browserInfo.pageContent);
    }

    console.log(`🔗 Browser state updated: ${sessionContext.browserState} on ${sessionContext.currentPage}`);
    
    return sessionContext;
  }

  /**
   * Extracts relevant context from page content
   */
  private extractPageContext(pageContent: string): {
    keywords: string[];
    category: string;
    hasSearchBox: boolean;
    hasNavigation: boolean;
  } {
    const content = pageContent.toLowerCase();
    
    // Extract keywords (simple approach - top words excluding common ones)
    const words = content.split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => ![
        'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one',
        'our', 'had', 'by', 'word', 'but', 'what', 'some', 'we', 'can', 'out', 'other',
        'were', 'which', 'their', 'said', 'each', 'she', 'do', 'how', 'their', 'if',
        'will', 'up', 'other', 'about', 'out', 'many', 'then', 'them', 'these', 'so',
        'some', 'her', 'would', 'make', 'like', 'into', 'him', 'has', 'two', 'more',
        'div', 'span', 'class', 'href', 'html', 'body', 'script', 'style'
      ].includes(word));

    const wordCount: Record<string, number> = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    const keywords = Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);

    // Determine category
    let category = 'general';
    if (content.includes('shop') || content.includes('buy') || content.includes('cart')) {
      category = 'shopping';
    } else if (content.includes('video') || content.includes('watch') || content.includes('play')) {
      category = 'entertainment';
    } else if (content.includes('work') || content.includes('business') || content.includes('professional')) {
      category = 'work';
    } else if (content.includes('social') || content.includes('friends') || content.includes('share')) {
      category = 'social';
    } else if (content.includes('news') || content.includes('article') || content.includes('breaking')) {
      category = 'news';
    }

    const hasSearchBox = content.includes('search') && (content.includes('input') || content.includes('textbox'));
    const hasNavigation = content.includes('nav') || content.includes('menu') || content.includes('link');

    return {
      keywords,
      category,
      hasSearchBox,
      hasNavigation
    };
  }

  /**
   * Gets context-aware suggestions based on current browser state
   */
  getContextAwareSuggestions(sessionContext: SessionContext): string[] {
    const suggestions: string[] = [];
    
    // Suggestions based on browser state
    switch (sessionContext.browserState) {
      case 'search_results':
        suggestions.push('Click on the first result');
        suggestions.push('Refine your search');
        suggestions.push('Search for something else');
        break;
        
      case 'content_loaded':
        if (sessionContext.availableActions) {
          suggestions.push('Click on a link');
          suggestions.push('Go back to previous page');
        }
        break;
        
      case 'idle':
        suggestions.push('Search for something');
        suggestions.push('Open a website');
        suggestions.push('Add a task');
        break;
    }

    // Suggestions based on recent activity
    if (sessionContext.recentSites && sessionContext.recentSites.length > 0) {
      const topSite = sessionContext.recentSites[0];
      suggestions.push(`Go back to ${topSite.site}`);
    }

    // Suggestions based on page context
    if (sessionContext.pageContext) {
      const { category, hasSearchBox } = sessionContext.pageContext;
      
      if (hasSearchBox) {
        suggestions.push('Search on this page');
      }
      
      if (category === 'shopping') {
        suggestions.push('Add item to wishlist');
        suggestions.push('Compare prices');
      } else if (category === 'entertainment') {
        suggestions.push('Save for later');
        suggestions.push('Share this content');
      }
    }

    // Remove duplicates and limit to 5 suggestions
    return [...new Set(suggestions)].slice(0, 5);
  }

  /**
   * Updates the AI analysis based on learned preferences
   */
  private enhanceAnalysisWithLearning(
    userInput: string, 
    analysis: TaskAnalysis, 
    sessionContext: SessionContext
  ): TaskAnalysis {
    // Check for learned preferences
    const learnedPrefs = this.getLearnedPreferences(userInput, sessionContext);
    
    if (learnedPrefs && learnedPrefs.confidence > analysis.confidence) {
      console.log(`🧠 Applying learned preferences: ${learnedPrefs.type} (${learnedPrefs.confidence}% confidence)`);
      
      analysis.type = learnedPrefs.type as any;
      analysis.intent = learnedPrefs.intent || analysis.intent;
      analysis.confidence = Math.max(analysis.confidence, learnedPrefs.confidence);
    }

    // Apply correction patterns
    const inputPattern = this.extractInputPattern(userInput);
    if (inputPattern && this.globalPreferences.correctionPatterns?.[inputPattern]) {
      const pattern = this.globalPreferences.correctionPatterns[inputPattern];
      if (pattern.frequency > 3) { // Only apply if we have multiple corrections
        const recentCorrection = pattern.corrections
          .sort((a, b) => b.timestamp - a.timestamp)[0];
        
        if (recentCorrection && recentCorrection.type) {
          console.log(`🔧 Applying correction pattern for "${inputPattern}": ${recentCorrection.type}`);
          analysis.type = recentCorrection.type as any;
          analysis.confidence = Math.min(95, analysis.confidence + 15);
        }
      }
    }

    return analysis;
  }

  /**
   * Ensures the automation server is awake (for free tier deployments)
   */
  private async ensureServerAwake(): Promise<boolean> {
    try {
      console.log('🔄 Checking server status...');
      const response = await fetch(`${this.automationServerUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (response.ok) {
        console.log('✅ Server is awake');
        return true;
      }
    } catch (error) {
      console.log('⏰ Server sleeping, waking up...');
      
      // Wake up the server
      try {
        await fetch(`${this.automationServerUrl}/wake`, {
          method: 'GET',
          signal: AbortSignal.timeout(10000) // 10 second timeout for wake
        });
        
        console.log('⏳ Waiting for server to fully wake up (30 seconds)...');
        // Wait for server to fully wake up
        await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds
        
        // Verify server is now awake
        const verifyResponse = await fetch(`${this.automationServerUrl}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        
        if (verifyResponse.ok) {
          console.log('✅ Server successfully awakened');
          return true;
        }
      } catch (wakeError) {
        console.error('❌ Failed to wake server:', wakeError);
        return false;
      }
    }
    
    return false;
  }

  /**
   * Makes a request to the automation server with retry logic
   */
  private async makeServerRequest(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<Response> {
    // First, ensure server is awake
    const isAwake = await this.ensureServerAwake();
    if (!isAwake) {
      throw new Error('Automation server is not available');
    }

    const url = `${this.automationServerUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        signal: AbortSignal.timeout(30000) // 30 second timeout for automation tasks
      });

      if (!response.ok) {
        throw new Error(`Server request failed: ${response.status} ${response.statusText}`);
      }

      return response;
    } catch (error) {
      console.error(`❌ Server request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async analyzeUserInput(
    userInput: string, 
    sessionContext: SessionContext
  ): Promise<TaskAnalysis> {
    const startTime = performance.now();
    console.log(`🚀 Starting AI analysis for: "${userInput}"`);
    
    // Enhance prompt with context awareness
    const contextPrompt = this.buildContextualPrompt(userInput, sessionContext);
    
    try {
      const response = await this.callGeminiAPI(contextPrompt);
      
      console.log('Raw Gemini Response:', response);
      
      // Check for empty or invalid response
      if (!response || response.trim().length === 0) {
        console.error('Empty response from Gemini API');
        throw new Error('Empty response from AI service');
      }
      
      // Extract JSON from response - handle various formats
      let jsonString = this.extractJsonFromResponse(response);
      
      console.log('Extracted JSON:', jsonString);
      
      // Check if extracted JSON is empty
      if (!jsonString || jsonString.trim().length === 0) {
        console.error('No JSON found in response');
        throw new Error('No valid JSON found in AI response');
      }

      // Validate JSON structure before parsing
      if (!this.isValidJsonStructure(jsonString)) {
        console.warn('Invalid JSON structure detected, attempting to fix...');
        jsonString = this.fixCommonJsonIssues(jsonString);
      }

      let analysis: TaskAnalysis;
      try {
        analysis = JSON.parse(jsonString) as TaskAnalysis;
        console.log('✅ JSON parsed successfully on first attempt');
      } catch (parseError) {
        const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
        console.error('❌ JSON Parse Error:', parseError);
        console.error('📝 Problematic JSON string:', jsonString);
        console.error('📏 JSON length:', jsonString.length);
        console.error('🔍 JSON preview:', jsonString.substring(0, 200) + '...');
        
        // Try to fix common JSON issues and parse again
        let fixedJson = this.fixCommonJsonIssues(jsonString);
        console.log('🔧 Attempting to parse fixed JSON:', fixedJson.substring(0, 200) + '...');
        
        try {
          analysis = JSON.parse(fixedJson) as TaskAnalysis;
          console.log('✅ JSON parsed successfully after fixing');
        } catch (secondParseError) {
          console.error('❌ Second JSON Parse Error:', secondParseError);
          console.error('📝 Fixed JSON that failed:', fixedJson);
          
          // Try to auto-close JSON as a last resort
          let autoClosed = this.autoCloseJson(fixedJson);
          if (autoClosed !== fixedJson) {
            console.log('🔧 Attempting auto-closed JSON:', autoClosed.substring(0, 200) + '...');
            try {
              analysis = JSON.parse(autoClosed) as TaskAnalysis;
              console.warn('⚠️ Successfully parsed after auto-closing JSON.');
            } catch (thirdParseError) {
              console.error('❌ Third JSON Parse Error (auto-closed):', thirdParseError);
              console.error('📝 Auto-closed JSON that failed:', autoClosed);
              throw new Error(`Failed to parse AI response after all attempts. Original error: ${errorMessage}. Raw response: "${response.substring(0, 500)}..."`);
            }
          } else {
            throw new Error(`Failed to parse AI response. Original error: ${errorMessage}. Raw response: "${response.substring(0, 500)}..."`);
          }
        }
      }
      
      // Validate the response
      if (!analysis.type || !analysis.intent || typeof analysis.confidence !== 'number') {
        throw new Error('Invalid analysis response format');
      }

      // Clean up any URLs in the response that might have spaces or formatting issues
      if (analysis.parameters?.browserActions) {
        analysis.parameters.browserActions = analysis.parameters.browserActions.map(action => {
          const originalTarget = action.target;
          const cleanedTarget = action.target ? this.cleanUrl(action.target) : action.target;
          
          // Log URL cleaning for debugging
          if (originalTarget !== cleanedTarget) {
            console.log(`🔧 URL auto-fixed: "${originalTarget}" → "${cleanedTarget}"`);
          }
          
          return {
            ...action,
            target: cleanedTarget
          };
        });
      }

      // Add confidence boost for successful parsing after fixes
      if (analysis.confidence < 90) {
        analysis.confidence = Math.min(95, analysis.confidence + 10);
        console.log(`⬆️ Confidence boosted to ${analysis.confidence}% after successful parsing`);
      }

      // Update user context based on analysis
      this.updateUserContext(sessionContext, userInput, analysis);

      // Enhance analysis with learned preferences
      analysis = this.enhanceAnalysisWithLearning(userInput, analysis, sessionContext);

      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      console.log(`⚡ AI analysis completed in ${duration}ms with ${analysis.confidence}% confidence`);

      return analysis;
    } catch (error) {
      // Get the response for error logging (might be undefined if API call failed)
      let rawResponse = '';
      try {
        rawResponse = await this.callGeminiAPI(contextPrompt);
      } catch {
        rawResponse = 'API call failed';
      }
      
      console.error('AI Analysis failed:', error);
      console.error('Failed to parse response. Raw response was:', rawResponse);
      
      // Fallback: try to determine task type from simple keywords
      const input = userInput.toLowerCase();
      let fallbackType: 'browser' | 'app_task' | 'conversation' = 'conversation';
      let fallbackIntent = 'Failed to analyze request';
      let fallbackAction = '';
      let fallbackTarget = '';

      // Enhanced keyword-based fallback with better site detection
      if (input.includes('open') || input.includes('go to') || input.includes('visit') || input.includes('navigate') || this.containsWebsiteName(input)) {
        fallbackType = 'browser';
        fallbackIntent = 'Navigate to website';
        
        // Smart website detection
        const detectedSite = this.detectWebsite(input);
        if (detectedSite) {
          fallbackAction = 'navigate';
          fallbackTarget = detectedSite.url;
          fallbackIntent = `Navigate to ${detectedSite.name}`;
        } else if (input.includes('search')) {
          fallbackAction = 'search';
          fallbackTarget = userInput;
          fallbackIntent = 'Perform web search';
        } else {
          fallbackAction = 'search';
          fallbackTarget = userInput;
        }
      } else if (input.includes('search') && !input.includes('add') && !input.includes('task')) {
        fallbackType = 'browser';
        fallbackIntent = 'Perform web search';
        fallbackAction = 'search';
        fallbackTarget = userInput;
      } else if (input.includes('add') && (input.includes('task') || input.includes('todo'))) {
        fallbackType = 'app_task';
        fallbackIntent = 'Add a new task';
        fallbackAction = 'create';
        fallbackTarget = 'daily_tasks';
      }
      
      return {
        type: fallbackType,
        confidence: 50, // Low confidence for fallback
        intent: fallbackIntent,
        parameters: {
          browserActions: fallbackType === 'browser' ? [
            {
              action: fallbackAction,
              target: fallbackTarget,
              value: userInput,
              description: fallbackIntent,
              contextDependent: false
            }
          ] : [],
          appAction: fallbackType === 'app_task' ? {
            module: fallbackTarget,
            action: fallbackAction,
            data: {
              title: userInput,
              description: '',
              priority: 'medium',
              category: 'general',
              dueDate: null
            },
            description: fallbackIntent
          } : undefined,
          response: fallbackType === 'conversation' ? 'I had trouble understanding your request. Could you please rephrase it?' : '',
          calculation: ''
        },
        reasoning: `Fallback analysis due to AI parsing error: ${error instanceof Error ? error.message : String(error)}`
      } as TaskAnalysis;
    } finally {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      console.log(`🏁 Total analysis time: ${duration}ms`);
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

  private async callGeminiAPI(prompt: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1, // Lower temperature for more consistent JSON
        topK: 1, // More focused responses
        topP: 0.8, // Slightly more focused
        maxOutputTokens: 1000,
        stopSequences: ["```", "\n\n\n"], // Stop at code blocks or excessive newlines
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH", 
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Invalid response format from Gemini API');
      }
    } catch (error) {
      console.error('Gemini API call failed:', error);
      throw error;
    }
  }
}

export default AIAnalysisService;
