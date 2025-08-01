'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, CheckCircle, Clock, Play, Pause, Settings, Monitor, TrendingUp, Shield, Zap } from 'lucide-react';
import { 
  AdvancedAutomationEngine, 
  AutomationTask, 
  AutomationResult, 
  EngineConfig,
  TaskConfig,
  AutomationAction,
  ValidationRule,
  PerformanceMetrics 
} from '@/services/advanced-automation-engine';

interface AdvancedAutomationUIProps {
  className?: string;
}

interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  category: 'web_scraping' | 'form_automation' | 'testing' | 'monitoring' | 'data_extraction';
  config: TaskConfig;
}

const TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: 'google_search',
    name: 'Google Search',
    description: 'Perform automated Google searches with result extraction',
    category: 'web_scraping',
    config: {
      url: 'https://google.com',
      actions: [
        { type: 'type', selector: 'input[name="q"]', value: '{{search_term}}' },
        { type: 'click', selector: 'input[type="submit"]' },
        { type: 'wait', selector: '#search', timeout: 3000 }
      ],
      validations: [
        { type: 'presence', selector: '#search', expected: true, required: true }
      ],
      errorHandling: { strategy: 'retry', notificationLevel: 'warning' },
      performance: { enableParallelization: false, batchSize: 1, cacheElements: true, optimizeSelectors: true, preloadResources: false }
    }
  },
  {
    id: 'form_submission',
    name: 'Form Automation',
    description: 'Automated form filling and submission',
    category: 'form_automation',
    config: {
      actions: [
        { type: 'type', selector: '#name', value: '{{name}}' },
        { type: 'type', selector: '#email', value: '{{email}}' },
        { type: 'select', selector: '#country', value: '{{country}}' },
        { type: 'click', selector: 'button[type="submit"]' }
      ],
      validations: [
        { type: 'presence', selector: '.success-message', expected: true, required: true }
      ],
      errorHandling: { strategy: 'retry', notificationLevel: 'error' },
      performance: { enableParallelization: false, batchSize: 1, cacheElements: true, optimizeSelectors: true, preloadResources: true }
    }
  }
];

export default function AdvancedAutomationUI({ className }: AdvancedAutomationUIProps) {
  // State Management
  const [engine, setEngine] = useState<AdvancedAutomationEngine | null>(null);
  const [isEngineInitialized, setIsEngineInitialized] = useState(false);
  const [currentTask, setCurrentTask] = useState<AutomationTask | null>(null);
  const [taskResults, setTaskResults] = useState<AutomationResult[]>([]);
  const [engineConfig, setEngineConfig] = useState<EngineConfig>({
    headless: false,
    maxConcurrency: 3,
    timeout: 30000,
    retries: 3
  });
  
  // UI State
  const [activeTab, setActiveTab] = useState('designer');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [realTimeLogs, setRealTimeLogs] = useState<string[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  
  // Task Designer State
  const [taskName, setTaskName] = useState('');
  const [taskUrl, setTaskUrl] = useState('');
  const [taskActions, setTaskActions] = useState<AutomationAction[]>([]);
  const [taskValidations, setTaskValidations] = useState<ValidationRule[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
  // Real-time monitoring
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Initialize Engine
  useEffect(() => {
    const initEngine = async () => {
      try {
        const newEngine = new AdvancedAutomationEngine();
        
        // Set up event listeners for real-time feedback
        newEngine.on('engine_initialized', () => {
          setIsEngineInitialized(true);
          addLog('✅ Automation engine initialized successfully');
        });
        
        newEngine.on('task_completed', (data: { task: AutomationTask, result: AutomationResult }) => {
          setTaskResults(prev => [...prev, data.result]);
          setPerformanceMetrics(data.result.performance);
          addLog(`✅ Task ${data.task.id} completed successfully`);
        });
        
        newEngine.on('task_failed', (data: { task: AutomationTask, result: AutomationResult, error: any }) => {
          setTaskResults(prev => [...prev, data.result]);
          addLog(`❌ Task ${data.task.id} failed: ${data.error.message}`);
        });
        
        newEngine.on('engine_error', (data: { error: any }) => {
          addLog(`🚨 Engine error: ${data.error.message}`);
        });
        
        await newEngine.initialize(engineConfig);
        setEngine(newEngine);
      } catch (error) {
        addLog(`❌ Failed to initialize engine: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    initEngine();
    
    return () => {
      if (engine) {
        engine.cleanup();
      }
    };
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [realTimeLogs]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setRealTimeLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = TASK_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setTaskName(template.name);
      setTaskUrl(template.config.url || '');
      setTaskActions([...template.config.actions]);
      setTaskValidations([...template.config.validations]);
      addLog(`📋 Loaded template: ${template.name}`);
    }
  };

  const addAction = () => {
    const newAction: AutomationAction = {
      type: 'click',
      selector: '',
      value: '',
      options: { waitForSelector: true, scrollIntoView: true },
      timeout: 5000
    };
    setTaskActions(prev => [...prev, newAction]);
  };

  const updateAction = (index: number, field: keyof AutomationAction, value: any) => {
    setTaskActions(prev => prev.map((action, i) => 
      i === index ? { ...action, [field]: value } : action
    ));
  };

  const removeAction = (index: number) => {
    setTaskActions(prev => prev.filter((_, i) => i !== index));
  };

  const addValidation = () => {
    const newValidation: ValidationRule = {
      type: 'presence',
      selector: '',
      expected: true,
      required: true
    };
    setTaskValidations(prev => [...prev, newValidation]);
  };

  const updateValidation = (index: number, field: keyof ValidationRule, value: any) => {
    setTaskValidations(prev => prev.map((validation, i) => 
      i === index ? { ...validation, [field]: value } : validation
    ));
  };

  const removeValidation = (index: number) => {
    setTaskValidations(prev => prev.filter((_, i) => i !== index));
  };

  const executeTask = async () => {
    if (!engine || !isEngineInitialized) {
      addLog('❌ Engine not initialized');
      return;
    }

    if (taskActions.length === 0) {
      addLog('❌ No actions defined');
      return;
    }

    setIsExecuting(true);
    setExecutionProgress(0);
    
    const task: AutomationTask = {
      id: `task_${Date.now()}`,
      type: 'workflow',
      priority: 'medium',
      config: {
        url: taskUrl,
        actions: taskActions,
        validations: taskValidations,
        errorHandling: { strategy: 'retry', notificationLevel: 'warning' },
        performance: { enableParallelization: false, batchSize: 1, cacheElements: true, optimizeSelectors: true, preloadResources: false }
      },
      retryCount: 0,
      maxRetries: engineConfig.retries || 3,
      timeout: engineConfig.timeout || 30000,
      createdAt: new Date(),
      status: 'pending'
    };

    setCurrentTask(task);
    addLog(`🚀 Starting task execution: ${taskName}`);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setExecutionProgress(prev => Math.min(prev + 10, 90));
    }, 500);

    try {
      const result = await engine.executeTask(task);
      setExecutionProgress(100);
      
      if (result.success) {
        addLog(`✅ Task completed successfully in ${result.executionTime}ms`);
      } else {
        addLog(`❌ Task failed with ${result.errors.length} errors`);
      }
    } catch (error) {
      addLog(`❌ Task execution failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      clearInterval(progressInterval);
      setIsExecuting(false);
      setExecutionProgress(0);
    }
  };

  const clearLogs = () => {
    setRealTimeLogs([]);
  };

  const exportResults = () => {
    const data = {
      results: taskResults,
      performance: performanceMetrics,
      logs: realTimeLogs
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `automation_results_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Advanced AI Automation Engine
            </h1>
            <p className="text-slate-600">
              High-performance web automation with ML-enhanced element detection
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge 
              variant={isEngineInitialized ? "default" : "secondary"}
              className="flex items-center space-x-1"
            >
              <div className={`w-2 h-2 rounded-full ${isEngineInitialized ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span>{isEngineInitialized ? 'Ready' : 'Initializing'}</span>
            </Badge>
            
            <Button
              onClick={executeTask}
              disabled={!isEngineInitialized || isExecuting || taskActions.length === 0}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isExecuting ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Execute Task
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Execution Progress */}
        {isExecuting && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Execution Progress</span>
              <span className="text-sm font-medium">{executionProgress}%</span>
            </div>
            <Progress value={executionProgress} className="h-2" />
          </div>
        )}
      </div>

      {/* Main Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="designer" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Task Designer</span>
          </TabsTrigger>
          <TabsTrigger value="monitor" className="flex items-center space-x-2">
            <Monitor className="w-4 h-4" />
            <span>Live Monitor</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Performance</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>Results</span>
          </TabsTrigger>
        </TabsList>

        {/* Task Designer Tab */}
        <TabsContent value="designer" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Template Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>Quick Templates</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_TEMPLATES.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedTemplate && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      {TASK_TEMPLATES.find(t => t.id === selectedTemplate)?.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Task Configuration */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Task Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Task Name</label>
                    <Input
                      value={taskName}
                      onChange={(e) => setTaskName(e.target.value)}
                      placeholder="Enter task name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Target URL</label>
                    <Input
                      value={taskUrl}
                      onChange={(e) => setTaskUrl(e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Automation Actions</CardTitle>
                <Button onClick={addAction} size="sm">
                  Add Action
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {taskActions.map((action, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Select 
                          value={action.type} 
                          onValueChange={(value) => updateAction(index, 'type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="click">Click</SelectItem>
                            <SelectItem value="type">Type</SelectItem>
                            <SelectItem value="select">Select</SelectItem>
                            <SelectItem value="scroll">Scroll</SelectItem>
                            <SelectItem value="wait">Wait</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Input
                          value={action.selector}
                          onChange={(e) => updateAction(index, 'selector', e.target.value)}
                          placeholder="CSS selector"
                        />
                        
                        <Input
                          value={action.value || ''}
                          onChange={(e) => updateAction(index, 'value', e.target.value)}
                          placeholder="Value (if needed)"
                        />
                        
                        <Input
                          type="number"
                          value={action.timeout || 5000}
                          onChange={(e) => updateAction(index, 'timeout', parseInt(e.target.value))}
                          placeholder="Timeout (ms)"
                        />
                      </div>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeAction(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  
                  {taskActions.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      No actions defined. Click "Add Action" to get started.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Validations Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Validation Rules</CardTitle>
                <Button onClick={addValidation} size="sm" variant="outline">
                  Add Validation
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {taskValidations.map((validation, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Select 
                        value={validation.type} 
                        onValueChange={(value) => updateValidation(index, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="presence">Element Present</SelectItem>
                          <SelectItem value="text">Text Match</SelectItem>
                          <SelectItem value="attribute">Attribute</SelectItem>
                          <SelectItem value="count">Element Count</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Input
                        value={validation.selector}
                        onChange={(e) => updateValidation(index, 'selector', e.target.value)}
                        placeholder="CSS selector"
                      />
                      
                      <Input
                        value={String(validation.expected)}
                        onChange={(e) => updateValidation(index, 'expected', e.target.value)}
                        placeholder="Expected value"
                      />
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={validation.required}
                          onCheckedChange={(checked) => updateValidation(index, 'required', checked)}
                        />
                        <span className="text-sm">Required</span>
                      </div>
                    </div>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeValidation(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Monitor Tab */}
        <TabsContent value="monitor" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Real-time Logs */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Real-time Logs</CardTitle>
                  <Button onClick={clearLogs} size="sm" variant="outline">
                    Clear Logs
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 bg-black text-green-400 p-4 rounded-lg font-mono text-sm">
                  {realTimeLogs.map((log, index) => (
                    <div key={index} className="mb-1">
                      {log}
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Current Task Status */}
            <Card>
              <CardHeader>
                <CardTitle>Task Status</CardTitle>
              </CardHeader>
              <CardContent>
                {currentTask ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Task ID:</span>
                      <Badge variant="outline">{currentTask.id}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Status:</span>
                      <Badge 
                        variant={
                          currentTask.status === 'completed' ? 'default' :
                          currentTask.status === 'failed' ? 'destructive' :
                          currentTask.status === 'running' ? 'secondary' : 'outline'
                        }
                      >
                        {currentTask.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Priority:</span>
                      <Badge variant="outline">{currentTask.priority}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Actions:</span>
                      <span>{currentTask.config.actions.length}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Validations:</span>
                      <span>{currentTask.config.validations.length}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    No active task
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Time</p>
                    <p className="text-2xl font-bold">
                      {performanceMetrics ? `${performanceMetrics.totalExecutionTime}ms` : '0ms'}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Avg Step Time</p>
                    <p className="text-2xl font-bold">
                      {performanceMetrics ? `${Math.round(performanceMetrics.averageStepTime)}ms` : '0ms'}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Success Rate</p>
                    <p className="text-2xl font-bold">
                      {performanceMetrics ? `${Math.round(performanceMetrics.successRate * 100)}%` : '0%'}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Memory Usage</p>
                    <p className="text-2xl font-bold">
                      {performanceMetrics ? `${Math.round(performanceMetrics.memoryUsage / 1024 / 1024)}MB` : '0MB'}
                    </p>
                  </div>
                  <Monitor className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-slate-100 rounded-lg flex items-center justify-center">
                <p className="text-slate-500">Performance charts coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Security Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Allowed Domains</label>
                  <Textarea
                    placeholder="example.com&#10;test.com&#10;localhost"
                    className="h-24"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Blocked Patterns</label>
                  <Textarea
                    placeholder="eval(&#10;document.write&#10;innerHTML="
                    className="h-24"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Input Validation</h4>
                    <p className="text-sm text-slate-600">Enable automatic input sanitization</p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Script Injection Protection</h4>
                    <p className="text-sm text-slate-600">Block potentially malicious script injection</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">SSL/TLS Verification</h4>
                    <p className="text-sm text-slate-600">Verify SSL certificates for secure connections</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Execution Results</h3>
            <Button onClick={exportResults} disabled={taskResults.length === 0}>
              Export Results
            </Button>
          </div>
          
          <div className="space-y-4">
            {taskResults.map((result, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Task {result.taskId}</CardTitle>
                    <div className="flex items-center space-x-2">
                      {result.success ? (
                        <Badge className="bg-green-100 text-green-800">Success</Badge>
                      ) : (
                        <Badge variant="destructive">Failed</Badge>
                      )}
                      <span className="text-sm text-slate-600">
                        {result.executionTime}ms
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Steps Executed</p>
                      <p className="text-lg font-semibold">{result.steps.length}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Success Rate</p>
                      <p className="text-lg font-semibold">
                        {Math.round(result.performance.successRate * 100)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Errors</p>
                      <p className="text-lg font-semibold text-red-600">{result.errors.length}</p>
                    </div>
                  </div>
                  
                  {result.errors.length > 0 && (
                    <div className="mt-4">
                      <h5 className="font-medium text-red-800 mb-2">Errors:</h5>
                      <div className="space-y-2">
                        {result.errors.map((error, errorIndex) => (
                          <div key={errorIndex} className="bg-red-50 p-3 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                              <span className="font-medium text-red-800">{error.type}</span>
                            </div>
                            <p className="text-sm text-red-700 mt-1">{error.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {taskResults.length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8 text-slate-500">
                    No execution results yet. Run a task to see results here.
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
