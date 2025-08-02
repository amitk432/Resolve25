/**
 * Director.ai-inspired AI Task Manager
 * 
 * This component provides a clean, modern interface similar to director.ai with:
 * - Embedded browser in a floating window or sidebar
 * - Clean task input with suggested prompts
 * - Real-time execution tracking
 * - Minimal backend dependency
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Send,
  Loader2,
  Globe,
  Play,
  Square,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  Zap,
  Target,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import IntegratedAIAnalysisService, { IntegratedTaskAnalysis } from '@/services/integrated-ai-analysis';
import BrowserAutomationService, { BrowserAutomationAction, BrowserAutomationResult } from '@/services/browser-automation';

// Task execution status
type TaskStatus = 'idle' | 'analyzing' | 'executing' | 'completed' | 'failed';

// Starter prompts inspired by director.ai
const DIRECTOR_PROMPTS = [
  {
    icon: <Target className="w-4 h-4" />,
    title: 'Market research on Polymarket',
    description: 'Retrieve current Polymarket odds for trending prediction markets',
    prompt: 'Go to Polymarket and get me the current odds for the top 5 trending markets'
  },
  {
    icon: <Zap className="w-4 h-4" />,
    title: 'YC Jobs retrieval',
    description: 'Go to the Y Combinator jobs page and get current listings',
    prompt: 'Go to the Y Combinator jobs page and get me the current job listings on the first page'
  },
  {
    icon: <Globe className="w-4 h-4" />,
    title: 'Product search on Amazon',
    description: 'Search Amazon for products and compare prices',
    prompt: 'Search Amazon for Nintendo Switch OLED console and show me options under $400'
  },
  {
    icon: <Sparkles className="w-4 h-4" />,
    title: 'Flight booking research',
    description: 'Using Google Flights, find and compare flight options',
    prompt: 'Using Google Flights, find me a one way, non-stop flight from San Francisco to Tokyo departing two weeks from now'
  },
  {
    icon: <CheckCircle className="w-4 h-4" />,
    title: 'GitHub repository analysis',
    description: 'Go to a GitHub repo and analyze recent activity',
    prompt: 'Go to the React repository on GitHub and get me the latest pull requests and issues'
  },
  {
    icon: <AlertCircle className="w-4 h-4" />,
    title: 'News aggregation',
    description: 'Collect latest news from multiple sources on a topic',
    prompt: 'Visit BBC News and CNN to get the latest headlines about artificial intelligence'
  }
];

interface ExecutionStep {
  id: string;
  description: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: string;
  timestamp: Date;
  duration?: number;
}

interface BrowserState {
  url: string;
  title: string;
  loading: boolean;
  visible: boolean;
}

export function DirectorAITaskManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Core state
  const [taskInput, setTaskInput] = useState('');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('idle');
  const [currentTask, setCurrentTask] = useState<string>('');
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([]);
  const [progress, setProgress] = useState(0);
  const [analysis, setAnalysis] = useState<IntegratedTaskAnalysis | null>(null);
  
  // Browser state
  const [browserState, setBrowserState] = useState<BrowserState>({
    url: 'https://www.google.com',
    title: 'Google',
    loading: false,
    visible: true
  });
  
  // Services
  const [aiService] = useState(() => new IntegratedAIAnalysisService());
  const [automationService] = useState(() => new BrowserAutomationService());
  
  // Refs
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Setup automation service with iframe
  useEffect(() => {
    if (iframeRef.current) {
      automationService.setIframe(iframeRef.current);
    }
  }, [automationService]);

  // Execute a browser automation action
  const executeAction = useCallback(async (action: BrowserAutomationAction): Promise<BrowserAutomationResult> => {
    const startTime = Date.now();
    const result = await automationService.executeAction(action);
    const duration = Date.now() - startTime;
    
    // Update browser state for navigation actions
    if (action.type === 'navigate' && result.success && action.target) {
      setBrowserState(prev => ({
        ...prev,
        url: action.target || prev.url,
        loading: false
      }));
    }
    
    return { ...result, data: { ...result.data, duration } };
  }, [automationService]);

  // Execute complete task workflow
  const executeTask = useCallback(async (taskDescription: string) => {
    setTaskStatus('analyzing');
    setCurrentTask(taskDescription);
    setExecutionSteps([]);
    setProgress(0);
    setAnalysis(null);

    try {
      // Analyze task with AI
      const taskAnalysis = await aiService.analyzeTask(taskDescription);
      setAnalysis(taskAnalysis);
      
      if (taskAnalysis.warnings && taskAnalysis.warnings.length > 0) {
        toast({
          title: "Analysis Warnings",
          description: taskAnalysis.warnings.join(', '),
          variant: "default"
        });
      }

      if (taskAnalysis.type === 'browser' && taskAnalysis.actions.length > 0) {
        setTaskStatus('executing');
        const actions = taskAnalysis.actions;
        
        // Create execution steps
        const steps: ExecutionStep[] = actions.map((action, index) => ({
          id: `step-${index}`,
          description: action.description,
          status: 'pending',
          timestamp: new Date()
        }));
        setExecutionSteps(steps);
        
        // Execute each action sequentially
        for (let i = 0; i < actions.length; i++) {
          const action = actions[i];
          
          // Update step status to executing
          setExecutionSteps(prev => prev.map((step, idx) => 
            idx === i ? { ...step, status: 'executing' } : step
          ));
          
          // Execute the action
          const startTime = Date.now();
          const result = await executeAction(action);
          const duration = Date.now() - startTime;
          
          // Update step with result
          setExecutionSteps(prev => prev.map((step, idx) => 
            idx === i ? { 
              ...step, 
              status: result.success ? 'completed' : 'failed',
              result: result.message,
              duration
            } : step
          ));
          
          // Update overall progress
          setProgress(((i + 1) / actions.length) * 100);
          
          // Add delay between actions for better UX
          if (i < actions.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }
        
        setTaskStatus('completed');
        toast({
          title: "Task Completed",
          description: `Successfully executed ${actions.length} automation steps.`,
        });
        
      } else if (taskAnalysis.type === 'conversation') {
        // Handle conversational responses
        setExecutionSteps([{
          id: 'conversation',
          description: 'AI Response',
          status: 'completed',
          result: taskAnalysis.intent,
          timestamp: new Date()
        }]);
        
        setProgress(100);
        setTaskStatus('completed');
      }
      
    } catch (error) {
      console.error('Task execution failed:', error);
      setTaskStatus('failed');
      toast({
        title: "Task Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive"
      });
    }
  }, [aiService, executeAction, toast]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskInput.trim() && taskStatus === 'idle') {
      executeTask(taskInput.trim());
    }
  };

  // Handle iframe load events
  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      try {
        setBrowserState(prev => ({
          ...prev,
          loading: false,
          title: 'Page Loaded'
        }));
      } catch (error) {
        setBrowserState(prev => ({ ...prev, loading: false }));
      }
    }
  }, []);

  // Format duration for display
  const formatDuration = (ms?: number) => {
    if (!ms) return '';
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Task Manager
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Automate web tasks with AI-powered browser control
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Task Input and Control */}
          <div className="lg:col-span-1 space-y-6">
            {/* Task Input */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      What would you like to automate?
                    </label>
                    <Textarea
                      ref={textAreaRef}
                      value={taskInput}
                      onChange={(e) => setTaskInput(e.target.value)}
                      placeholder="Describe the task you want to automate..."
                      className="min-h-[120px] resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      disabled={taskStatus !== 'idle'}
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      type="submit" 
                      disabled={!taskInput.trim() || taskStatus !== 'idle'}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
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
                          setExecutionSteps([]);
                          setProgress(0);
                          setAnalysis(null);
                        }}
                        className="px-4"
                      >
                        <Square className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Task Analysis */}
            {analysis && (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Task Analysis</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Type</span>
                      <Badge variant="secondary">{analysis.type}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Confidence</span>
                      <Badge variant={analysis.confidence > 80 ? "default" : "secondary"}>
                        {analysis.confidence}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Complexity</span>
                      <Badge variant="outline">{analysis.complexity}</Badge>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Intent</span>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">{analysis.intent}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Starter Prompts */}
            {taskStatus === 'idle' && !currentTask && (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Starter Prompts</h3>
                  <div className="space-y-3">
                    {DIRECTOR_PROMPTS.map((prompt, index) => (
                      <div
                        key={index}
                        className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        onClick={() => setTaskInput(prompt.prompt)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-blue-500 mt-0.5">
                            {prompt.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                              {prompt.title}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {prompt.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel - Browser and Execution */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Task Status */}
            {currentTask && (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Current Task</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setBrowserState(prev => ({ ...prev, visible: !prev.visible }))}
                    >
                      {browserState.visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {browserState.visible ? 'Hide Browser' : 'Show Browser'}
                    </Button>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{currentTask}</p>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {Math.round(progress)}% complete
                      </span>
                    </div>
                    <Progress value={progress} className="w-full" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Execution Steps */}
            {executionSteps.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Execution Steps</h3>
                  <div className="space-y-3">
                    {executionSteps.map((step, index) => (
                      <div key={step.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <div className="mt-1">
                          {step.status === 'executing' && (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                          )}
                          {step.status === 'completed' && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                          {step.status === 'failed' && (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                          {step.status === 'pending' && (
                            <Clock className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Step {index + 1}: {step.description}
                            </p>
                            {step.duration && (
                              <span className="text-xs text-gray-500">
                                {formatDuration(step.duration)}
                              </span>
                            )}
                          </div>
                          
                          {step.result && (
                            <p className={cn(
                              "text-xs mt-2 p-2 rounded",
                              step.status === 'completed' 
                                ? "text-green-700 bg-green-50 dark:text-green-300 dark:bg-green-900/20"
                                : "text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-900/20"
                            )}>
                              {step.result}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Embedded Browser */}
            {browserState.visible && (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Browser Controls */}
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      
                      <div className="flex-1">
                        <Input
                          value={browserState.url}
                          onChange={(e) => setBrowserState(prev => ({ ...prev, url: e.target.value }))}
                          className="text-sm"
                          placeholder="Enter URL..."
                        />
                      </div>
                      
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Browser Frame */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <iframe
                        ref={iframeRef}
                        src={browserState.url}
                        className="w-full h-[500px]"
                        onLoad={handleIframeLoad}
                        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-navigation"
                        title="Automation Browser"
                      />
                    </div>
                    
                    {browserState.loading && (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading...</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DirectorAITaskManager;
