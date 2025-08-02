/**
 * Frontend-safe Automation API Wrapper
 * This wrapper provides all automation functionality without importing playwright directly
 */

// Re-export types without importing playwright
export interface AutomationTask {
  id: string;
  type: 'navigation' | 'interaction' | 'extraction' | 'validation' | 'workflow';
  priority: 'low' | 'medium' | 'high' | 'critical';
  config: TaskConfig;
  retryCount: number;
  maxRetries: number;
  timeout: number;
  createdAt: Date;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
}

export interface TaskConfig {
  url?: string;
  actions: AutomationAction[];
  validations: ValidationRule[];
  errorHandling: ErrorHandlingConfig;
  performance: PerformanceConfig;
}

export interface AutomationAction {
  type: 'click' | 'type' | 'select' | 'scroll' | 'wait' | 'extract' | 'validate';
  selector?: string;
  value?: string;
  options?: Record<string, any>;
  timeout?: number;
  aiEnhanced?: boolean;
}

export interface ValidationRule {
  type: 'presence' | 'text' | 'attribute' | 'count' | 'custom';
  selector?: string;
  expected?: any;
  customFn?: string;
}

export interface ErrorHandlingConfig {
  retryStrategy: 'exponential' | 'linear' | 'custom';
  maxRetries: number;
  captureScreenshot: boolean;
  captureTrace: boolean;
  fallbackActions: AutomationAction[];
}

export interface PerformanceConfig {
  networkIdle: boolean;
  waitUntil: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
  timeout: number;
  enableCache: boolean;
  disableImages: boolean;
}

export interface TaskResult {
  taskId: string;
  status: 'success' | 'failure';
  data?: any;
  error?: string;
  metadata: {
    duration: number;
    timestamp: Date;
    retryCount: number;
    performance: PerformanceMetrics;
  };
}

export interface PerformanceMetrics {
  loadTime: number;
  executionTime: number;
  memoryUsage: number;
  networkRequests: number;
  screenshotCount: number;
}

export interface AutomationEngineConfig {
  maxConcurrentTasks: number;
  browserConfig: {
    headless: boolean;
    timeout: number;
    userAgent?: string;
    viewport?: { width: number; height: number };
  };
  aiConfig: {
    enableSmartWaits: boolean;
    enableElementDetection: boolean;
    enableErrorRecovery: boolean;
    enablePerformanceOptimization: boolean;
  };
  debugConfig: {
    enableLogging: boolean;
    captureScreenshots: boolean;
    captureTraces: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}

/**
 * Frontend-safe Automation Engine Class
 * All methods delegate to server-side API endpoints
 */
export class AutomationApiWrapper {
  private baseUrl: string;
  private config: AutomationEngineConfig;

  constructor(config?: Partial<AutomationEngineConfig>) {
    this.baseUrl = process.env.NEXT_PUBLIC_AUTOMATION_SERVER_URL || 'http://localhost:3001';
    this.config = {
      maxConcurrentTasks: 5,
      browserConfig: {
        headless: true,
        timeout: 30000,
        viewport: { width: 1920, height: 1080 },
      },
      aiConfig: {
        enableSmartWaits: true,
        enableElementDetection: true,
        enableErrorRecovery: true,
        enablePerformanceOptimization: true,
      },
      debugConfig: {
        enableLogging: true,
        captureScreenshots: false,
        captureTraces: false,
        logLevel: 'info',
      },
      ...config,
    };
  }

  async submitTask(task: Omit<AutomationTask, 'id' | 'createdAt' | 'status'>): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/automation/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit task: ${response.statusText}`);
    }

    const result = await response.json();
    return result.taskId;
  }

  async getTaskStatus(taskId: string): Promise<AutomationTask> {
    const response = await fetch(`${this.baseUrl}/api/automation/status/${taskId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get task status: ${response.statusText}`);
    }

    return response.json();
  }

  async getTaskResult(taskId: string): Promise<TaskResult> {
    const response = await fetch(`${this.baseUrl}/api/automation/result/${taskId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get task result: ${response.statusText}`);
    }

    return response.json();
  }

  async cancelTask(taskId: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/api/automation/cancel/${taskId}`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel task: ${response.statusText}`);
    }

    const result = await response.json();
    return result.success;
  }

  async getAllTasks(): Promise<AutomationTask[]> {
    const response = await fetch(`${this.baseUrl}/api/automation/tasks`);
    
    if (!response.ok) {
      throw new Error(`Failed to get tasks: ${response.statusText}`);
    }

    return response.json();
  }

  async getEngineStats(): Promise<{
    activeTasks: number;
    completedTasks: number;
    failedTasks: number;
    totalTasks: number;
    averageExecutionTime: number;
    memoryUsage: number;
  }> {
    const response = await fetch(`${this.baseUrl}/api/automation/stats`);
    
    if (!response.ok) {
      throw new Error(`Failed to get engine stats: ${response.statusText}`);
    }

    return response.json();
  }

  // Convenience methods for common automation tasks
  async navigateAndExtract(url: string, extractors: Array<{ selector: string; attribute?: string }>): Promise<TaskResult> {
    const taskId = await this.submitTask({
      type: 'workflow',
      priority: 'medium',
      config: {
        url,
        actions: [
          { type: 'wait', options: { waitUntil: 'networkidle0' } },
          ...extractors.map(ext => ({
            type: 'extract' as const,
            selector: ext.selector,
            options: { attribute: ext.attribute },
          })),
        ],
        validations: [],
        errorHandling: {
          retryStrategy: 'exponential' as const,
          maxRetries: 3,
          captureScreenshot: true,
          captureTrace: false,
          fallbackActions: [],
        },
        performance: {
          networkIdle: true,
          waitUntil: 'networkidle0' as const,
          timeout: 30000,
          enableCache: true,
          disableImages: false,
        },
      },
      retryCount: 0,
      maxRetries: 3,
      timeout: 60000,
    });

    // Poll for completion
    let task: AutomationTask;
    do {
      await this.sleep(1000);
      task = await this.getTaskStatus(taskId);
    } while (task.status === 'pending' || task.status === 'running');

    return this.getTaskResult(taskId);
  }

  async fillForm(url: string, formData: Record<string, string>): Promise<TaskResult> {
    const actions: AutomationAction[] = [
      { type: 'wait', options: { waitUntil: 'domcontentloaded' } },
    ];

    for (const [selector, value] of Object.entries(formData)) {
      actions.push({
        type: 'type',
        selector,
        value,
        aiEnhanced: true,
      });
    }

    const taskId = await this.submitTask({
      type: 'workflow',
      priority: 'medium',
      config: {
        url,
        actions,
        validations: [],
        errorHandling: {
          retryStrategy: 'exponential',
          maxRetries: 3,
          captureScreenshot: true,
          captureTrace: false,
          fallbackActions: [],
        },
        performance: {
          networkIdle: false,
          waitUntil: 'domcontentloaded',
          timeout: 30000,
          enableCache: false,
          disableImages: true,
        },
      },
      retryCount: 0,
      maxRetries: 3,
      timeout: 60000,
    });

    // Poll for completion
    let task: AutomationTask;
    do {
      await this.sleep(1000);
      task = await this.getTaskStatus(taskId);
    } while (task.status === 'pending' || task.status === 'running');

    return this.getTaskResult(taskId);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export a default instance
export const automationEngine = new AutomationApiWrapper();
