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
  User, 
  ExternalLink, 
  Loader2, 
  Copy,
  Check,
  Sparkles,
  Globe,
  RefreshCw,
  Home,
  Shield,
  Maximize2,
  Minimize2,
  Brain
} from 'lucide-react';
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
  cost: 'Low' | 'Medium' | 'High';
}

// Available AI Models
const AI_MODELS: AIModel[] = [
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: 'Most capable model for complex tasks',
    speed: 'Medium',
    accuracy: 'High',
    cost: 'High'
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fast and efficient for most tasks',
    speed: 'Fast',
    accuracy: 'Medium',
    cost: 'Low'
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    description: 'Google\'s advanced reasoning model',
    speed: 'Medium',
    accuracy: 'High',
    cost: 'Medium'
  },
  {
    id: 'claude-3',
    name: 'Claude 3 Sonnet',
    description: 'Excellent for analysis and research',
    speed: 'Medium',
    accuracy: 'High',
    cost: 'Medium'
  }
];

// Function to determine if a prompt requires browser execution
const shouldUseBrowser = (prompt: string): boolean => {
  const browserKeywords = [
    'search', 'browse', 'website', 'web', 'find online', 
    'look up', 'research', 'visit', 'open', 'navigate to', 'go to',
    'wikipedia', 'github', 'stackoverflow'
  ];
  
  return browserKeywords.some(keyword => 
    prompt.toLowerCase().includes(keyword.toLowerCase())
  );
};

// Function to parse user intent and generate action plan
const parseUserIntent = (prompt: string): BrowserAction[] => {
  const actions: BrowserAction[] = [];
  const lowerPrompt = prompt.toLowerCase();

  if (lowerPrompt.includes('wikipedia')) {
    actions.push({
      type: 'navigate',
      target: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(prompt)}`,
      description: 'Searching Wikipedia for your query'
    });
  } else if (lowerPrompt.includes('github')) {
    actions.push({
      type: 'navigate',
      target: `https://github.com/search?q=${encodeURIComponent(prompt)}`,
      description: 'Searching GitHub repositories'
    });
  } else if (lowerPrompt.includes('stackoverflow')) {
    actions.push({
      type: 'navigate',
      target: `https://stackoverflow.com/search?q=${encodeURIComponent(prompt)}`,
      description: 'Searching Stack Overflow for solutions'
    });
  } else {
    // Use DuckDuckGo as it's more iframe-friendly
    actions.push({
      type: 'search',
      value: prompt,
      description: 'Performing web search with DuckDuckGo'
    });
  }

  return actions;
};

export default function AITaskManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI agent. I can perform web tasks in the browser panel. What would you like me to do?",
      timestamp: new Date(),
      model: 'gpt-3.5-turbo'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState('https://html.duckduckgo.com/html/');
  const [browserVisible, setBrowserVisible] = useState(true);
  const [isExecutingTask, setIsExecutingTask] = useState(false);
  const [taskProgress, setTaskProgress] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const currentModel = AI_MODELS.find(m => m.id === selectedModel);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const executeAgenticTask = async (prompt: string, actions: BrowserAction[]) => {
    setIsExecutingTask(true);
    setTaskProgress([]);

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      
      // Update progress
      setTaskProgress(prev => [...prev, `Step ${i + 1}: ${action.description}`]);
      
      // Simulate action execution time based on model speed
      const delay = currentModel?.speed === 'Fast' ? 800 : currentModel?.speed === 'Medium' ? 1200 : 1800;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Execute the action
      switch (action.type) {
        case 'navigate':
          if (action.target) {
            setCurrentUrl(action.target);
            setTaskProgress(prev => [...prev, `✅ Navigated to ${action.target}`]);
          }
          break;
          
        case 'search':
          const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(action.value || prompt)}`;
          setCurrentUrl(searchUrl);
          setTaskProgress(prev => [...prev, `✅ Searched for: ${action.value || prompt}`]);
          break;
      }
    }
    
    setTaskProgress(prev => [...prev, '🎉 Task completed!']);
    setIsExecutingTask(false);
  };

  const handleSubmit = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
      model: selectedModel
    };

    const needsBrowser = shouldUseBrowser(inputValue.trim());
    const actions = needsBrowser ? parseUserIntent(inputValue.trim()) : [];
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    // Show browser if task needs it
    if (needsBrowser && !browserVisible) {
      setBrowserVisible(true);
    }

    // Create assistant response
    let assistantContent = '';
    
    if (needsBrowser) {
      assistantContent = `I'll perform "${userMessage.content}" using ${currentModel?.name}. Watch the browser panel.`;
      
      // Execute the task
      setTimeout(() => {
        executeAgenticTask(userMessage.content, actions);
      }, 500);
    } else {
      assistantContent = `I can help with web tasks like searching, browsing, research, and more. Try: "search for AI news" or "open Wikipedia".`;
    }

    // Add assistant response
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
        requiresBrowser: needsBrowser,
        taskStatus: needsBrowser ? 'executing' : 'completed',
        model: selectedModel
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsProcessing(false);
    }, 300);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const handleBrowserRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = currentUrl;
    }
  };

  return (
    <div className="flex h-[calc(100vh-180px)] max-w-full mx-auto bg-background">
      {/* Minimal Chat Panel */}
      <div className={cn(
        "flex flex-col transition-all duration-300 border-r bg-card",
        browserVisible ? "w-[400px]" : "w-full"
      )}>
        {/* Compact Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold">AI Agent</h1>
              <p className="text-xs text-muted-foreground">Model: {currentModel?.name}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setBrowserVisible(!browserVisible)}
          >
            {browserVisible ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>

        {/* Model Selection */}
        <div className="p-3 border-b bg-muted/20">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-medium">AI Model</span>
          </div>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AI_MODELS.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{model.name}</span>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        {model.speed}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        {model.accuracy}
                      </Badge>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {currentModel && (
            <p className="text-[10px] text-muted-foreground mt-1">{currentModel.description}</p>
          )}
        </div>

        {/* Task Progress */}
        {isExecutingTask && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 border-b">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Executing...</span>
            </div>
            <div className="space-y-1">
              {taskProgress.slice(-3).map((step, index) => (
                <div key={index} className="text-[10px] text-blue-600 dark:text-blue-400 truncate">
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-2 group",
                  message.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                {message.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                )}
                
                <div
                  className={cn(
                    "max-w-[85%] p-2 rounded-lg relative text-xs",
                    message.role === 'user'
                      ? "bg-blue-500 text-white"
                      : "bg-muted"
                  )}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {message.requiresBrowser && (
                    <div className="flex items-center gap-1 mt-1 opacity-70">
                      <Globe className="w-2 h-2" />
                      <span className="text-[10px]">Browser task</span>
                    </div>
                  )}
                  
                  <button
                    onClick={() => copyToClipboard(message.content, message.id)}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/10"
                  >
                    {copiedMessageId === message.id ? (
                      <Check className="w-2 h-2" />
                    ) : (
                      <Copy className="w-2 h-2" />
                    )}
                  </button>
                </div>

                {message.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <User className="w-3 h-3" />
                  </div>
                )}
              </div>
            ))}
            
            {isProcessing && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <div className="bg-muted p-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="text-xs">Processing...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Compact Input */}
        <div className="p-3 border-t">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="What task should I perform?"
                className="min-h-[36px] max-h-[80px] resize-none text-xs rounded-lg"
                disabled={isProcessing}
              />
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!inputValue.trim() || isProcessing}
              size="sm"
              className="h-9 w-9 rounded-lg bg-blue-500 hover:bg-blue-600"
            >
              <Send className="w-3 h-3" />
            </Button>
          </div>
          <div className="text-[10px] text-muted-foreground mt-1 text-center">
            Try: "search for AI news" or "open Wikipedia"
          </div>
        </div>
      </div>

      {/* Browser Panel */}
      {browserVisible && (
        <div className="flex-1 flex flex-col bg-card">
          {/* Browser Controls */}
          <div className="flex items-center gap-2 p-2 border-b bg-muted/20">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleBrowserRefresh}>
              <RefreshCw className="w-3 h-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0" 
              onClick={() => setCurrentUrl('https://html.duckduckgo.com/html/')}
            >
              <Home className="w-3 h-3" />
            </Button>
            <div className="flex-1 mx-2">
              <div className="flex items-center gap-2 px-2 py-1 bg-background rounded text-xs border">
                <Shield className="w-2 h-2 text-green-500" />
                <span className="truncate">{currentUrl}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              <span className="text-[10px] text-muted-foreground">AI Active</span>
            </div>
          </div>

          {/* Embedded Browser */}
          <div className="flex-1 relative">
            <iframe
              ref={iframeRef}
              src={currentUrl}
              className="w-full h-full border-0"
              sandbox="allow-same-origin allow-scripts allow-forms allow-navigation"
              title="AI Agent Browser"
            />
            {isExecutingTask && (
              <div className="absolute inset-0 bg-blue-500/5 flex items-center justify-center backdrop-blur-[1px]">
                <div className="bg-background/95 p-3 rounded-lg border shadow-lg">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <span className="text-sm font-medium">AI performing task...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
