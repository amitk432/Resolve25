'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Bot, 
  Loader2
} from 'lucide-react';
import AutomationClient, { BrowserAction as AutomationAction, TaskStatus } from '@/automation-server/client';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isProcessing?: boolean;
  requiresBrowser?: boolean;
  taskStatus?: 'pending' | 'executing' | 'completed' | 'failed';
  steps?: string[];
  model?: string;
}

interface BrowserAction {
  type: 'navigate' | 'search';
  target?: string;
  value?: string;
  description: string;
}

interface AIModel {
  id: string;
  name: string;
  description: string;
  speed: 'Fast' | 'Medium' | 'Slow';
  accuracy: 'High' | 'Medium' | 'Basic';
  cost: 'Free' | 'Low' | 'Medium' | 'High';
  limits: string;
  available: boolean;
}

// Available AI Models
const AI_MODELS: AIModel[] = [
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    description: 'Latest multimodal model with vision, audio, and code capabilities',
    speed: 'Fast',
    accuracy: 'High',
    cost: 'Low',
    limits: '15 RPM (requests per minute), 1M TPM (tokens per minute), 1500 RPD (requests per day)',
    available: true
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    description: 'Advanced reasoning with 2M token context window',
    speed: 'Medium',
    accuracy: 'High',
    cost: 'Medium',
    limits: '2 RPM, 32K TPM, 50 RPD',
    available: true
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    description: 'Fast and efficient with 1M token context',
    speed: 'Fast',
    accuracy: 'High',
    cost: 'Low',
    limits: '15 RPM, 1M TPM, 1500 RPD',
    available: true
  },
  {
    id: 'gemini-1.0-pro',
    name: 'Gemini 1.0 Pro',
    description: 'Reliable general-purpose model',
    speed: 'Medium',
    accuracy: 'Medium',
    cost: 'Low',
    limits: '60 RPM, 32K TPM, No daily limit',
    available: true
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo (Not Available)',
    description: 'Requires OpenAI API key - not configured',
    speed: 'Medium',
    accuracy: 'High',
    cost: 'High',
    limits: 'Not available - requires API key setup',
    available: false
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo (Not Available)',
    description: 'Requires OpenAI API key - not configured',
    speed: 'Fast',
    accuracy: 'Medium',
    cost: 'Low',
    limits: 'Not available - requires API key setup',
    available: false
  },
  {
    id: 'claude-3',
    name: 'Claude 3 Sonnet (Not Available)',
    description: 'Requires Anthropic API key - not configured',
    speed: 'Medium',
    accuracy: 'High',
    cost: 'Medium',
    limits: 'Not available - requires API key setup',
    available: false
  }
];

// Function to determine if a prompt requires browser execution
const shouldUseBrowser = (prompt: string): boolean => {
  const browserKeywords = [
    'search', 'browse', 'website', 'web', 'find online', 'find', 'look up', 'research', 
    'visit', 'open', 'navigate to', 'go to', 'check', 'show me',
    'wikipedia', 'github', 'stackoverflow', 'youtube', 'google', 'amazon',
    'buy', 'shop', 'order', 'book', 'reserve', 'download', 'watch', 'read',
    'news', 'weather', 'email', 'social', 'facebook', 'twitter', 'instagram'
  ];
  
  return browserKeywords.some(keyword => 
    prompt.toLowerCase().includes(keyword.toLowerCase())
  );
};

// Enhanced function to parse complex user intent and generate sequential action plans
const parseUserIntent = (prompt: string): BrowserAction[] => {
  const actions: BrowserAction[] = [];
  const lowerPrompt = prompt.toLowerCase();
  
  // Split by common conjunctions to handle multiple tasks
  const taskSeparators = [' and ', ' then ', ' after that ', ' also ', ' plus '];
  let tasks = [prompt];
  
  for (const separator of taskSeparators) {
    if (lowerPrompt.includes(separator)) {
      tasks = prompt.split(new RegExp(separator, 'gi'));
      break;
    }
  }
  
  tasks.forEach((task, index) => {
    const trimmedTask = task.trim();
    const lowerTask = trimmedTask.toLowerCase();
    
    // Handle specific website requests
    if (lowerTask.includes('open google') || lowerTask.includes('go to google')) {
      actions.push({
        type: 'navigate',
        target: 'https://www.google.com',
        description: `Opening Google`
      });
    } else if (lowerTask.includes('open youtube') || lowerTask.includes('go to youtube')) {
      actions.push({
        type: 'navigate',
        target: 'https://www.youtube.com',
        description: `Opening YouTube`
      });
    } else if (lowerTask.includes('open amazon') || lowerTask.includes('go to amazon')) {
      actions.push({
        type: 'navigate',
        target: 'https://www.amazon.com',
        description: `Opening Amazon`
      });
    } else if (lowerTask.includes('open facebook') || lowerTask.includes('go to facebook')) {
      actions.push({
        type: 'navigate',
        target: 'https://www.facebook.com',
        description: `Opening Facebook`
      });
    } else if (lowerTask.includes('open twitter') || lowerTask.includes('go to twitter')) {
      actions.push({
        type: 'navigate',
        target: 'https://www.twitter.com',
        description: `Opening Twitter`
      });
    } else if (lowerTask.includes('open github') || lowerTask.includes('go to github')) {
      actions.push({
        type: 'navigate',
        target: 'https://www.github.com',
        description: `Opening GitHub`
      });
    } else if (lowerTask.includes('wikipedia')) {
      const searchTerm = trimmedTask.replace(/open|go to|search|wikipedia/gi, '').trim();
      actions.push({
        type: 'navigate',
        target: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(searchTerm || trimmedTask)}`,
        description: `Searching Wikipedia for "${searchTerm || trimmedTask}"`
      });
    } else if (lowerTask.includes('stackoverflow')) {
      const searchTerm = trimmedTask.replace(/open|go to|search|stackoverflow/gi, '').trim();
      actions.push({
        type: 'navigate',
        target: `https://stackoverflow.com/search?q=${encodeURIComponent(searchTerm || trimmedTask)}`,
        description: `Searching Stack Overflow for "${searchTerm || trimmedTask}"`
      });
    } 
    // Handle search requests
    else if (lowerTask.includes('search') || lowerTask.includes('find') || lowerTask.includes('look up')) {
      const searchTerm = trimmedTask.replace(/search for|search|find|look up/gi, '').trim();
      actions.push({
        type: 'search',
        value: searchTerm || trimmedTask,
        description: `Searching for "${searchTerm || trimmedTask}"`
      });
    }
    // Handle news requests
    else if (lowerTask.includes('news')) {
      actions.push({
        type: 'navigate',
        target: `https://news.google.com/search?q=${encodeURIComponent(trimmedTask)}`,
        description: `Finding news about "${trimmedTask}"`
      });
    }
    // Handle weather requests
    else if (lowerTask.includes('weather')) {
      actions.push({
        type: 'search',
        value: trimmedTask,
        description: `Getting weather information`
      });
    }
    // Handle email requests
    else if (lowerTask.includes('email') || lowerTask.includes('gmail')) {
      actions.push({
        type: 'navigate',
        target: 'https://mail.google.com',
        description: `Opening Gmail`
      });
    }
    // Handle calendar requests
    else if (lowerTask.includes('calendar')) {
      actions.push({
        type: 'navigate',
        target: 'https://calendar.google.com',
        description: `Opening Google Calendar`
      });
    }
    // Default search for any other request
    else if (trimmedTask) {
      actions.push({
        type: 'search',
        value: trimmedTask,
        description: `Searching for "${trimmedTask}"`
      });
    }
  });

  return actions;
};

export default function AITaskManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExecutingTask, setIsExecutingTask] = useState(false);
  const [taskProgress, setTaskProgress] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash');
  const [automationServerAvailable, setAutomationServerAvailable] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const automationClient = useRef<AutomationClient>(new AutomationClient());

  const currentModel = AI_MODELS.find(m => m.id === selectedModel);

  // Check automation server availability on mount
  useEffect(() => {
    const checkServerHealth = async () => {
      const isHealthy = await automationClient.current.isServerHealthy();
      setAutomationServerAvailable(isHealthy);
    };
    
    checkServerHealth();
    // Check every 30 seconds
    const interval = setInterval(checkServerHealth, 30000);
    
    // Auto-focus input on mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    return () => {
      clearInterval(interval);
      automationClient.current.cleanup();
    };
  }, []);

  // Convert local BrowserAction to AutomationAction
  const convertToAutomationActions = (actions: BrowserAction[]): AutomationAction[] => {
    return actions.map(action => ({
      type: action.type as any,
      target: action.target,
      value: action.value,
      description: action.description
    }));
  };

  const executeAgenticTask = async (prompt: string, actions: BrowserAction[]) => {
    setIsExecutingTask(true);
    setTaskProgress([]);

    // Try automation server first if available
    if (automationServerAvailable) {
      try {
        const automationActions = convertToAutomationActions(actions);
        const taskId = await automationClient.current.executeTask(automationActions);
        setCurrentTaskId(taskId);
        
        // Poll for progress
        automationClient.current.pollTaskProgress(
          taskId,
          (progress) => {
            setTaskProgress(progress);
          },
          (status) => {
            if (status.status === 'completed') {
              setTaskProgress([...status.progress?.map(p => p.message) || [], '🎉 Task completed with automation server!']);
            } else if (status.status === 'failed') {
              setTaskProgress([...status.progress?.map(p => p.message) || [], `❌ Task failed: ${status.error}`]);
            }
            
            setTimeout(() => {
              setTaskProgress([]);
              setIsExecutingTask(false);
              setCurrentTaskId(null);
            }, 3000);
          }
        );
        
        return;
      } catch (error) {
        console.error('Automation server failed, falling back to direct navigation:', error);
        setTaskProgress(['⚠️ Automation server failed, using direct navigation...']);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      
      // Update progress with current step
      setTaskProgress([`Step ${i + 1}/${actions.length}: ${action.description}`]);
      
      // Simulate thinking time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Execute the action in current browser tab
      switch (action.type) {
        case 'navigate':
          if (action.target) {
            try {
              // Navigate in current tab
              window.location.href = action.target;
              return; // Exit here as page will reload
            } catch (error) {
              setTaskProgress([`❌ Error navigating to ${action.target}`]);
            }
          }
          break;
          
        case 'search':
          try {
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(action.value || prompt)}`;
            // Navigate to search in current tab
            window.location.href = searchUrl;
            return; // Exit here as page will reload
          } catch (error) {
            setTaskProgress([`❌ Error performing search`]);
          }
          break;
      }
      
      // Brief pause between actions if there are multiple
      if (i < actions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    setTaskProgress(['🎉 Task completed!']);
    setTimeout(() => {
      setTaskProgress([]);
      setIsExecutingTask(false);
    }, 2000);
  };

  const handleSubmit = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const needsBrowser = shouldUseBrowser(inputValue.trim());
    const actions = needsBrowser ? parseUserIntent(inputValue.trim()) : [];
    
    setIsProcessing(true);

    if (needsBrowser) {
      // Execute the task
      setTimeout(() => {
        executeAgenticTask(inputValue.trim(), actions);
        setIsProcessing(false);
      }, 500);
    } else {
      // For non-browser tasks, just show a message
      setTaskProgress(['I can help with web tasks like "open google", "search for AI news", or "open Wikipedia"']);
      setTimeout(() => {
        setTaskProgress([]);
        setIsProcessing(false);
      }, 3000);
    }
    
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Header */}
      <div className="flex-shrink-0 border-b bg-white dark:bg-gray-800 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">AI Task Manager</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Performs tasks in current browser tab</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Server Status */}
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                <div className={`w-2 h-2 rounded-full ${automationServerAvailable ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {automationServerAvailable ? 'Full Automation Active' : 'Direct Navigation Mode'}
                </span>
              </div>
              
              {/* Model Selection */}
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-[200px] h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
            <SelectContent>
              {AI_MODELS.map((model) => (
                <SelectItem 
                  key={model.id} 
                  value={model.id}
                  disabled={!model.available}
                >
                  <div className="flex flex-col gap-1 py-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${!model.available ? 'text-gray-400' : ''}`}>
                        {model.name}
                      </span>
                      <div className="flex gap-1">
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {model.speed}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {model.cost}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {model.limits}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Task Instructions and Status */}
      <div className="flex-1 relative flex items-center justify-center">
        {taskProgress.length > 0 || isExecutingTask ? (
          <div className="bg-background/95 p-6 rounded-lg border shadow-lg max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium">AI Task Assistant</span>
            </div>
            
            {isProcessing && taskProgress.length === 0 && (
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing your request...</span>
              </div>
            )}
            
            {taskProgress.map((step, index) => (
              <div key={index} className="text-blue-600 dark:text-blue-400 mb-2">
                {step}
              </div>
            ))}
            
            {isExecutingTask && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  🚀 Navigating in current browser tab...
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center max-w-2xl mx-auto p-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              AI Task Assistant
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              I can help you with daily web tasks. {automationServerAvailable 
                ? 'Full automation server is active - I can perform complex multi-step tasks in a visible browser window.' 
                : 'Direct navigation mode - I can navigate to websites in this current tab.'}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <strong className="text-gray-900 dark:text-gray-100">🌐 Navigate:</strong>
                <br />
                "Open Google", "Go to YouTube", "Open Gmail"
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <strong className="text-gray-900 dark:text-gray-100">🔍 Search:</strong>
                <br />
                "Search for AI news", "Find weather forecast"
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <strong className="text-gray-900 dark:text-gray-100">📚 Research:</strong>
                <br />
                "Wikipedia machine learning", "Stack Overflow React"
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <strong className="text-gray-900 dark:text-gray-100">
                  {automationServerAvailable ? '🤖 Multi-Step:' : '📈 Productivity:'}
                </strong>
                <br />
                {automationServerAvailable 
                  ? '"Open Google and search weather", "Go to YouTube and search cats"'
                  : '"Open calendar", "Check email", "Latest tech news"'}
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {automationServerAvailable 
                  ? '🚀 Automation Server Active: Complex multi-step tasks will be performed in a separate browser window with full automation capabilities.'
                  : '💡 Want full automation? Start the automation server: cd src/automation-server && npm install && npm start'}
              </p>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              💡 You can combine tasks: "Open Google and search for weather forecast"
            </p>
          </div>
        )}
      </div>

      {/* Task Progress (1-2 lines above input) */}
      {(taskProgress.length > 0 || isProcessing) && (
        <div className="px-4 py-2 border-t bg-blue-50 dark:bg-blue-950/30">
          {isProcessing && taskProgress.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Analyzing your request...</span>
            </div>
          )}
          {taskProgress.map((step, index) => (
            <div key={index} className="text-sm text-blue-600 dark:text-blue-400 truncate">
              {step}
            </div>
          ))}
        </div>
      )}

      {/* Bottom Input Area */}
      <div className="p-4 border-t bg-white dark:bg-gray-900 shadow-lg">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Agent</span>
          </div>
          
          <div className="flex-1 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tell me what to do and I'll navigate there (e.g., 'open google and search facebook', 'go to youtube', 'open gmail')"
              className="flex-1 px-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              disabled={isProcessing || isExecutingTask}
              autoComplete="off"
              spellCheck="false"
            />
            <Button
              onClick={handleSubmit}
              disabled={!inputValue.trim() || isProcessing || isExecutingTask}
              size="sm"
              className="h-10 w-10 rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg"
            >
              {isProcessing || isExecutingTask ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {currentModel?.name} • {currentModel?.speed}
          </div>
        </div>
        
        {/* Model Information Panel */}
        {currentModel && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {currentModel.name}
                  </h3>
                  {!currentModel.available && (
                    <Badge variant="destructive" className="text-[10px] px-2 py-0">
                      Not Available
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {currentModel.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="outline" className="text-[10px] px-2 py-0">
                    Speed: {currentModel.speed}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] px-2 py-0">
                    Accuracy: {currentModel.accuracy}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] px-2 py-0">
                    Cost: {currentModel.cost}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <strong>Limits:</strong> {currentModel.limits}
            </div>
            {!currentModel.available && (
              <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded border border-yellow-200 dark:border-yellow-800">
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  <strong>⚠️ Not Configured:</strong> This model requires API key setup. Only Gemini models are currently available.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
