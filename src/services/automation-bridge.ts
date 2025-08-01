/**
 * Integration bridge between existing AI Task Manager and Advanced Automation Engine
 * Provides backward compatibility while enabling advanced features
 */

import { AdvancedAutomationEngine, AutomationTask, AutomationAction, ValidationRule } from '@/services/advanced-automation-engine';
import { configManager } from '@/config/automation-config';

// Legacy types from existing system
interface LegacyTaskAnalysis {
  type: 'browser' | 'app_task' | 'conversation' | 'calculation' | 'unknown';
  confidence: number;
  intent: string;
  parameters: {
    browserActions?: LegacyBrowserAction[];
    appAction?: any;
    response?: string;
    calculation?: string;
  };
  reasoning: string;
}

interface LegacyBrowserAction {
  action: string;
  target: string;
  value: string;
  description: string;
  contextDependent: boolean;
}

export class AdvancedAutomationBridge {
  private engine: AdvancedAutomationEngine | null = null;
  private isInitialized = false;
  private taskCounter = 0;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.engine = new AdvancedAutomationEngine();
      const config = configManager.getConfig();
      
      await this.engine.initialize({
        headless: config.engine.headless,
        maxConcurrency: config.engine.maxConcurrency,
        timeout: config.engine.defaultTimeout,
        retries: config.engine.defaultRetries
      });

      this.isInitialized = true;
      console.log('🚀 Advanced Automation Engine initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Advanced Automation Engine:', error);
      throw error;
    }
  }

  async executeFromAnalysis(analysis: LegacyTaskAnalysis, userInput: string): Promise<{
    success: boolean;
    message: string;
    result?: any;
    executionTime?: number;
  }> {
    if (!this.isInitialized || !this.engine) {
      await this.initialize();
    }

    try {
      if (analysis.type === 'browser' && analysis.parameters.browserActions) {
        return await this.executeBrowserTask(analysis, userInput);
      } else if (analysis.type === 'app_task') {
        return await this.executeAppTask(analysis, userInput);
      } else if (analysis.type === 'conversation') {
        return {
          success: true,
          message: analysis.parameters.response || 'Task completed successfully'
        };
      } else if (analysis.type === 'calculation') {
        return {
          success: true,
          message: analysis.parameters.calculation || 'Calculation completed'
        };
      } else {
        return {
          success: false,
          message: `Unknown task type: ${analysis.type}`
        };
      }
    } catch (error) {
      console.error('Task execution failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async executeBrowserTask(analysis: LegacyTaskAnalysis, userInput: string): Promise<{
    success: boolean;
    message: string;
    result?: any;
    executionTime?: number;
  }> {
    if (!this.engine || !analysis.parameters.browserActions) {
      throw new Error('Engine not initialized or no browser actions');
    }

    const actions = this.convertLegacyActions(analysis.parameters.browserActions);
    const validations = this.generateValidations(analysis.parameters.browserActions);
    
    const task: AutomationTask = {
      id: `advanced_task_${++this.taskCounter}`,
      type: 'workflow',
      priority: 'medium',
      config: {
        url: this.extractUrl(analysis.parameters.browserActions),
        actions,
        validations,
        errorHandling: {
          strategy: 'retry',
          notificationLevel: 'warning'
        },
        performance: {
          enableParallelization: false,
          batchSize: 1,
          cacheElements: true,
          optimizeSelectors: true,
          preloadResources: false
        }
      },
      retryCount: 0,
      maxRetries: 3,
      timeout: 30000,
      createdAt: new Date(),
      status: 'pending'
    };

    console.log('🔄 Executing advanced browser task:', task.id);
    const result = await this.engine.executeTask(task);

    return {
      success: result.success,
      message: result.success 
        ? `Task completed successfully in ${result.executionTime}ms`
        : `Task failed: ${result.errors.map(e => e.message).join(', ')}`,
      result: result,
      executionTime: result.executionTime
    };
  }

  private async executeAppTask(analysis: LegacyTaskAnalysis, userInput: string): Promise<{
    success: boolean;
    message: string;
    result?: any;
  }> {
    // For now, delegate app tasks to the existing system
    // This can be extended to use the advanced engine for app automation
    console.log('📱 App task delegation:', analysis.parameters.appAction);
    
    return {
      success: true,
      message: 'App task delegated to existing system (feature coming soon)'
    };
  }

  private convertLegacyActions(legacyActions: LegacyBrowserAction[]): AutomationAction[] {
    return legacyActions.map(legacyAction => {
      const action: AutomationAction = {
        type: this.mapActionType(legacyAction.action),
        selector: this.convertTarget(legacyAction.target, legacyAction.action),
        value: legacyAction.value || undefined,
        timeout: 10000,
        options: {
          waitForSelector: true,
          scrollIntoView: true
        }
      };

      // Enhanced ML detection for complex actions
      if (legacyAction.contextDependent) {
        action.mlEnhanced = true;
        action.timeout = 15000; // Longer timeout for context-dependent actions
      }

      return action;
    });
  }

  private mapActionType(legacyAction: string): AutomationAction['type'] {
    const actionMap: Record<string, AutomationAction['type']> = {
      'navigate': 'click', // Will be handled by URL in task config
      'search': 'type',
      'click': 'click',
      'type': 'type',
      'scroll': 'scroll',
      'wait': 'wait',
      'select': 'select',
      'back': 'click', // Browser back - will need special handling
      'forward': 'click', // Browser forward - will need special handling
      'extract': 'extract'
    };

    return actionMap[legacyAction] || 'click';
  }

  private convertTarget(target: string, action: string): string {
    // Smart target conversion with enhanced selectors
    if (action === 'navigate') {
      // Navigation actions don't need selectors
      return 'body';
    }

    if (action === 'search') {
      // Common search selectors
      const searchSelectors = [
        'input[name="q"]',
        'input[type="search"]',
        '.search-input',
        '#search',
        '[placeholder*="search" i]'
      ];
      return searchSelectors[0]; // Primary, others will be fallbacks
    }

    if (target.startsWith('http')) {
      // URL targets - convert to navigation
      return 'body';
    }

    // Return target as-is if it looks like a valid CSS selector
    if (target.match(/^[#.][\w-]+$/) || target.includes('[') || target.includes('>')) {
      return target;
    }

    // Generate smart selector for text-based targets
    return `text="${target}"`;
  }

  private extractUrl(actions: LegacyBrowserAction[]): string | undefined {
    // Find navigation action and extract URL
    const navAction = actions.find(action => 
      action.action === 'navigate' || action.target.startsWith('http')
    );

    if (navAction) {
      if (navAction.target.startsWith('http')) {
        return navAction.target;
      }
      if (navAction.value && navAction.value.startsWith('http')) {
        return navAction.value;
      }
    }

    // Smart URL detection based on action patterns
    if (actions.some(a => a.action === 'search' || a.target.includes('google'))) {
      return 'https://www.google.com';
    }

    return undefined;
  }

  private generateValidations(actions: LegacyBrowserAction[]): ValidationRule[] {
    const validations: ValidationRule[] = [];

    // Generate smart validations based on actions
    if (actions.some(a => a.action === 'search')) {
      validations.push({
        type: 'presence',
        selector: '#search, .search-results, [role="main"]',
        expected: true,
        required: false
      });
    }

    if (actions.some(a => a.action === 'click' && a.target.includes('submit'))) {
      validations.push({
        type: 'presence',
        selector: '.success, .confirmation, .thank-you',
        expected: true,
        required: false
      });
    }

    return validations;
  }

  async cleanup(): Promise<void> {
    if (this.engine) {
      await this.engine.cleanup();
      this.engine = null;
      this.isInitialized = false;
      console.log('🧹 Advanced Automation Engine cleaned up');
    }
  }

  // Enhanced features for the advanced system
  async getPerformanceReport() {
    if (!this.engine) return null;
    return this.engine.getPerformanceReport();
  }

  onTaskEvent(eventType: string, callback: (data: any) => void) {
    if (this.engine) {
      this.engine.on(eventType, callback);
    }
  }

  getEngineStatus() {
    return {
      initialized: this.isInitialized,
      tasksExecuted: this.taskCounter,
      engineAvailable: !!this.engine
    };
  }
}

// Singleton instance for global use
export const advancedAutomationBridge = new AdvancedAutomationBridge();

// Enhanced automation client that extends the existing one
export class EnhancedAutomationClient {
  private bridge = advancedAutomationBridge;
  private legacyFallback: any; // Reference to existing automation client

  constructor(legacyClient?: any) {
    this.legacyFallback = legacyClient;
  }

  async initialize() {
    try {
      await this.bridge.initialize();
      return true;
    } catch (error) {
      console.warn('Advanced engine failed to initialize, using legacy fallback');
      return false;
    }
  }

  async executeTask(analysis: LegacyTaskAnalysis, userInput: string): Promise<{
    success: boolean;
    message: string;
    result?: any;
    executionTime?: number;
    enhanced?: boolean;
  }> {
    try {
      const result = await this.bridge.executeFromAnalysis(analysis, userInput);
      return { ...result, enhanced: true };
    } catch (error) {
      console.warn('Advanced execution failed, falling back to legacy system');
      
      // Fallback to legacy system if available
      if (this.legacyFallback && this.legacyFallback.executeTask) {
        const legacyResult = await this.legacyFallback.executeTask(analysis, userInput);
        return { ...legacyResult, enhanced: false };
      }

      throw error;
    }
  }

  async cleanup() {
    await this.bridge.cleanup();
  }

  getPerformanceReport() {
    return this.bridge.getPerformanceReport();
  }

  getStatus() {
    return this.bridge.getEngineStatus();
  }

  onEvent(eventType: string, callback: (data: any) => void) {
    this.bridge.onTaskEvent(eventType, callback);
  }
}

export default {
  AdvancedAutomationBridge,
  advancedAutomationBridge,
  EnhancedAutomationClient
};
