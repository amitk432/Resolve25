/**
 * Integration Implementation for Enhanced AI Task Manager
 * 
 * This module integrates all the enhanced performance, monitoring, and user experience
 * features into the main AI Task Manager component.
 */

import { 
  EnhancedAIAnalysis,
  PerformanceMonitor,
  ResourceManager,
  LoadBalancer,
  type TaskExecutionContext,
  type PerformanceMetrics,
  type UserFeedback
} from '@/services/enhanced-ai-performance';

import EnhancedTaskExecutionEngine, {
  type ExecutionStep,
  type TaskExecutionOptions
} from '@/services/enhanced-task-execution';

import ComprehensiveMonitoringSystem, {
  type MonitoringConfig
} from '@/services/monitoring-and-reporting';

import { AIAnalysisService, type SessionContext } from '@/services/ai-analysis-browser';
import AutomationClient from '@/automation-server/client';

// Integration Configuration
interface IntegrationConfig {
  enablePerformanceOptimization: boolean;
  enableAdvancedMonitoring: boolean;
  enableResourceManagement: boolean;
  enableAdaptiveExecution: boolean;
  enableUserFeedbackLoop: boolean;
  enableABTesting: boolean;
  performanceThresholds: {
    maxResponseTime: number;
    maxMemoryUsage: number;
    minSuccessRate: number;
  };
}

const defaultIntegrationConfig: IntegrationConfig = {
  enablePerformanceOptimization: true,
  enableAdvancedMonitoring: true,
  enableResourceManagement: true,
  enableAdaptiveExecution: true,
  enableUserFeedbackLoop: true,
  enableABTesting: false, // Disabled by default for privacy
  performanceThresholds: {
    maxResponseTime: 5000, // 5 seconds
    maxMemoryUsage: 200 * 1024 * 1024, // 200MB
    minSuccessRate: 0.90 // 90%
  }
};

/**
 * Enhanced AI Task Manager Integration Layer
 * 
 * This class integrates all enhanced performance and monitoring capabilities
 * with the existing AI Task Manager functionality.
 */
export class EnhancedAITaskManagerIntegration {
  private config: IntegrationConfig;
  private enhancedAI: EnhancedAIAnalysis;
  private executionEngine: EnhancedTaskExecutionEngine;
  private performanceMonitor: PerformanceMonitor;
  private resourceManager: ResourceManager;
  private loadBalancer: LoadBalancer;
  private monitoringSystem: ComprehensiveMonitoringSystem | null = null;
  private automationClient: AutomationClient;
  
  private activeSessionContext: TaskExecutionContext | null = null;
  private performanceHistory: Map<string, PerformanceMetrics[]> = new Map();
  private userSatisfactionScores: Map<string, number> = new Map();

  constructor(
    config: Partial<IntegrationConfig> = {},
    automationClient?: AutomationClient
  ) {
    this.config = { ...defaultIntegrationConfig, ...config };
    
    // Initialize enhanced AI analysis
    this.enhancedAI = new EnhancedAIAnalysis('gemini-2.5-pro');
    
    // Initialize execution engine with optimized settings
    const executionOptions: TaskExecutionOptions = {
      maxConcurrency: 5,
      timeout: this.config.performanceThresholds.maxResponseTime,
      retryAttempts: 3,
      enablePrefetch: true,
      resourceOptimization: 'balanced',
      executionMode: this.config.enableAdaptiveExecution ? 'adaptive' : 'sequential'
    };
    this.executionEngine = new EnhancedTaskExecutionEngine(executionOptions);
    
    // Initialize monitoring and resource management
    this.performanceMonitor = new PerformanceMonitor();
    this.resourceManager = new ResourceManager();
    this.loadBalancer = new LoadBalancer();
    
    // Initialize comprehensive monitoring if enabled
    if (this.config.enableAdvancedMonitoring) {
      const monitoringConfig: MonitoringConfig = {
        enableRealTimeMetrics: true,
        enableUserTracking: this.config.enableUserFeedbackLoop,
        enableABTesting: this.config.enableABTesting,
        enablePredictiveAnalytics: true,
        metricsRetentionDays: 30,
        reportingInterval: 5000
      };
      this.monitoringSystem = new ComprehensiveMonitoringSystem(monitoringConfig);
    }
    
    // Set up automation client
    this.automationClient = automationClient || new AutomationClient();
    
    // Set up event listeners
    this.setupEventListeners();
    
    console.log('Enhanced AI Task Manager Integration initialized with config:', this.config);
  }

  private setupEventListeners() {
    // Listen to execution progress
    this.executionEngine.on('progress', (event) => {
      if (this.monitoringSystem) {
        this.monitoringSystem.recordUserAction(
          this.activeSessionContext?.userId || 'unknown',
          this.activeSessionContext?.sessionId || 'unknown',
          {
            type: 'task_start',
            timestamp: new Date(),
            metadata: { 
              taskId: event.taskId, 
              percentage: event.percentage,
              currentStep: event.currentStep
            }
          }
        );
      }
    });

    // Listen to task completion
    this.executionEngine.on('complete', (event) => {
      this.handleTaskCompletion(event);
    });

    // Listen to task errors
    this.executionEngine.on('error', (event) => {
      this.handleTaskError(event);
    });
  }

  /**
   * Main entry point for task execution with all enhancements
   */
  async executeEnhancedTask(
    userInput: string,
    sessionContext: SessionContext,
    executionContext: TaskExecutionContext
  ): Promise<{
    success: boolean;
    result?: any;
    performance: PerformanceMetrics;
    recommendations: string[];
    sessionId: string;
  }> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    this.activeSessionContext = executionContext;
    
    try {
      // Step 1: Enhanced AI Analysis
      console.log('🧠 Performing enhanced AI analysis...');
      const analysis = await this.enhancedAI.analyzeWithContext(
        userInput, 
        sessionContext, 
        executionContext
      );
      
      // Step 2: Resource allocation and load balancing
      if (this.config.enableResourceManagement) {
        console.log('⚡ Optimizing resource allocation...');
        const analysisSteps = analysis.parameters?.browserActions || [];
        await this.optimizeResourceAllocation(executionContext, analysisSteps);
      }
      
      // Step 3: Convert to execution steps
      const analysisSteps = analysis.parameters?.browserActions || [];
      const executionSteps = this.convertToExecutionSteps(analysisSteps);
      
      // Step 4: Execute with enhanced engine
      console.log('🚀 Executing task with enhanced engine...');
      const executionResult = await this.executionEngine.executeTask(
        taskId,
        executionSteps,
        {
          session_id: executionContext.sessionId,
          user_id: executionContext.userId,
          browser_instance: 'enhanced_browser',
          execution_environment: {
            os: executionContext.deviceInfo.os,
            browser: executionContext.deviceInfo.browser,
            viewport: executionContext.deviceInfo.screenResolution,
            user_agent: 'Enhanced AI Task Manager',
            available_memory: 8 * 1024 * 1024 * 1024,
            cpu_cores: 8,
            network_speed: executionContext.networkConditions.speed
          },
          security_context: {
            privacy_level: executionContext.userPreferences.privacyLevel,
            allowed_domains: [],
            blocked_domains: [],
            cookie_policy: executionContext.browserCapabilities.cookiesEnabled ? 'same-site' : 'none',
            javascript_enabled: executionContext.browserCapabilities.jsEnabled
          },
          performance_profile: {
            preferred_speed: this.mapExecutionModeToSpeed(executionContext.userPreferences.preferredExecutionMode),
            battery_optimization: false,
            data_saver: false,
            background_execution: true
          }
        }
      );
      
      // Step 5: Calculate performance metrics
      const executionTime = Date.now() - startTime;
      const performanceMetrics = await this.calculatePerformanceMetrics(
        taskId,
        executionTime,
        executionResult,
        executionContext
      );
      
      // Step 6: Generate recommendations
      const recommendations = await this.generateRecommendations(
        performanceMetrics,
        analysis,
        executionContext
      );
      
      // Step 7: Record metrics and feedback
      if (this.config.enableAdvancedMonitoring && this.monitoringSystem) {
        this.monitoringSystem.recordUserAction(executionContext.userId, executionContext.sessionId, {
          type: 'task_complete',
          timestamp: new Date(),
          metadata: { taskId, success: executionResult.success },
          duration: executionTime,
          success: executionResult.success
        });
      }
      
      // Store performance history
      if (!this.performanceHistory.has(executionContext.userId)) {
        this.performanceHistory.set(executionContext.userId, []);
      }
      this.performanceHistory.get(executionContext.userId)!.push(performanceMetrics);
      
      console.log('✅ Task completed successfully with enhanced features');
      
      return {
        success: executionResult.success,
        result: executionResult,
        performance: performanceMetrics,
        recommendations,
        sessionId: executionContext.sessionId
      };
      
    } catch (error) {
      console.error('❌ Enhanced task execution failed:', error);
      
      // Handle error with monitoring
      if (this.monitoringSystem) {
        this.monitoringSystem.recordUserAction(executionContext.userId, executionContext.sessionId, {
          type: 'task_abort',
          timestamp: new Date(),
          metadata: { taskId, error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }
      
      const executionTime = Date.now() - startTime;
      const errorMetrics: PerformanceMetrics = {
        responseTime: executionTime,
        executionTime,
        successRate: 0,
        userSatisfactionScore: 1, // Low satisfaction due to error
        resourceUsage: {
          memoryUsage: 0,
          cpuUsage: 0,
          browserInstances: 0,
          activeConnections: 0,
          cacheHitRate: 0
        },
        taskComplexity: {
          actionCount: 0,
          requiresAuthentication: false,
          requiresFormInteraction: false,
          crossSiteNavigation: false,
          estimatedDuration: executionTime
        }
      };
      
      return {
        success: false,
        performance: errorMetrics,
        recommendations: [
          'Task failed - please try simplifying your request',
          'Check your internet connection',
          'Verify the target website is accessible'
        ],
        sessionId: executionContext.sessionId
      };
    }
  }

  /**
   * Optimize resource allocation based on task requirements
   */
  private async optimizeResourceAllocation(
    context: TaskExecutionContext,
    steps: any[]
  ): Promise<void> {
    // Analyze resource requirements
    const complexity = this.enhancedAI.analyzeTaskComplexity(steps, context);
    
    // Allocate browser instance if needed
    if (steps.some(step => step.type === 'browser')) {
      const browserRequirements = {
        type: 'standard' as const,
        performance: context.deviceInfo.performanceClass,
        memory: context.deviceInfo.performanceClass === 'high' ? 'unlimited' as const : 'limited' as const,
        features: ['automation', 'javascript']
      };
      
      const instanceId = await this.resourceManager.allocateBrowserInstance(
        context.sessionId,
        browserRequirements
      );
      
      console.log(`🌐 Allocated browser instance: ${instanceId}`);
    }
    
    // Optimize load balancing for multiple steps
    if (steps.length > 3) {
      const tasks = steps.map((step, index) => ({
        id: `step_${index}`,
        type: step.type,
        priority: 'medium' as const,
        complexity: {
          actionCount: 1,
          requiresAuthentication: step.type === 'login',
          requiresFormInteraction: step.type === 'form',
          crossSiteNavigation: false,
          estimatedDuration: 3000
        },
        requirements: {
          type: 'standard' as const,
          performance: 'medium' as const,
          memory: 'unlimited' as const,
          features: ['automation']
        }
      }));
      
      const distribution = await this.loadBalancer.distributeTasks(tasks, context);
      console.log(`⚖️ Distributed ${tasks.length} tasks across workers`);
    }
  }

  /**
   * Convert AI analysis steps to execution engine format
   */
  private convertToExecutionSteps(analysisSteps: any[]): ExecutionStep[] {
    return analysisSteps.map((step, index) => ({
      id: `step_${index}`,
      type: step.action || 'navigate',
      target: step.target || step.url,
      value: step.value || step.text,
      priority: step.priority || 5,
      dependencies: index > 0 ? [`step_${index - 1}`] : [],
      estimated_duration: step.estimatedDuration || 3000,
      resource_requirements: {
        memory_mb: 50,
        cpu_percent: 20,
        network_bandwidth: 1,
        requires_authentication: step.requiresAuth || false,
        requires_user_interaction: step.requiresInteraction || false
      },
      retry_strategy: {
        max_attempts: 3,
        backoff_strategy: 'exponential',
        base_delay_ms: 1000,
        max_delay_ms: 5000,
        should_retry: (error: Error) => !error.message.includes('404')
      }
    }));
  }

  /**
   * Calculate comprehensive performance metrics
   */
  private async calculatePerformanceMetrics(
    taskId: string,
    executionTime: number,
    executionResult: any,
    context: TaskExecutionContext
  ): Promise<PerformanceMetrics> {
    const currentUsage = await this.performanceMonitor.getCurrentUsage();
    
    return {
      responseTime: executionTime,
      executionTime,
      successRate: executionResult.success ? 1 : 0,
      userSatisfactionScore: this.calculateUserSatisfaction(executionResult, executionTime),
      resourceUsage: {
        memoryUsage: currentUsage.memoryUsage,
        cpuUsage: currentUsage.cpuUsage,
        browserInstances: currentUsage.browserInstances,
        activeConnections: currentUsage.activeConnections,
        cacheHitRate: currentUsage.cacheHitRate
      },
      taskComplexity: {
        actionCount: executionResult.total_steps || 0,
        requiresAuthentication: false, // Would need to analyze steps
        requiresFormInteraction: false, // Would need to analyze steps
        crossSiteNavigation: false, // Would need to analyze steps
        estimatedDuration: executionTime
      }
    };
  }

  /**
   * Calculate user satisfaction score based on execution results
   */
  private calculateUserSatisfaction(executionResult: any, executionTime: number): number {
    let score = 5; // Start with perfect score
    
    // Reduce score for failures
    if (!executionResult.success) {
      score -= 3;
    }
    
    // Reduce score for slow execution
    if (executionTime > this.config.performanceThresholds.maxResponseTime) {
      score -= 1;
    }
    
    // Reduce score for errors
    if (executionResult.errors && executionResult.errors.length > 0) {
      score -= executionResult.errors.length * 0.5;
    }
    
    return Math.max(1, Math.min(5, score));
  }

  /**
   * Generate optimization recommendations
   */
  private async generateRecommendations(
    metrics: PerformanceMetrics,
    analysis: any,
    context: TaskExecutionContext
  ): Promise<string[]> {
    const recommendations: string[] = [];
    
    // Performance recommendations
    if (metrics.responseTime > this.config.performanceThresholds.maxResponseTime) {
      recommendations.push('Consider breaking complex tasks into smaller steps for better performance');
    }
    
    if (metrics.resourceUsage.memoryUsage > this.config.performanceThresholds.maxMemoryUsage) {
      recommendations.push('High memory usage detected - close unnecessary browser tabs');
    }
    
    if (metrics.successRate < this.config.performanceThresholds.minSuccessRate) {
      recommendations.push('Task success rate is low - consider simplifying the automation steps');
    }
    
    // User experience recommendations
    if (metrics.userSatisfactionScore < 3) {
      recommendations.push('Try providing more specific instructions for better results');
    }
    
    // Context-based recommendations
    if (context.networkConditions.speed === 'slow') {
      recommendations.push('Slow network detected - consider enabling data saver mode');
    }
    
    if (context.deviceInfo.performanceClass === 'low') {
      recommendations.push('Low-performance device detected - try reducing concurrent operations');
    }
    
    // Get AI-powered optimization suggestions
    const aiRecommendations = this.enhancedAI.getOptimizationSuggestions(metrics, context);
    recommendations.push(...aiRecommendations.map((r: any) => r.description));
    
    return recommendations;
  }

  /**
   * Handle task completion events
   */
  private handleTaskCompletion(event: any) {
    console.log('✅ Task completed:', event.taskId);
    
    // Record completion metrics
    if (this.config.enablePerformanceOptimization) {
      this.performanceMonitor.recordTaskMetrics(event.taskId, {
        responseTime: event.duration,
        executionTime: event.duration,
        successRate: 1,
        userSatisfactionScore: 4.5,
        resourceUsage: {
          memoryUsage: 50 * 1024 * 1024,
          cpuUsage: 25,
          browserInstances: 1,
          activeConnections: 1,
          cacheHitRate: 0.8
        },
        taskComplexity: {
          actionCount: event.stepsCompleted || 1,
          requiresAuthentication: false,
          requiresFormInteraction: false,
          crossSiteNavigation: false,
          estimatedDuration: event.duration
        }
      });
    }
  }

  /**
   * Handle task error events
   */
  private handleTaskError(event: any) {
    console.error('❌ Task failed:', event.taskId, event.error);
    
    // Record error metrics
    if (this.config.enablePerformanceOptimization) {
      this.performanceMonitor.recordTaskMetrics(event.taskId, {
        responseTime: event.duration || 0,
        executionTime: event.duration || 0,
        successRate: 0,
        userSatisfactionScore: 1,
        resourceUsage: {
          memoryUsage: 0,
          cpuUsage: 0,
          browserInstances: 0,
          activeConnections: 0,
          cacheHitRate: 0
        },
        taskComplexity: {
          actionCount: 0,
          requiresAuthentication: false,
          requiresFormInteraction: false,
          crossSiteNavigation: false,
          estimatedDuration: 0
        }
      });
    }
  }

  /**
   * Submit user feedback for continuous improvement
   */
  async submitUserFeedback(
    taskId: string,
    feedback: Omit<UserFeedback, 'taskId'>
  ): Promise<void> {
    const completeFeedback: UserFeedback = {
      taskId,
      ...feedback
    };
    
    // Submit feedback to AI analysis for learning
    this.enhancedAI.addFeedback(taskId, completeFeedback);
    
    // Update user satisfaction score
    this.userSatisfactionScores.set(taskId, feedback.rating);
    
    console.log('📝 User feedback submitted for task:', taskId);
  }

  /**
   * Get performance insights and analytics
   */
  getPerformanceInsights(userId: string): {
    averagePerformance: PerformanceMetrics | null;
    trendAnalysis: string[];
    recommendations: string[];
  } {
    const userHistory = this.performanceHistory.get(userId);
    
    if (!userHistory || userHistory.length === 0) {
      return {
        averagePerformance: null,
        trendAnalysis: ['No performance data available yet'],
        recommendations: ['Complete more tasks to see performance insights']
      };
    }
    
    // Calculate averages
    const avgResponseTime = userHistory.reduce((sum, m) => sum + m.responseTime, 0) / userHistory.length;
    const avgSuccessRate = userHistory.reduce((sum, m) => sum + m.successRate, 0) / userHistory.length;
    const avgSatisfaction = userHistory.reduce((sum, m) => sum + m.userSatisfactionScore, 0) / userHistory.length;
    
    const averagePerformance: PerformanceMetrics = {
      responseTime: avgResponseTime,
      executionTime: avgResponseTime,
      successRate: avgSuccessRate,
      userSatisfactionScore: avgSatisfaction,
      resourceUsage: {
        memoryUsage: userHistory.reduce((sum, m) => sum + m.resourceUsage.memoryUsage, 0) / userHistory.length,
        cpuUsage: userHistory.reduce((sum, m) => sum + m.resourceUsage.cpuUsage, 0) / userHistory.length,
        browserInstances: Math.round(userHistory.reduce((sum, m) => sum + m.resourceUsage.browserInstances, 0) / userHistory.length),
        activeConnections: Math.round(userHistory.reduce((sum, m) => sum + m.resourceUsage.activeConnections, 0) / userHistory.length),
        cacheHitRate: userHistory.reduce((sum, m) => sum + m.resourceUsage.cacheHitRate, 0) / userHistory.length
      },
      taskComplexity: {
        actionCount: Math.round(userHistory.reduce((sum, m) => sum + m.taskComplexity.actionCount, 0) / userHistory.length),
        requiresAuthentication: userHistory.some(m => m.taskComplexity.requiresAuthentication),
        requiresFormInteraction: userHistory.some(m => m.taskComplexity.requiresFormInteraction),
        crossSiteNavigation: userHistory.some(m => m.taskComplexity.crossSiteNavigation),
        estimatedDuration: userHistory.reduce((sum, m) => sum + m.taskComplexity.estimatedDuration, 0) / userHistory.length
      }
    };
    
    // Generate trend analysis
    const trendAnalysis: string[] = [];
    if (userHistory.length >= 5) {
      const recent = userHistory.slice(-3);
      const older = userHistory.slice(0, -3);
      
      const recentAvgTime = recent.reduce((sum, m) => sum + m.responseTime, 0) / recent.length;
      const olderAvgTime = older.reduce((sum, m) => sum + m.responseTime, 0) / older.length;
      
      if (recentAvgTime < olderAvgTime * 0.9) {
        trendAnalysis.push('✅ Performance is improving - tasks are completing faster');
      } else if (recentAvgTime > olderAvgTime * 1.1) {
        trendAnalysis.push('⚠️ Performance may be declining - tasks are taking longer');
      } else {
        trendAnalysis.push('📊 Performance is stable');
      }
    }
    
    // Generate recommendations
    const recommendations: string[] = [];
    if (avgResponseTime > this.config.performanceThresholds.maxResponseTime) {
      recommendations.push('Consider breaking complex tasks into smaller steps');
    }
    if (avgSuccessRate < this.config.performanceThresholds.minSuccessRate) {
      recommendations.push('Try providing more specific task descriptions');
    }
    if (avgSatisfaction < 3.5) {
      recommendations.push('Review task instructions for clarity and accuracy');
    }
    
    return {
      averagePerformance,
      trendAnalysis,
      recommendations
    };
  }

  /**
   * Cleanup resources when shutting down
   */
  destroy(): void {
    console.log('🔄 Shutting down Enhanced AI Task Manager Integration...');
    
    // Clean up monitoring system
    if (this.monitoringSystem) {
      this.monitoringSystem.destroy();
    }
    
    // Remove event listeners
    this.executionEngine.removeAllListeners();
    
    // Clear caches
    this.performanceHistory.clear();
    this.userSatisfactionScores.clear();
    
    console.log('✅ Enhanced AI Task Manager Integration shut down successfully');
  }

  /**
   * Map execution mode to speed preference
   */
  private mapExecutionModeToSpeed(mode: 'fast' | 'accurate' | 'resource-efficient'): 'fast' | 'medium' | 'slow' {
    switch (mode) {
      case 'fast':
        return 'fast';
      case 'accurate':
        return 'medium';
      case 'resource-efficient':
        return 'slow';
      default:
        return 'medium';
    }
  }
}

export default EnhancedAITaskManagerIntegration;
export type { IntegrationConfig, TaskExecutionContext };
