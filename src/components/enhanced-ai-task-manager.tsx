/**
 * Enhanced AI Task Manager UI Component
 * 
 * This component provides an enhanced user interface with:
 * - Interactive progress indicators
 * - Real-time performance metrics
 * - Customizable user preferences
 * - A/B testing capabilities
 * - Advanced feedback collection
 * - Accessibility improvements
 */

'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Send, 
  Bot, 
  Loader2,
  Download,
  Eye,
  EyeOff,
  History,
  Brain,
  Settings,
  BarChart3,
  Zap,
  Shield,
  Gauge,
  Users,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  Star,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { 
  EnhancedAIAnalysis, 
  PerformanceMonitor, 
  ResourceManager,
  LoadBalancer,
  type PerformanceMetrics,
  type UserFeedback,
  type OptimizationSuggestion,
  type TaskExecutionContext,
  type UserPreferences
} from '@/services/enhanced-ai-performance';

// Enhanced Chat Message Interface
interface EnhancedChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isProcessing?: boolean;
  taskStatus?: 'pending' | 'executing' | 'completed' | 'failed' | 'optimizing';
  steps?: TaskStep[];
  model?: string;
  performanceMetrics?: PerformanceMetrics;
  optimizations?: OptimizationSuggestion[];
  userFeedback?: UserFeedback;
  confidence?: number;
  estimatedDuration?: number;
  actualDuration?: number;
}

interface TaskStep {
  id: string;
  description: string;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  progress?: number;
  subSteps?: TaskStep[];
  metrics?: {
    duration: number;
    resourceUsage: number;
    successRate: number;
  };
}

interface ProgressIndicator {
  taskId: string;
  currentStep: number;
  totalSteps: number;
  overallProgress: number;
  timeElapsed: number;
  estimatedTimeRemaining: number;
  currentOperation: string;
  resourceUsage: {
    cpu: number;
    memory: number;
    network: number;
  };
}

interface UserPreferencesState extends UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  displayDensity: 'compact' | 'comfortable' | 'spacious';
  autoSave: boolean;
}

// Component Props Interface
interface EnhancedAITaskManagerProps {
  onTaskSubmit?: (userInput: string) => Promise<void>;
  onFeedbackSubmit?: (taskId: string, feedback: Omit<UserFeedback, 'taskId'>) => Promise<void>;
  isLoading?: boolean;
  results?: any;
  className?: string;
}

export default function EnhancedAITaskManager({
  onTaskSubmit,
  onFeedbackSubmit,
  isLoading: externalLoading = false,
  results: externalResults,
  className
}: EnhancedAITaskManagerProps = {}) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Core State
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatHistory, setChatHistory] = useState<EnhancedChatMessage[]>([]);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-pro');
  
  // Enhanced State
  const [progressIndicators, setProgressIndicators] = useState<Map<string, ProgressIndicator>>(new Map());
  const [userPreferences, setUserPreferences] = useState<UserPreferencesState>({
    preferredExecutionMode: 'accurate',
    notificationSettings: {
      progressUpdates: true,
      completionAlerts: true,
      errorNotifications: true,
      optimizationSuggestions: true
    },
    privacyLevel: 'balanced',
    accessibilityNeeds: {
      highContrast: false,
      screenReader: false,
      keyboardNavigation: true,
      reducedMotion: false
    },
    theme: 'auto',
    language: 'en',
    displayDensity: 'comfortable',
    autoSave: true
  });
  
  const [performanceMetrics, setPerformanceMetrics] = useState<Map<string, PerformanceMetrics>>(new Map());
  const [realtimeMetrics, setRealtimeMetrics] = useState<PerformanceMetrics | null>(null);
  const [showMetrics, setShowMetrics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [abTestVariant, setAbTestVariant] = useState<'A' | 'B'>('A');
  
  // Service References
  const enhancedAI = useRef<EnhancedAIAnalysis>(new EnhancedAIAnalysis(selectedModel));
  const performanceMonitor = useRef<PerformanceMonitor>(new PerformanceMonitor());
  const resourceManager = useRef<ResourceManager>(new ResourceManager());
  const loadBalancer = useRef<LoadBalancer>(new LoadBalancer());
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Memoized values for performance
  const currentMetrics = useMemo(() => {
    const taskMetrics = Array.from(performanceMetrics.values());
    if (taskMetrics.length === 0) return null;
    
    return {
      averageResponseTime: taskMetrics.reduce((sum, m) => sum + m.responseTime, 0) / taskMetrics.length,
      averageSuccessRate: taskMetrics.reduce((sum, m) => sum + m.successRate, 0) / taskMetrics.length,
      averageSatisfaction: taskMetrics.reduce((sum, m) => sum + m.userSatisfactionScore, 0) / taskMetrics.length,
      totalTasks: taskMetrics.length
    };
  }, [performanceMetrics]);

  // Initialize services and real-time monitoring
  useEffect(() => {
    // Initialize A/B testing
    setAbTestVariant(Math.random() > 0.5 ? 'A' : 'B');
    
    // Start real-time metrics monitoring
    const metricsInterval = setInterval(async () => {
      const currentUsage = await performanceMonitor.current.getCurrentUsage();
      setRealtimeMetrics({
        responseTime: 0,
        executionTime: 0,
        successRate: 1,
        userSatisfactionScore: 5,
        resourceUsage: currentUsage,
        taskComplexity: {
          actionCount: 0,
          requiresAuthentication: false,
          requiresFormInteraction: false,
          crossSiteNavigation: false,
          estimatedDuration: 0
        }
      });
    }, 2000);
    
    // Auto-focus input
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    return () => {
      clearInterval(metricsInterval);
    };
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: userPreferences.accessibilityNeeds.reducedMotion ? 'auto' : 'smooth' });
    }
  }, [chatHistory, userPreferences.accessibilityNeeds.reducedMotion]);

  // Handle external results
  useEffect(() => {
    if (externalResults) {
      const resultMessage: EnhancedChatMessage = {
        id: `msg_${Date.now()}_result`,
        role: 'assistant',
        content: externalResults.success 
          ? `Task completed successfully! ${externalResults.recommendations?.join(' ') || ''}`
          : `Task failed: ${externalResults.error || 'Unknown error'}`,
        timestamp: new Date(),
        taskStatus: externalResults.success ? 'completed' : 'failed',
        performanceMetrics: externalResults.performance,
        confidence: externalResults.success ? 95 : 10
      };
      
      setChatHistory(prev => [...prev, resultMessage]);

      if (externalResults.performance) {
        setPerformanceMetrics(prev => new Map(prev).set(resultMessage.id, externalResults.performance));
      }
    }
  }, [externalResults]);

  // Enhanced task execution with progress tracking
  const executeEnhancedTask = useCallback(async (
    prompt: string,
    taskId = `task_${Date.now()}`
  ) => {
    const startTime = Date.now();
    
    try {
      // Create execution context
      const executionContext: TaskExecutionContext = {
        sessionId: `session_${Date.now()}`,
        userId: user?.id || 'anonymous',
        deviceInfo: {
          type: 'desktop', // Detect from user agent
          os: navigator.platform,
          browser: navigator.userAgent.split(' ').pop() || 'unknown',
          screenResolution: { width: window.screen.width, height: window.screen.height },
          touchCapable: 'ontouchstart' in window,
          performanceClass: navigator.hardwareConcurrency > 4 ? 'high' : 'medium'
        },
        networkConditions: {
          speed: (navigator as any).connection?.effectiveType === '4g' ? 'fast' : 'medium',
          latency: 50, // Estimated
          connectionType: (navigator as any).connection?.type || 'wifi',
          reliability: 0.9
        },
        browserCapabilities: {
          jsEnabled: true,
          cookiesEnabled: navigator.cookieEnabled,
          localStorage: typeof Storage !== 'undefined',
          webGL: !!document.createElement('canvas').getContext('webgl'),
          supportedFeatures: []
        },
        userPreferences
      };

      // Add processing message
      const processingMessage: EnhancedChatMessage = {
        id: `${taskId}_processing`,
        role: 'assistant',
        content: '🧠 Analyzing your request with enhanced AI...',
        timestamp: new Date(),
        isProcessing: true,
        taskStatus: 'pending',
        model: selectedModel,
        steps: [{
          id: 'analysis',
          description: 'Analyzing user input',
          status: 'executing',
          startTime: new Date(),
          progress: 0
        }]
      };
      
      setChatHistory(prev => [...prev, processingMessage]);

      // Initialize progress tracking
      const progressIndicator: ProgressIndicator = {
        taskId,
        currentStep: 0,
        totalSteps: 5,
        overallProgress: 0,
        timeElapsed: 0,
        estimatedTimeRemaining: 30000,
        currentOperation: 'Analyzing request',
        resourceUsage: { cpu: 0, memory: 0, network: 0 }
      };
      
      setProgressIndicators(prev => new Map(prev).set(taskId, progressIndicator));

      // Step 1: Enhanced AI Analysis
      updateProgress(taskId, { currentStep: 1, currentOperation: 'AI Analysis', overallProgress: 20 });
      
      const analysis = await enhancedAI.current.analyzeWithContext(prompt, {
        recentActions: [],
        browserState: 'idle'
      }, executionContext);

      // Step 2: Resource Allocation
      updateProgress(taskId, { currentStep: 2, currentOperation: 'Allocating Resources', overallProgress: 40 });
      
      if (analysis.parameters?.browserActions) {
        const browserInstance = await resourceManager.current.allocateBrowserInstance(
          executionContext.sessionId,
          {
            type: 'standard',
            performance: userPreferences.preferredExecutionMode === 'fast' ? 'high' : 'medium',
            memory: 'unlimited',
            features: ['automation']
          }
        );
      }

      // Step 3: Task Execution
      updateProgress(taskId, { currentStep: 3, currentOperation: 'Executing Task', overallProgress: 60 });
      
      // Simulate task execution with sub-steps
      const steps: TaskStep[] = [];
      if (analysis.parameters?.browserActions) {
        for (let i = 0; i < analysis.parameters.browserActions.length; i++) {
          const action = analysis.parameters.browserActions[i];
          const step: TaskStep = {
            id: `step_${i}`,
            description: action.description,
            status: 'executing',
            startTime: new Date(),
            progress: 0
          };
          
          steps.push(step);
          
          // Update step progress
          for (let progress = 0; progress <= 100; progress += 20) {
            step.progress = progress;
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Update UI
            setChatHistory(prev => prev.map(msg => 
              msg.id === processingMessage.id 
                ? { ...msg, steps: [...steps] }
                : msg
            ));
          }
          
          step.status = 'completed';
          step.endTime = new Date();
          step.metrics = {
            duration: step.endTime.getTime() - step.startTime!.getTime(),
            resourceUsage: Math.random() * 50,
            successRate: 0.95
          };
        }
      }

      // Step 4: Optimization Analysis
      updateProgress(taskId, { currentStep: 4, currentOperation: 'Analyzing Optimizations', overallProgress: 80 });
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 5: Complete
      updateProgress(taskId, { currentStep: 5, currentOperation: 'Task Completed', overallProgress: 100 });
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Record performance metrics
      const metrics: PerformanceMetrics = {
        responseTime: duration,
        executionTime: duration,
        successRate: 0.95,
        userSatisfactionScore: 4.5,
        resourceUsage: realtimeMetrics?.resourceUsage || {
          memoryUsage: 0,
          cpuUsage: 0,
          browserInstances: 1,
          activeConnections: 1,
          cacheHitRate: 0.8
        },
        taskComplexity: {
          actionCount: analysis.parameters?.browserActions?.length || 1,
          requiresAuthentication: false,
          requiresFormInteraction: false,
          crossSiteNavigation: false,
          estimatedDuration: duration
        }
      };

      performanceMonitor.current.recordTaskMetrics(taskId, metrics);
      setPerformanceMetrics(prev => new Map(prev).set(taskId, metrics));

      // Update final message
      const finalMessage: EnhancedChatMessage = {
        ...processingMessage,
        content: analysis.parameters?.response || '✅ Task completed successfully!',
        isProcessing: false,
        taskStatus: 'completed',
        steps,
        performanceMetrics: metrics,
        optimizations: analysis.optimizations,
        confidence: analysis.confidence,
        estimatedDuration: 30000,
        actualDuration: duration
      };

      setChatHistory(prev => prev.map(msg => 
        msg.id === processingMessage.id ? finalMessage : msg
      ));

      // Show optimizations if available
      if (analysis.optimizations && analysis.optimizations.length > 0 && userPreferences.notificationSettings.optimizationSuggestions) {
        showOptimizationSuggestions(analysis.optimizations);
      }

      // Clean up progress indicator
      setTimeout(() => {
        setProgressIndicators(prev => {
          const newMap = new Map(prev);
          newMap.delete(taskId);
          return newMap;
        });
      }, 5000);

    } catch (error) {
      console.error('Enhanced task execution error:', error);
      
      // Update message with error
      setChatHistory(prev => prev.map(msg => 
        msg.id === `${taskId}_processing`
          ? { 
              ...msg, 
              content: `❌ Task failed: ${error}`,
              isProcessing: false,
              taskStatus: 'failed'
            }
          : msg
      ));
      
      if (userPreferences.notificationSettings.errorNotifications) {
        toast({
          title: "Task Failed",
          description: `An error occurred: ${error}`,
          variant: "destructive",
        });
      }
    }
  }, [user, selectedModel, userPreferences, realtimeMetrics, toast]);

  const updateProgress = useCallback((taskId: string, updates: Partial<ProgressIndicator>) => {
    setProgressIndicators(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(taskId) || {
        taskId,
        currentStep: 0,
        totalSteps: 5,
        overallProgress: 0,
        timeElapsed: 0,
        estimatedTimeRemaining: 30000,
        currentOperation: '',
        resourceUsage: { cpu: 0, memory: 0, network: 0 }
      };
      
      newMap.set(taskId, { ...current, ...updates });
      return newMap;
    });
  }, []);

  const showOptimizationSuggestions = useCallback((suggestions: OptimizationSuggestion[]) => {
    const highPriority = suggestions.filter(s => s.priority === 'high');
    if (highPriority.length > 0) {
      toast({
        title: "Performance Optimization Available",
        description: `${highPriority.length} high-priority optimizations found. Check the metrics panel for details.`,
      });
    }
  }, [toast]);

  const handleSubmit = useCallback(async () => {
    if (!inputValue.trim() || isProcessing || externalLoading) return;

    const prompt = inputValue.trim();
    setInputValue('');

    // Use external handler if provided, otherwise use internal
    if (onTaskSubmit) {
      try {
        await onTaskSubmit(prompt);
      } catch (error) {
        console.error('External task submission failed:', error);
        toast({
          title: "Task Failed",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive",
        });
      }
      return;
    }

    // Internal handling
    setIsProcessing(true);

    // Add user message
    const userMessage: EnhancedChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: prompt,
      timestamp: new Date(),
      model: selectedModel
    };
    
    setChatHistory(prev => [...prev, userMessage]);

    try {
      await executeEnhancedTask(prompt);
    } finally {
      setIsProcessing(false);
    }
  }, [inputValue, isProcessing, externalLoading, selectedModel, executeEnhancedTask, onTaskSubmit, toast]);

  const handleFeedback = useCallback((messageId: string, rating: number, feedback: string) => {
    const message = chatHistory.find(m => m.id === messageId);
    if (message && message.performanceMetrics) {
      const userFeedback: UserFeedback = {
        taskId: messageId,
        rating,
        feedback,
        timestamp: new Date(),
        completionTime: message.actualDuration || 0
      };

      enhancedAI.current.addFeedback(messageId, userFeedback);
      
      // Update message with feedback
      setChatHistory(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, userFeedback }
          : msg
      ));

      toast({
        title: "Feedback Recorded",
        description: "Thank you for your feedback! This helps improve the AI.",
      });
    }
  }, [chatHistory, toast]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  // Render Progress Indicator Component
  const ProgressIndicatorComponent = ({ indicator }: { indicator: ProgressIndicator }) => (
    <Card className="mb-4 border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{indicator.currentOperation}</CardTitle>
          <Badge variant="outline" className="text-xs">
            Step {indicator.currentStep}/{indicator.totalSteps}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-2">
          <Progress value={indicator.overallProgress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{Math.round(indicator.overallProgress)}% complete</span>
            <span>{Math.round(indicator.estimatedTimeRemaining / 1000)}s remaining</span>
          </div>
          
          {/* Resource Usage Indicators */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">CPU</div>
              <div className="text-sm font-medium">{Math.round(indicator.resourceUsage.cpu)}%</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Memory</div>
              <div className="text-sm font-medium">{Math.round(indicator.resourceUsage.memory)}%</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Network</div>
              <div className="text-sm font-medium">{Math.round(indicator.resourceUsage.network)}%</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Render Task Steps Component
  const TaskStepsComponent = ({ steps }: { steps: TaskStep[] }) => (
    <div className="space-y-2 mt-4">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center space-x-2 text-sm">
          <div className={cn("w-4 h-4 rounded-full flex items-center justify-center text-xs", {
            'bg-blue-500 text-white': step.status === 'executing',
            'bg-green-500 text-white': step.status === 'completed',
            'bg-red-500 text-white': step.status === 'failed',
            'bg-gray-300 text-gray-600': step.status === 'pending',
            'bg-yellow-500 text-white': step.status === 'skipped'
          })}>
            {step.status === 'executing' && <Loader2 className="w-2 h-2 animate-spin" />}
            {step.status === 'completed' && <CheckCircle className="w-2 h-2" />}
            {step.status === 'failed' && <AlertCircle className="w-2 h-2" />}
            {step.status === 'pending' && <Clock className="w-2 h-2" />}
            {step.status === 'skipped' && '⤴'}
          </div>
          <span className={cn({
            'text-muted-foreground': step.status === 'pending',
            'text-green-600': step.status === 'completed',
            'text-red-600': step.status === 'failed',
            'text-blue-600': step.status === 'executing'
          })}>
            {step.description}
          </span>
          {step.progress !== undefined && step.status === 'executing' && (
            <div className="flex-1 ml-2">
              <Progress value={step.progress} className="h-1" />
            </div>
          )}
          {step.metrics && step.status === 'completed' && (
            <span className="text-xs text-muted-foreground">
              {Math.round(step.metrics.duration)}ms
            </span>
          )}
        </div>
      ))}
    </div>
  );

  // Render Performance Metrics Component
  const PerformanceMetricsComponent = ({ metrics }: { metrics: PerformanceMetrics }) => (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center">
          <BarChart3 className="w-4 h-4 mr-2" />
          Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Response Time</div>
            <div className="font-medium">{Math.round(metrics.responseTime)}ms</div>
          </div>
          <div>
            <div className="text-muted-foreground">Success Rate</div>
            <div className="font-medium">{Math.round(metrics.successRate * 100)}%</div>
          </div>
          <div>
            <div className="text-muted-foreground">Resource Usage</div>
            <div className="font-medium">{Math.round(metrics.resourceUsage.memoryUsage / 1024 / 1024)}MB</div>
          </div>
          <div>
            <div className="text-muted-foreground">Complexity</div>
            <div className="font-medium">{metrics.taskComplexity.actionCount} actions</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Render Optimization Suggestions Component
  const OptimizationSuggestionsComponent = ({ suggestions }: { suggestions: OptimizationSuggestion[] }) => (
    <Card className="mt-4 border-orange-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center text-orange-700">
          <Zap className="w-4 h-4 mr-2" />
          Optimization Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-2">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="p-2 bg-orange-50 rounded text-sm">
              <div className="flex items-center justify-between mb-1">
                <Badge variant={suggestion.priority === 'high' ? 'destructive' : 'outline'} className="text-xs">
                  {suggestion.priority} priority
                </Badge>
                <span className="text-xs text-muted-foreground">
                  +{suggestion.expectedImprovement}% improvement
                </span>
              </div>
              <p className="text-orange-800">{suggestion.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // Render Feedback Component
  const FeedbackComponent = ({ messageId, onFeedback }: { messageId: string; onFeedback: (rating: number, feedback: string) => void }) => {
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [showFeedback, setShowFeedback] = useState(false);

    return (
      <div className="mt-2 pt-2 border-t">
        {!showFeedback ? (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">How was this response?</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFeedback(true)}
              className="h-6 px-2"
            >
              <ThumbsUp className="w-3 h-3 mr-1" />
              Rate
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  key={star}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setRating(star)}
                >
                  <Star className={cn("w-3 h-3", rating >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300")} />
                </Button>
              ))}
            </div>
            <Textarea
              placeholder="Optional feedback..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[60px] text-sm"
            />
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={() => {
                  onFeedback(rating, feedback);
                  setShowFeedback(false);
                  setRating(0);
                  setFeedback('');
                }}
                disabled={rating === 0}
              >
                Submit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFeedback(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("h-screen flex flex-col", {
      'text-lg': userPreferences.displayDensity === 'spacious',
      'text-sm': userPreferences.displayDensity === 'compact'
    })}>
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Enhanced AI Task Manager</h1>
            {abTestVariant === 'B' && (
              <Badge variant="outline" className="text-xs">Enhanced UI</Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Real-time Metrics Display */}
            {realtimeMetrics && (
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Activity className="w-3 h-3" />
                  <span>{Math.round(realtimeMetrics.resourceUsage.cpuUsage)}% CPU</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Gauge className="w-3 h-3" />
                  <span>{Math.round(realtimeMetrics.resourceUsage.memoryUsage / 1024 / 1024)}MB</span>
                </div>
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMetrics(!showMetrics)}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Metrics
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Current Performance Summary */}
        {currentMetrics && (
          <div className="mt-2 grid grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-muted-foreground">Avg Response</div>
              <div className="font-medium">{Math.round(currentMetrics.averageResponseTime)}ms</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">Success Rate</div>
              <div className="font-medium">{Math.round(currentMetrics.averageSuccessRate * 100)}%</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">Satisfaction</div>
              <div className="font-medium">{currentMetrics.averageSatisfaction.toFixed(1)}/5</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">Total Tasks</div>
              <div className="font-medium">{currentMetrics.totalTasks}</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Progress Indicators */}
          {Array.from(progressIndicators.values()).map(indicator => (
            <ProgressIndicatorComponent key={indicator.taskId} indicator={indicator} />
          ))}

          {/* Chat Messages */}
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-4 py-4">
              {chatHistory.map((message) => (
                <div
                  key={message.id}
                  className={cn("flex", {
                    "justify-end": message.role === 'user',
                    "justify-start": message.role === 'assistant'
                  })}
                >
                  <div
                    className={cn("max-w-[80%] rounded-lg p-4", {
                      "bg-primary text-primary-foreground": message.role === 'user',
                      "bg-muted": message.role === 'assistant',
                      "border-2 border-dashed border-primary/50": message.isProcessing
                    })}
                  >
                    <div className="flex items-start space-x-2">
                      {message.role === 'assistant' && (
                        <Bot className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 space-y-2">
                        <div className="prose prose-sm max-w-none">
                          {message.content}
                        </div>

                        {/* Task Status and Steps */}
                        {message.steps && message.steps.length > 0 && (
                          <TaskStepsComponent steps={message.steps} />
                        )}

                        {/* Performance Metrics */}
                        {message.performanceMetrics && !message.isProcessing && (
                          <PerformanceMetricsComponent metrics={message.performanceMetrics} />
                        )}

                        {/* Optimization Suggestions */}
                        {message.optimizations && message.optimizations.length > 0 && (
                          <OptimizationSuggestionsComponent suggestions={message.optimizations} />
                        )}

                        {/* Feedback Component */}
                        {message.role === 'assistant' && !message.isProcessing && !message.userFeedback && (
                          <FeedbackComponent
                            messageId={message.id}
                            onFeedback={(rating, feedback) => handleFeedback(message.id, rating, feedback)}
                          />
                        )}

                        {/* Display existing feedback */}
                        {message.userFeedback && (
                          <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                            <div className="flex items-center space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={cn("w-3 h-3", star <= message.userFeedback!.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300")}
                                />
                              ))}
                              <span className="text-muted-foreground ml-2">
                                {message.userFeedback.feedback}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Confidence and Duration Info */}
                        {message.confidence !== undefined && (
                          <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                            <span>Confidence: {Math.round(message.confidence * 100)}%</span>
                            {message.actualDuration && (
                              <span>Duration: {Math.round(message.actualDuration / 1000)}s</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div ref={chatEndRef} />
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex space-x-2">
              <div className="flex-1">
                <Textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Describe the task you want to automate..."
                  className="min-h-[80px] resize-none"
                  disabled={isProcessing || externalLoading}
                />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!inputValue.trim() || isProcessing || externalLoading}
                size="lg"
                className="px-6"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-4">
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-[200px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                    <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                    <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                    <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                  </SelectContent>
                </Select>
                
                <Badge variant="outline" className="text-xs">
                  {userPreferences.preferredExecutionMode} mode
                </Badge>
              </div>
              
              <div className="text-right">
                Press Enter to send, Shift+Enter for new line
              </div>
            </div>
          </div>
        </div>

        {/* Side Panels */}
        {(showMetrics || showSettings) && (
          <div className="w-80 border-l bg-background/50">
            <Tabs defaultValue={showMetrics ? "metrics" : "settings"} className="h-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="metrics" className="flex-1 p-4 space-y-4">
                <h3 className="font-semibold">Performance Dashboard</h3>
                
                {/* Real-time Metrics */}
                {realtimeMetrics && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Real-time Resources</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>CPU Usage</span>
                          <span>{Math.round(realtimeMetrics.resourceUsage.cpuUsage)}%</span>
                        </div>
                        <Progress value={realtimeMetrics.resourceUsage.cpuUsage} />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Memory</span>
                          <span>{Math.round(realtimeMetrics.resourceUsage.memoryUsage / 1024 / 1024)}MB</span>
                        </div>
                        <Progress value={Math.min(100, (realtimeMetrics.resourceUsage.memoryUsage / 1024 / 1024 / 1024) * 100)} />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Historical Performance */}
                {currentMetrics && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Session Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Tasks Completed</span>
                        <span className="font-medium">{currentMetrics.totalTasks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Response Time</span>
                        <span className="font-medium">{Math.round(currentMetrics.averageResponseTime)}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Success Rate</span>
                        <span className="font-medium">{Math.round(currentMetrics.averageSuccessRate * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>User Satisfaction</span>
                        <span className="font-medium">{currentMetrics.averageSatisfaction.toFixed(1)}/5</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="settings" className="flex-1 p-4 space-y-4">
                <h3 className="font-semibold">User Preferences</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Execution Mode</label>
                    <Select
                      value={userPreferences.preferredExecutionMode}
                      onValueChange={(value: any) => setUserPreferences(prev => ({
                        ...prev,
                        preferredExecutionMode: value
                      }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fast">Fast</SelectItem>
                        <SelectItem value="accurate">Accurate</SelectItem>
                        <SelectItem value="resource-efficient">Resource Efficient</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Display Density</label>
                    <Select
                      value={userPreferences.displayDensity}
                      onValueChange={(value: any) => setUserPreferences(prev => ({
                        ...prev,
                        displayDensity: value
                      }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compact">Compact</SelectItem>
                        <SelectItem value="comfortable">Comfortable</SelectItem>
                        <SelectItem value="spacious">Spacious</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium">Notifications</label>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Progress Updates</span>
                      <Switch
                        checked={userPreferences.notificationSettings.progressUpdates}
                        onCheckedChange={(checked) => setUserPreferences(prev => ({
                          ...prev,
                          notificationSettings: {
                            ...prev.notificationSettings,
                            progressUpdates: checked
                          }
                        }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Completion Alerts</span>
                      <Switch
                        checked={userPreferences.notificationSettings.completionAlerts}
                        onCheckedChange={(checked) => setUserPreferences(prev => ({
                          ...prev,
                          notificationSettings: {
                            ...prev.notificationSettings,
                            completionAlerts: checked
                          }
                        }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Error Notifications</span>
                      <Switch
                        checked={userPreferences.notificationSettings.errorNotifications}
                        onCheckedChange={(checked) => setUserPreferences(prev => ({
                          ...prev,
                          notificationSettings: {
                            ...prev.notificationSettings,
                            errorNotifications: checked
                          }
                        }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Optimization Suggestions</span>
                      <Switch
                        checked={userPreferences.notificationSettings.optimizationSuggestions}
                        onCheckedChange={(checked) => setUserPreferences(prev => ({
                          ...prev,
                          notificationSettings: {
                            ...prev.notificationSettings,
                            optimizationSuggestions: checked
                          }
                        }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium">Accessibility</label>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">High Contrast</span>
                      <Switch
                        checked={userPreferences.accessibilityNeeds.highContrast}
                        onCheckedChange={(checked) => setUserPreferences(prev => ({
                          ...prev,
                          accessibilityNeeds: {
                            ...prev.accessibilityNeeds,
                            highContrast: checked
                          }
                        }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Reduced Motion</span>
                      <Switch
                        checked={userPreferences.accessibilityNeeds.reducedMotion}
                        onCheckedChange={(checked) => setUserPreferences(prev => ({
                          ...prev,
                          accessibilityNeeds: {
                            ...prev.accessibilityNeeds,
                            reducedMotion: checked
                          }
                        }))}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
