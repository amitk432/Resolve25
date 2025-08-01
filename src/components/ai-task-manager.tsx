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
  Loader2,
  Download,
  Eye,
  EyeOff,
  History,
  Brain
} from 'lucide-react';
import AutomationClient, { BrowserAction as AutomationAction, TaskStatus } from '@/automation-server/client';
import { cn } from '@/lib/utils';
import AIAnalysisService, { TaskAnalysis, BrowserActionPlan, AppActionPlan, SessionContext } from '@/services/ai-analysis-browser';
import { optimizeBrowserWindow } from '@/utils/browser-optimize';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isProcessing?: boolean;
  requiresBrowser?: boolean;
  taskStatus?: 'pending' | 'executing' | 'completed' | 'failed' | 'running';
  steps?: string[];
  model?: string;
  actions?: BrowserAction[];
  context?: SessionContext;
  analysis?: TaskAnalysis;
}

interface BrowserAction {
  type: 'navigate' | 'search' | 'click' | 'scroll' | 'back' | 'forward';
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
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'Most advanced multimodal model with enhanced reasoning and 2M token context',
    speed: 'Medium',
    accuracy: 'High',
    cost: 'Medium',
    limits: '2 RPM, 50K TPM, 100 RPD - Enhanced capabilities with multimodal understanding',
    available: true
  },
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

  // Convert AI-generated BrowserActionPlan to BrowserAction
  const convertToBrowserActions = (plans: BrowserActionPlan[]): BrowserAction[] => {
    return plans.map(plan => ({
      type: plan.action as any,
      target: plan.target,
      value: plan.value,
      description: plan.description
    }));
  };

export default function AITaskManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExecutingTask, setIsExecutingTask] = useState(false);
  const [taskProgress, setTaskProgress] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-pro');
  const [automationServerAvailable, setAutomationServerAvailable] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [sessionContext, setSessionContext] = useState<SessionContext>({
    recentActions: [],
    browserState: 'idle'
  });
  const [sessionLogs, setSessionLogs] = useState<Array<{
    timestamp: Date;
    action: string;
    status: 'success' | 'error' | 'info';
    details?: string;
  }>>([]);
  const [showLogs, setShowLogs] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const automationClient = useRef<AutomationClient>(new AutomationClient());
  const aiAnalysis = useRef<AIAnalysisService>(new AIAnalysisService(selectedModel));

  const currentModel = AI_MODELS.find(m => m.id === selectedModel);

  // Update AI analysis service when model changes
  useEffect(() => {
    aiAnalysis.current = new AIAnalysisService(selectedModel);
  }, [selectedModel]);

  // Check automation server availability on mount
  useEffect(() => {
    const checkServerHealth = async () => {
      const isHealthy = await automationClient.current.isServerHealthy();
      setAutomationServerAvailable(isHealthy);
    };
    
    checkServerHealth();
    // Check every 30 seconds
    const interval = setInterval(checkServerHealth, 30000);
    
    // Initialize session ID
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    
    // Auto-focus input on mount and optimize browser window
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    // Optimize browser window for better experience
    optimizeBrowserWindow();
    
    return () => {
      clearInterval(interval);
      automationClient.current.cleanup();
    };
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, taskProgress]);

  // Convert local BrowserAction to AutomationAction
  const convertToAutomationActions = (actions: BrowserAction[]): AutomationAction[] => {
    return actions.map(action => ({
      type: action.type as any,
      target: action.target,
      value: action.value,
      description: action.description
    }));
  };

  // Logging functions
  const addLog = (action: string, status: 'success' | 'error' | 'info', details?: string) => {
    setSessionLogs(prev => [...prev, {
      timestamp: new Date(),
      action,
      status,
      details
    }]);
  };

  const updateSessionContext = (updates: Partial<SessionContext>) => {
    setSessionContext(prev => ({
      ...prev,
      ...updates,
      recentActions: [
        ...prev.recentActions.slice(-4), // Keep last 5 actions
        updates.recentActions?.[0] || ''
      ].filter(Boolean)
    }));
  };

  const saveSessionData = () => {
    const sessionData = {
      sessionId,
      timestamp: new Date().toISOString(),
      chatHistory: chatHistory.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString()
      })),
      sessionLogs: sessionLogs.map(log => ({
        ...log,
        timestamp: log.timestamp.toISOString()
      })),
      sessionContext,
      deviceInfo: {
        userAgent: navigator.userAgent,
        testDevices: ['MacBook Air M2', 'iPhone 13', 'Oppo A78 5G'] // Based on user's testing setup
      }
    };

    const dataStr = JSON.stringify(sessionData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-task-session-${sessionId.split('_')[1]?.substring(0, 8)}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    addLog('Session data exported', 'success', `Downloaded session data for ${sessionId}`);
    toast({
      title: "Session Saved",
      description: "Session data has been downloaded successfully.",
    });
  };

  const executeAgenticTask = async (prompt: string, actions: BrowserAction[], analysis?: TaskAnalysis) => {
    const messageId = `msg_${Date.now()}`;
    
    // Log task start
    addLog(`Task Started: "${prompt}"`, 'info', `Parsed ${actions.length} actions`);
    
    // Add user message to chat history
    const userMessage: ChatMessage = {
      id: messageId + '_user',
      role: 'user',
      content: prompt,
      timestamp: new Date(),
      model: selectedModel,
      actions,
      context: { ...sessionContext }
    };
    
    setChatHistory(prev => [...prev, userMessage]);
    
    // Add assistant processing message
    const assistantMessage: ChatMessage = {
      id: messageId + '_assistant',
      role: 'assistant',
      content: 'Processing your request...',
      timestamp: new Date(),
      isProcessing: true,
      taskStatus: 'pending',
      steps: [],
      model: selectedModel,
      context: { ...sessionContext }
    };
    
    setChatHistory(prev => [...prev, assistantMessage]);
    
    setIsExecutingTask(true);
    setTaskProgress([]);

    // Update session context based on prompt
    const contextUpdate: Partial<SessionContext> = {
      recentActions: [prompt]
    };
    
    // Determine browser state based on actions
    if (actions.some(a => a.type === 'search')) {
      contextUpdate.browserState = 'search_results';
      contextUpdate.lastSearchTerm = actions.find(a => a.type === 'search')?.value;
    } else if (actions.some(a => a.type === 'navigate' && a.target)) {
      contextUpdate.browserState = 'website';
      contextUpdate.currentPage = actions.find(a => a.type === 'navigate')?.target;
      contextUpdate.lastVisitedSite = new URL(actions.find(a => a.type === 'navigate')?.target || '').hostname;
    }
    
    updateSessionContext(contextUpdate);

    // Try automation server first if available
    if (automationServerAvailable) {
      try {
        addLog('Using automation server', 'info', 'Executing task via Playwright automation');
        
        const automationActions = convertToAutomationActions(actions);
        const taskId = await automationClient.current.executeTaskInSession(automationActions, sessionId);
        setCurrentTaskId(taskId);
        
        // Update assistant message with task started
        setChatHistory(prev => prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: 'Task started in browser window...', taskStatus: 'executing' }
            : msg
        ));
        
        addLog('Browser automation started', 'success', `Task ID: ${taskId}`);
        
        // Poll for progress
        automationClient.current.pollTaskProgress(
          taskId,
          (progress) => {
            setTaskProgress(progress);
            addLog('Progress update', 'info', progress[progress.length - 1]);
            
            // Update assistant message with latest progress
            setChatHistory(prev => prev.map(msg => 
              msg.id === assistantMessage.id 
                ? { ...msg, content: progress[progress.length - 1] || 'Processing...', steps: progress }
                : msg
            ));
          },
          (status) => {
            const finalContent = status.status === 'completed' 
              ? '✅ Task completed successfully! Check your browser window.'
              : `❌ Task failed: ${status.error}`;
              
            addLog('Task completed', status.status === 'completed' ? 'success' : 'error', 
              status.status === 'completed' ? 'Browser automation successful' : status.error);
            
            setChatHistory(prev => prev.map(msg => 
              msg.id === assistantMessage.id 
                ? { 
                    ...msg, 
                    content: finalContent,
                    isProcessing: false,
                    taskStatus: status.status,
                    steps: status.progress?.map(p => p.message) || []
                  }
                : msg
            ));
            
            setTimeout(() => {
              setTaskProgress([]);
              setIsExecutingTask(false);
              setCurrentTaskId(null);
            }, 2000);
          }
        );
        
        return;
      } catch (error) {
        console.error('Automation server failed:', error);
        addLog('Automation server failed', 'error', `${error}`);
        
        setChatHistory(prev => prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { 
                ...msg, 
                content: `❌ Automation server failed: ${error}. Falling back to direct navigation...`,
                isProcessing: false,
                taskStatus: 'failed'
              }
            : msg
        ));
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Fallback to direct navigation
    addLog('Using direct navigation fallback', 'info', 'Automation server not available');
    
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      const stepMessage = `Step ${i + 1}/${actions.length}: ${action.description}`;
      
      setTaskProgress([stepMessage]);
      addLog(`Executing step ${i + 1}`, 'info', action.description);
      
      setChatHistory(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { ...msg, content: stepMessage }
          : msg
      ));
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      switch (action.type) {
        case 'navigate':
          if (action.target) {
            try {
              addLog('Navigation attempt', 'info', `Navigating to ${action.target}`);
              window.location.href = action.target;
              return;
            } catch (error) {
              addLog('Navigation failed', 'error', `Error navigating to ${action.target}: ${error}`);
              setTaskProgress([`❌ Error navigating to ${action.target}`]);
            }
          }
          break;
          
        case 'search':
          try {
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(action.value || prompt)}`;
            addLog('Search attempt', 'info', `Searching for: ${action.value || prompt}`);
            window.location.href = searchUrl;
            return;
          } catch (error) {
            addLog('Search failed', 'error', `Error performing search: ${error}`);
            setTaskProgress([`❌ Error performing search`]);
          }
          break;
      }
      
      if (i < actions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    addLog('Task completed', 'success', 'All steps executed successfully');
    
    setChatHistory(prev => prev.map(msg => 
      msg.id === assistantMessage.id 
        ? { 
            ...msg, 
            content: '🎉 Task completed!',
            isProcessing: false,
            taskStatus: 'completed'
          }
        : msg
    ));
    
    setTimeout(() => {
      setTaskProgress([]);
      setIsExecutingTask(false);
    }, 2000);
  };

  const handleSubmit = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const prompt = inputValue.trim();
    
    // Log user input
    addLog(`User Input: "${prompt}"`, 'info', 'Starting AI analysis...');
    
    setIsProcessing(true);

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: prompt,
      timestamp: new Date(),
      model: selectedModel,
      context: { ...sessionContext }
    };
    
    setChatHistory(prev => [...prev, userMessage]);

    // Show AI thinking state
    const thinkingMessage: ChatMessage = {
      id: `msg_${Date.now()}_thinking`,
      role: 'assistant',
      content: '🧠 Analyzing your request with AI...',
      timestamp: new Date(),
      model: selectedModel,
      isProcessing: true,
      taskStatus: 'pending'
    };
    
    setChatHistory(prev => [...prev, thinkingMessage]);
    
    try {
      // Get AI analysis
      addLog('AI Analysis', 'info', 'Requesting Gemini AI analysis...');
      const analysis = await aiAnalysis.current.analyzeUserInput(prompt, sessionContext);
      
      addLog('AI Analysis Complete', 'success', 
        `Type: ${analysis.type}, Confidence: ${analysis.confidence}%, Intent: ${analysis.intent}`);

      // Update context
      updateSessionContext({
        recentActions: [prompt]
      });

      if (analysis.type === 'browser' && analysis.parameters?.browserActions) {
        // Handle browser tasks
        const browserActions = convertToBrowserActions(analysis.parameters.browserActions);
        
        // Update session context based on browser actions
        const contextUpdate: Partial<SessionContext> = {
          recentActions: [prompt]
        };
        
        if (browserActions.some(a => a.type === 'search')) {
          contextUpdate.browserState = 'search_results';
          contextUpdate.lastSearchTerm = browserActions.find(a => a.type === 'search')?.value;
        } else if (browserActions.some(a => a.type === 'navigate' && a.target)) {
          contextUpdate.browserState = 'website';
          contextUpdate.currentPage = browserActions.find(a => a.type === 'navigate')?.target;
          contextUpdate.lastVisitedSite = new URL(browserActions.find(a => a.type === 'navigate')?.target || '').hostname;
        }
        
        updateSessionContext(contextUpdate);

        // Remove thinking message and execute browser task
        setChatHistory(prev => prev.filter(msg => msg.id !== thinkingMessage.id));
        
        setTimeout(() => {
          executeAgenticTask(prompt, browserActions, analysis);
          setIsProcessing(false);
        }, 100);

      } else if (analysis.type === 'app_task' && analysis.parameters?.appAction) {
        // Handle app tasks
        const appAction = analysis.parameters.appAction;
        
        addLog('App Task Execution', 'success', 
          `Module: ${appAction.module}, Action: ${appAction.action}`);

        const response = await aiAnalysis.current.generateResponse(prompt, analysis, sessionContext);
        
        // Replace thinking message with response
        setChatHistory(prev => prev.map(msg => 
          msg.id === thinkingMessage.id 
            ? {
                ...msg,
                content: response,
                isProcessing: false,
                taskStatus: 'completed',
                analysis
              }
            : msg
        ));

        setIsProcessing(false);

      } else {
        // Handle conversation, calculation, or other types
        const response = await aiAnalysis.current.generateResponse(prompt, analysis, sessionContext);
        
        addLog('Conversation Response', 'success', 'AI response generated');

        // Replace thinking message with response
        setChatHistory(prev => prev.map(msg => 
          msg.id === thinkingMessage.id 
            ? {
                ...msg,
                content: response,
                isProcessing: false,
                taskStatus: 'completed',
                analysis
              }
            : msg
        ));

        setIsProcessing(false);
      }

    } catch (error) {
      addLog('AI Analysis Failed', 'error', `Error: ${error}`);
      
      // Replace thinking message with error
      setChatHistory(prev => prev.map(msg => 
        msg.id === thinkingMessage.id 
          ? {
              ...msg,
              content: `❌ I encountered an error analyzing your request: "${prompt}". Please try rephrasing your request or try again.`,
              isProcessing: false,
              taskStatus: 'failed'
            }
          : msg
      ));

      setIsProcessing(false);
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
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header - Fixed at top */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">AI Task Manager</h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
              Session: {sessionId.split('_')[1]?.substring(0, 8)}...
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          {/* Mobile Logs Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLogs(!showLogs)}
            className="sm:hidden flex items-center gap-1 h-8 px-2"
          >
            <History className="w-3 h-3" />
            <span className="text-xs">{sessionLogs.length}</span>
          </Button>
          
          {/* Session Logs Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLogs(!showLogs)}
            className="hidden sm:flex items-center gap-1 h-8 px-2"
          >
            {showLogs ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            <span className="text-xs">Logs ({sessionLogs.length})</span>
          </Button>
          
          {/* Save Session */}
          <Button
            variant="ghost"
            size="sm"
            onClick={saveSessionData}
            className="hidden sm:flex items-center gap-1 h-8 px-2"
            disabled={chatHistory.length === 0}
          >
            <Download className="w-3 h-3" />
            <span className="text-xs">Save</span>
          </Button>
          
          {/* Server Status */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${automationServerAvailable ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
              {automationServerAvailable ? 'Server Active' : 'Direct Mode'}
            </span>
          </div>
              
          {/* Model Selection */}
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-[160px] sm:w-[200px] h-8 sm:h-9 text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] overflow-y-auto">
              {AI_MODELS.map((model) => (
                <SelectItem 
                  key={model.id} 
                  value={model.id}
                  disabled={!model.available}
                  className="focus:bg-accent focus:text-accent-foreground"
                >
                  <span className={`text-sm font-medium ${!model.available ? 'text-gray-400' : ''}`}>
                    {model.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chat History - Scrollable middle section */}
      <div className="flex-1 overflow-hidden flex">
        {/* Main Chat Area */}
        <div className={`${showLogs ? 'flex-1' : 'w-full'} overflow-y-auto bg-gray-50 dark:bg-gray-900 transition-all duration-300`}>
          <div className="max-w-4xl mx-auto p-4">
          {chatHistory.length === 0 ? (
            // Welcome message when no chat history
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                AI Task Assistant
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                I can help you automate web tasks. Start a conversation below!
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm max-w-2xl mx-auto">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                  <strong className="text-gray-900 dark:text-gray-100">🌐 Navigate:</strong>
                  <br />
                  "Open Google", "Go to YouTube"
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                  <strong className="text-gray-900 dark:text-gray-100">🔍 Search:</strong>
                  <br />
                  "Search for AI news"
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                  <strong className="text-gray-900 dark:text-gray-100">� Research:</strong>
                  <br />
                  "Wikipedia machine learning"
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                  <strong className="text-gray-900 dark:text-gray-100">🤖 Multi-Step:</strong>
                  <br />
                  "Open Google and search cats"
                </div>
              </div>
            </div>
          ) : (
            // Chat messages
            <div className="space-y-4">
              {chatHistory.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg px-4 py-3 ${
                    message.role === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                  }`}>
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          <Bot className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {currentModel?.name}
                        </span>
                        {message.analysis && (
                          <div className="flex items-center gap-1">
                            <Brain className="w-3 h-3 text-purple-500" />
                            <span className="text-xs text-purple-600 dark:text-purple-400">
                              {message.analysis.confidence}% confident
                            </span>
                          </div>
                        )}
                        {message.isProcessing && (
                          <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                        )}
                      </div>
                    )}
                    
                    <div className={`text-sm ${message.role === 'user' ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                      {message.content}
                    </div>
                    
                    {message.steps && message.steps.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                        {message.steps.map((step, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                            {step}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Current task progress */}
              {taskProgress.length > 0 && (
                <div className="flex justify-start">
                  <div className="max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg px-4 py-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Processing...</span>
                    </div>
                    {taskProgress.map((step, idx) => (
                      <div key={idx} className="text-sm text-blue-600 dark:text-blue-400 mb-1">
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Auto-scroll anchor */}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>
      </div>
      
      {/* Logs Panel - Collapsible Side Panel */}
      {showLogs && (
        <div className="w-full sm:w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Session Logs</h3>
                <Badge variant="secondary" className="text-xs">
                  {sessionLogs.length}
                </Badge>
              </div>
              {/* Mobile close button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLogs(false)}
                className="sm:hidden h-6 w-6 p-0"
              >
                <EyeOff className="w-3 h-3" />
              </Button>
            </div>
            
            {sessionLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                No logs yet. Start a task to see activity logs.
              </div>
            ) : (
              <div className="space-y-2">
                {sessionLogs.map((log, idx) => (
                  <div key={idx} className="text-xs border border-gray-200 dark:border-gray-600 rounded p-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${
                        log.status === 'success' ? 'bg-green-500' : 
                        log.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                      }`}></div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {log.action}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 ml-auto">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    {log.details && (
                      <div className="text-gray-600 dark:text-gray-400 pl-4">
                        {log.details}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Context Information */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-2">Session Context</h4>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <div>State: <span className="font-mono text-blue-600 dark:text-blue-400">{sessionContext.browserState}</span></div>
                {sessionContext.lastSearchTerm && (
                  <div>Last Search: <span className="font-mono text-green-600 dark:text-green-400">{sessionContext.lastSearchTerm}</span></div>
                )}
                {sessionContext.currentPage && (
                  <div>Current Page: <span className="font-mono text-purple-600 dark:text-purple-400 break-all">{sessionContext.currentPage}</span></div>
                )}
                {sessionContext.recentActions.length > 0 && (
                  <div>
                    Recent Actions:
                    <div className="ml-2 mt-1">
                      {sessionContext.recentActions.slice(-3).map((action, idx) => (
                        <div key={idx} className="font-mono text-orange-600 dark:text-orange-400 truncate">
                          • {action}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

      {/* Bottom Input Area - Fixed */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="p-4">
          <div className="flex items-center gap-3 max-w-4xl mx-auto">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
            </div>
            
            <div className="flex-1 flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything! I'll analyze and understand what you need..."
                className="flex-1 px-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                disabled={isProcessing || isExecutingTask}
                autoComplete="off"
                spellCheck="false"
              />
              <Button
                onClick={handleSubmit}
                disabled={!inputValue.trim() || isProcessing || isExecutingTask}
                size="sm"
                className="h-10 w-10 rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg flex-shrink-0"
              >
                {isProcessing || isExecutingTask ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
