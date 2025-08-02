/**
 * Integrated AI Task Manager with Embedded Browser
 * 
 * This component provides a director.ai-inspired interface with:
 * - Embedded browser iframe for direct web interaction
 * - AI-powered task automation without backend dependency
 * - Direct web API calls and DOM manipulation
 * - Seamless task execution and monitoring
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Send,
  Bot,
  Loader2,
  Globe,
  Play,
  Pause,
  Square,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  Home,
  Search,
  Star,
  Eye,
  EyeOff,
  Settings,
  Monitor,
  Smartphone,
  Tablet,
  Maximize2,
  Minimize2,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import IntegratedAIAnalysisService, { IntegratedTaskAnalysis, TaskContext } from '@/services/integrated-ai-analysis';
import BrowserAutomationService, { BrowserAutomationAction, BrowserAutomationResult } from '@/services/browser-automation';

// Task execution status
type TaskStatus = 'idle' | 'analyzing' | 'executing' | 'completed' | 'failed' | 'paused';

// Browser viewport sizes
const VIEWPORT_SIZES = {
  desktop: { width: '100%', height: '600px', label: 'Desktop' },
  tablet: { width: '768px', height: '600px', label: 'Tablet' },
  mobile: { width: '375px', height: '600px', label: 'Mobile' }
};

// Starter prompts inspired by director.ai
const STARTER_PROMPTS = [
  {
    title: 'Search and summarize',
    description: 'Search for information about a topic and provide a summary',
    prompt: 'Search Google for the latest AI developments and summarize the top 3 articles'
  },
  {
    title: 'Product research',
    description: 'Research a product on e-commerce sites and compare prices',
    prompt: 'Search Amazon for iPhone 16 Pro and show me the price and reviews'
  },
  {
    title: 'Social media monitoring',
    description: 'Check social media trends and engagement',
    prompt: 'Go to Twitter/X and show me trending topics in technology'
  },
  {
    title: 'News aggregation',
    description: 'Collect news from multiple sources on a specific topic',
    prompt: 'Visit BBC News and CNN to get the latest headlines about climate change'
  },
  {
    title: 'Job search',
    description: 'Search for job opportunities on job boards',
    prompt: 'Search LinkedIn for software engineer jobs in San Francisco with React experience'
  },
  {
    title: 'Travel planning',
    description: 'Research travel destinations and booking options',
    prompt: 'Search Google Flights for round-trip tickets from NYC to Tokyo next month'
  }
];

interface TaskStep {
  id: string;
  description: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  progress: number;
  result?: string;
  timestamp: Date;
}

interface BrowserState {
  url: string;
  title: string;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  favicon?: string;
}

export function IntegratedAITaskManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Core state
  const [taskInput, setTaskInput] = useState('');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('idle');
  const [currentTask, setCurrentTask] = useState<string>('');
  const [taskSteps, setTaskSteps] = useState<TaskStep[]>([]);
  const [progress, setProgress] = useState(0);
  
  // Browser state
  const [browserState, setBrowserState] = useState<BrowserState>({
    url: 'https://www.google.com',
    title: 'Google',
    loading: false,
    canGoBack: false,
    canGoForward: false
  });
  const [viewportSize, setViewportSize] = useState<keyof typeof VIEWPORT_SIZES>('desktop');
  const [showBrowser, setShowBrowser] = useState(true);
  
  // AI service
  const [aiService] = useState(() => new IntegratedAIAnalysisService());
  const [automationService] = useState(() => new BrowserAutomationService());
  const [taskContext, setTaskContext] = useState<TaskContext>({
    browserHistory: [],
    recentSearches: [],
    userPreferences: {
      searchEngine: 'google',
      language: 'en',
      region: 'US'
    }
  });
  
  // Refs
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  
  // Execute AI-generated browser actions
  const executeBrowserAction = useCallback(async (action: BrowserAutomationAction): Promise<string> => {
    const result = await automationService.executeAction(action);
    return result.message;
  }, [automationService]);

  // Execute a complete task
  const executeTask = useCallback(async (taskDescription: string) => {
    setTaskStatus('analyzing');
    setCurrentTask(taskDescription);
    setTaskSteps([]);
    setProgress(0);

    try {
      // Set up automation service with current iframe
      if (iframeRef.current) {
        automationService.setIframe(iframeRef.current);
      }

      // Analyze task with AI
      const analysis = await aiService.analyzeTask(taskDescription);
      
      if (analysis.type === 'browser' && analysis.actions.length > 0) {
        setTaskStatus('executing');
        const actions = analysis.actions;
        
        // Create task steps
        const steps: TaskStep[] = actions.map((action: BrowserAutomationAction, index: number) => ({
          id: `step-${index}`,
          description: action.description,
          status: 'pending',
          progress: 0,
          timestamp: new Date()
        }));
        setTaskSteps(steps);
        
        // Execute each action
        for (let i = 0; i < actions.length; i++) {
          const action = actions[i];
          
          // Update step status
          setTaskSteps(prev => prev.map((step, idx) => 
            idx === i ? { ...step, status: 'executing' } : step
          ));
          
          // Execute action
          const result = await executeBrowserAction(action);
          
          // Update step with result
          setTaskSteps(prev => prev.map((step, idx) => 
            idx === i ? { 
              ...step, 
              status: 'completed', 
              progress: 100,
              result 
            } : step
          ));
          
          // Update overall progress
          setProgress(((i + 1) / actions.length) * 100);
          
          // Add delay between actions
          if (i < actions.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
        
        setTaskStatus('completed');
        toast({
          title: "Task Completed",
          description: "Your automation task has been executed successfully.",
        });
        
      } else {
        // Handle non-browser tasks
        setTaskSteps([{
          id: 'response',
          description: 'AI Response',
          status: 'completed',
          progress: 100,
          result: analysis.intent,
          timestamp: new Date()
        }]);
        
        setProgress(100);
        setTaskStatus('completed');
      }
      
    } catch (error) {
      console.error('Task execution error:', error);
      setTaskStatus('failed');
      toast({
        title: "Task Failed",
        description: error instanceof Error ? error.message : "An error occurred while executing the task.",
        variant: "destructive"
      });
    }
  }, [aiService, automationService, executeBrowserAction, toast]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskInput.trim() && taskStatus === 'idle') {
      executeTask(taskInput.trim());
    }
  };

  // Handle iframe URL changes
  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      try {
        const currentUrl = iframe.src;
        setBrowserState(prev => ({
          ...prev,
          url: currentUrl,
          loading: false,
          title: 'Page Loaded'
        }));
        
        setTaskContext(prev => ({
          ...prev,
          currentUrl: currentUrl,
          browserHistory: [...prev.browserHistory, currentUrl].slice(-20)
        }));
      } catch (error) {
        // Handle cross-origin restrictions
        setBrowserState(prev => ({ ...prev, loading: false }));
      }
    }
  }, []);

  // Browser navigation functions
  const navigateToUrl = (url: string) => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    if (iframeRef.current) {
      iframeRef.current.src = url;
      setBrowserState(prev => ({ ...prev, loading: true }));
    }
  };

  const refreshPage = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
      setBrowserState(prev => ({ ...prev, loading: true }));
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b bg-white dark:bg-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Task Manager</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Automate web tasks with AI-powered browser control
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBrowser(!showBrowser)}
            >
              {showBrowser ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showBrowser ? 'Hide Browser' : 'Show Browser'}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Task Control */}
        <div className="w-96 border-r bg-white dark:bg-gray-800 flex flex-col">
          {/* Task Input */}
          <div className="p-4 border-b">
            <form onSubmit={handleSubmit}>
              <div className="space-y-3">
                <Textarea
                  ref={textAreaRef}
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  placeholder="What task do you want to automate?"
                  className="min-h-[100px] resize-none"
                  disabled={taskStatus !== 'idle'}
                />
                
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={!taskInput.trim() || taskStatus !== 'idle'}
                    className="flex-1"
                  >
                    {taskStatus === 'analyzing' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {taskStatus === 'executing' && <Play className="w-4 h-4 mr-2" />}
                    {taskStatus === 'idle' && <Send className="w-4 h-4 mr-2" />}
                    {taskStatus === 'idle' ? 'Execute Task' : 
                     taskStatus === 'analyzing' ? 'Analyzing...' :
                     taskStatus === 'executing' ? 'Executing...' : 'Execute Task'}
                  </Button>
                  
                  {taskStatus !== 'idle' && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setTaskStatus('idle');
                        setCurrentTask('');
                        setTaskSteps([]);
                        setProgress(0);
                      }}
                    >
                      <Square className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Current Task Status */}
          {currentTask && (
            <div className="p-4 border-b">
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium text-sm text-gray-900 dark:text-white">Current Task</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{currentTask}</p>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Progress</span>
                    <span className="text-gray-900 dark:text-white">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              </div>
            </div>
          )}

          {/* Task Steps */}
          <ScrollArea className="flex-1 p-4">
            {taskSteps.length > 0 ? (
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-gray-900 dark:text-white">Execution Steps</h3>
                {taskSteps.map((step, index) => (
                  <Card key={step.id} className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {step.status === 'executing' && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                        {step.status === 'completed' && <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>}
                        {step.status === 'failed' && <div className="w-4 h-4 rounded-full bg-red-500" />}
                        {step.status === 'pending' && <div className="w-4 h-4 rounded-full border-2 border-gray-300" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Step {index + 1}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {step.description}
                        </p>
                        {step.result && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-2 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                            {step.result}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-gray-900 dark:text-white">Starter Tasks</h3>
                {STARTER_PROMPTS.map((prompt, index) => (
                  <Card 
                    key={index}
                    className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setTaskInput(prompt.prompt)}
                  >
                    <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                      {prompt.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {prompt.description}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Right Panel - Embedded Browser */}
        {showBrowser && (
          <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
            {/* Browser Controls */}
            <div className="border-b p-3">
              <div className="flex items-center gap-2 mb-3">
                <Button variant="outline" size="sm" onClick={() => iframeRef.current?.contentWindow?.history.back()}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => iframeRef.current?.contentWindow?.history.forward()}>
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={refreshPage}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
                
                <div className="flex-1">
                  <Input
                    value={browserState.url}
                    onChange={(e) => setBrowserState(prev => ({ ...prev, url: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && navigateToUrl(browserState.url)}
                    placeholder="Enter URL..."
                    className="text-sm"
                  />
                </div>
                
                <Button variant="outline" size="sm" onClick={() => navigateToUrl(browserState.url)}>
                  <Globe className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {browserState.loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {browserState.title}
                  </span>
                </div>
                
                <div className="flex gap-1">
                  {Object.entries(VIEWPORT_SIZES).map(([key, size]) => (
                    <Button
                      key={key}
                      variant={viewportSize === key ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewportSize(key as keyof typeof VIEWPORT_SIZES)}
                    >
                      {key === 'desktop' && <Monitor className="w-4 h-4" />}
                      {key === 'tablet' && <Tablet className="w-4 h-4" />}
                      {key === 'mobile' && <Smartphone className="w-4 h-4" />}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Browser Iframe */}
            <div className="flex-1 flex items-center justify-center p-4">
              <div 
                className="border rounded-lg overflow-hidden shadow-lg"
                style={{
                  width: VIEWPORT_SIZES[viewportSize].width,
                  height: VIEWPORT_SIZES[viewportSize].height,
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}
              >
                <iframe
                  ref={iframeRef}
                  src={browserState.url}
                  className="w-full h-full"
                  onLoad={handleIframeLoad}
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-navigation"
                  title="Embedded Browser"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default IntegratedAITaskManager;
