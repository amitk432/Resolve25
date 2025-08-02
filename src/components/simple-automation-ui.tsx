'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, CheckCircle, Clock, Play, Settings, Monitor } from 'lucide-react';
import { 
  AutomationApiWrapper,
  AutomationTask, 
  TaskResult, 
  AutomationEngineConfig
} from '@/services/automation-api-wrapper';

interface AdvancedAutomationUIProps {
  className?: string;
}

export default function AdvancedAutomationUI({ className }: AdvancedAutomationUIProps) {
  const [engine, setEngine] = useState<AutomationApiWrapper | null>(null);
  const [tasks, setTasks] = useState<AutomationTask[]>([]);
  const [taskResults, setTaskResults] = useState<TaskResult[]>([]);
  const [isEngineRunning, setIsEngineRunning] = useState(false);
  const [logs, setLogs] = useState<Array<{timestamp: Date, level: string, message: string}>>([]);
  
  // Simple form state
  const [formUrl, setFormUrl] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize engine
  useEffect(() => {
    const initEngine = async () => {
      try {
        const newEngine = new AutomationApiWrapper();
        setEngine(newEngine);
        setIsEngineRunning(true);
        addLog('info', 'Automation engine initialized successfully');
      } catch (error) {
        console.error('Failed to initialize automation engine:', error);
        addLog('error', `Failed to initialize engine: ${error}`);
      }
    };

    initEngine();
  }, []);

  // Poll for task updates
  useEffect(() => {
    if (!engine || !isEngineRunning) return;

    const pollInterval = setInterval(async () => {
      try {
        const allTasks = await engine.getAllTasks();
        setTasks(allTasks);
        
        // Get results for completed tasks
        const completedTasks = allTasks.filter(t => t.status === 'completed');
        const newResults = await Promise.all(
          completedTasks.map(async (task) => {
            try {
              return await engine.getTaskResult(task.id);
            } catch {
              return null;
            }
          })
        );
        
        setTaskResults(newResults.filter(r => r !== null) as TaskResult[]);
      } catch (error) {
        addLog('error', `Failed to poll task updates: ${error}`);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [engine, isEngineRunning]);

  const addLog = (level: string, message: string) => {
    setLogs(prev => [...prev.slice(-99), { timestamp: new Date(), level, message }]);
  };

  const handleGoogleSearch = async () => {
    if (!engine || !searchTerm) return;

    setIsSubmitting(true);
    try {
      const result = await engine.navigateAndExtract('https://google.com', [
        { selector: 'h3', attribute: 'textContent' },
        { selector: 'a[href]', attribute: 'href' }
      ]);
      
      addLog('info', `Google search completed for "${searchTerm}"`);
    } catch (error) {
      addLog('error', `Failed to perform Google search: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmission = async () => {
    if (!engine || !formUrl) return;

    setIsSubmitting(true);
    try {
      const result = await engine.fillForm(formUrl, {
        'input[name="email"]': 'test@example.com',
        'input[name="message"]': 'Test message from automation'
      });
      
      addLog('info', `Form submission completed for ${formUrl}`);
    } catch (error) {
      addLog('error', `Failed to submit form: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, icon: Clock, text: 'Pending' },
      running: { variant: 'default' as const, icon: Play, text: 'Running' },
      completed: { variant: 'default' as const, icon: CheckCircle, text: 'Completed' },
      failed: { variant: 'destructive' as const, icon: AlertTriangle, text: 'Failed' },
      cancelled: { variant: 'secondary' as const, icon: AlertTriangle, text: 'Cancelled' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Advanced Automation Engine</h1>
          <p className="text-muted-foreground">AI-powered web automation with intelligent error recovery</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isEngineRunning ? 'default' : 'secondary'} className="gap-1">
            <Monitor className="h-3 w-3" />
            {isEngineRunning ? 'Running' : 'Stopped'}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="quickstart" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="quickstart">Quick Start</TabsTrigger>
          <TabsTrigger value="tasks">Active Tasks</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        {/* Quick Start Tab */}
        <TabsContent value="quickstart" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Google Search */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Google Search Automation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Enter search term..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button 
                  onClick={handleGoogleSearch}
                  disabled={!searchTerm || isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? 'Searching...' : 'Search Google'}
                </Button>
              </CardContent>
            </Card>

            {/* Form Automation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Form Automation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Enter form URL..."
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                />
                <Button 
                  onClick={handleFormSubmission}
                  disabled={!formUrl || isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? 'Submitting...' : 'Fill Form'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Active Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Tasks ({tasks.filter(t => t.status === 'running' || t.status === 'pending').length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {tasks.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No tasks found</p>
                  ) : (
                    tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{task.type}</span>
                            {getStatusBadge(task.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Created: {new Date(task.createdAt).toLocaleString()}
                          </p>
                          {task.config.url && (
                            <p className="text-sm text-muted-foreground">URL: {task.config.url}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Priority: {task.priority}</Badge>
                          {(task.status === 'running' || task.status === 'pending') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => engine?.cancelTask(task.id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Results ({taskResults.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {taskResults.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No results yet</p>
                  ) : (
                    taskResults.map((result) => (
                      <div key={result.taskId} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Task {result.taskId}</span>
                          {getStatusBadge(result.status)}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Duration: {result.metadata.duration}ms</p>
                          <p>Completed: {new Date(result.metadata.timestamp).toLocaleString()}</p>
                          {result.metadata.retryCount > 0 && (
                            <p>Retries: {result.metadata.retryCount}</p>
                          )}
                        </div>
                        {result.data && (
                          <div className="mt-2">
                            <p className="text-sm font-medium">Data:</p>
                            <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          </div>
                        )}
                        {result.error && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-destructive">Error:</p>
                            <p className="text-xs text-destructive bg-destructive/10 p-2 rounded mt-1">
                              {result.error}
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {logs.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No logs yet</p>
                  ) : (
                    logs.map((log, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-muted-foreground whitespace-nowrap">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                        <Badge variant={log.level === 'error' ? 'destructive' : 'secondary'} className="text-xs">
                          {log.level}
                        </Badge>
                        <span className="flex-1">{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
