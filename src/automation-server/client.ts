// Automation client service for communicating with Puppeteer server
export class AutomationClient {
  private baseUrl: string;
  private activePolling: Map<string, NodeJS.Timeout> = new Map();

  constructor(baseUrl: string = 'http://localhost:3003') {
    this.baseUrl = baseUrl;
  }

  // Check if automation server is running
  async isServerHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        timeout: 5000 // 5 second timeout
      } as any);
      
      if (!response.ok) {
        console.warn('Automation server returned error status:', response.status);
        return false;
      }
      
      const data = await response.json();
      console.log('Server health check:', data);
      return data.status === 'healthy' || data.status === 'ok';
    } catch (error) {
      console.warn('Automation server not available:', error);
      return false;
    }
  }

  // Execute a task in a specific session (same browser window)
  async executeTaskInSession(actions: BrowserAction[], sessionId: string): Promise<string> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const response = await fetch(`${this.baseUrl}/execute-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          actions,
          sessionId // Include session ID for browser window management
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      return taskId;
    } catch (error) {
      console.error('Failed to execute task on server:', error);
      throw error;
    }
  }

  // Execute a task on the automation server
  async executeTask(actions: BrowserAction[]): Promise<string> {
    return this.executeTaskInSession(actions, 'default');
  }

  // Get task status and progress
  async getTaskStatus(taskId: string): Promise<TaskStatus | null> {
    try {
      const response = await fetch(`${this.baseUrl}/task-status/${taskId}`);
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get task status:', error);
      return null;
    }
  }

  // Poll task progress with callback
  async pollTaskProgress(
    taskId: string, 
    onProgress: (progress: string[]) => void,
    onComplete: (status: TaskStatus) => void
  ): Promise<void> {
    let pollAttempts = 0;
    const maxPollAttempts = 120; // 2 minutes max polling
    
    const pollInterval = setInterval(async () => {
      pollAttempts++;
      
      if (pollAttempts > maxPollAttempts) {
        clearInterval(pollInterval);
        this.activePolling.delete(taskId);
        onComplete({ 
          status: 'failed', 
          error: 'Task polling timeout - task may still be running on server'
        } as TaskStatus);
        return;
      }
      
      const status = await this.getTaskStatus(taskId);
      
      if (!status) {
        clearInterval(pollInterval);
        this.activePolling.delete(taskId);
        onComplete({ 
          status: 'failed', 
          error: 'Task not found - may have been completed or server restarted'
        } as TaskStatus);
        return;
      }

      // Update progress
      const progressMessages = status.progress?.map(p => p.message) || [];
      onProgress(progressMessages);

      // Check if completed
      if (status.status === 'completed' || status.status === 'failed') {
        clearInterval(pollInterval);
        this.activePolling.delete(taskId);
        onComplete(status);
      }
    }, 1000);

    this.activePolling.set(taskId, pollInterval);
  }

  // Stop polling for a task
  stopPolling(taskId: string): void {
    const interval = this.activePolling.get(taskId);
    if (interval) {
      clearInterval(interval);
      this.activePolling.delete(taskId);
    }
  }

  // Clean up all polling
  cleanup(): void {
    this.activePolling.forEach((interval) => clearInterval(interval));
    this.activePolling.clear();
  }

  // Delete a task
  async deleteTask(taskId: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/task/${taskId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  }

  // Get all tasks
  async getAllTasks(): Promise<TaskStatus[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tasks`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get tasks:', error);
      return [];
    }
  }
}

// Types for the automation system
export interface BrowserAction {
  type: 'navigate' | 'search' | 'click' | 'type' | 'wait';
  target?: string;
  value?: string;
  selector?: string;
  description: string;
  duration?: number;
}

export interface TaskProgress {
  message: string;
  timestamp: number;
}

export interface TaskStatus {
  status: 'running' | 'completed' | 'failed';
  progress?: TaskProgress[];
  startTime?: number;
  result?: any;
  error?: string;
}

// Default export
export default AutomationClient;
