/**
 * Enhanced AI Task Manager Usage Example
 * 
 * This file demonstrates how to integrate and use all the enhanced AI Task Manager modules
 * in a real application scenario.
 */

import React, { useState, useEffect } from 'react';
import EnhancedAITaskManagerIntegration, { 
  type IntegrationConfig, 
  type TaskExecutionContext 
} from '@/services/enhanced-ai-task-manager-integration';
import EnhancedAITaskManager from '@/components/enhanced-ai-task-manager';
import { 
  type PerformanceMetrics,
  type UserFeedback 
} from '@/services/enhanced-ai-performance';

// Example configuration for the enhanced AI Task Manager
const enhancedConfig: IntegrationConfig = {
  enablePerformanceOptimization: true,
  enableAdvancedMonitoring: true,
  enableResourceManagement: true,
  enableAdaptiveExecution: true,
  enableUserFeedbackLoop: true,
  enableABTesting: false, // Can be enabled for A/B testing
  performanceThresholds: {
    maxResponseTime: 3000, // 3 seconds
    maxMemoryUsage: 150 * 1024 * 1024, // 150MB
    minSuccessRate: 0.92 // 92% success rate
  }
};

// Example component showing integration
export const EnhancedAITaskManagerExample: React.FC = () => {
  const [integration, setIntegration] = useState<EnhancedAITaskManagerIntegration | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [performanceInsights, setPerformanceInsights] = useState<any>(null);

  // Initialize the enhanced integration
  useEffect(() => {
    const initializeIntegration = async () => {
      try {
        const enhancedIntegration = new EnhancedAITaskManagerIntegration(enhancedConfig);
        setIntegration(enhancedIntegration);
        console.log('✅ Enhanced AI Task Manager Integration initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize Enhanced AI Task Manager:', error);
      }
    };

    initializeIntegration();

    // Prevent accidental fullscreen
    const preventFullscreen = (event: KeyboardEvent) => {
      if (event.key === 'F11' || (event.altKey && event.key === 'Enter')) {
        event.preventDefault();
        console.log('Fullscreen prevented');
      }
    };

    // Prevent double-click fullscreen on elements
    const preventDoubleClickFullscreen = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target && (target.tagName === 'DIV' || target.tagName === 'SECTION')) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener('keydown', preventFullscreen);
    document.addEventListener('dblclick', preventDoubleClickFullscreen);

    // Cleanup on unmount
    return () => {
      integration?.destroy();
      document.removeEventListener('keydown', preventFullscreen);
      document.removeEventListener('dblclick', preventDoubleClickFullscreen);
    };
  }, []);

  // Handle task execution with enhanced features
  const handleEnhancedTaskExecution = async (userInput: string) => {
    if (!integration) {
      console.error('Integration not initialized');
      return;
    }

    setIsLoading(true);
    setResults(null);

    try {
      // Create execution context with user's device and preferences
      const executionContext: TaskExecutionContext = {
        sessionId: `session_${Date.now()}`,
        userId: 'demo_user_123',
        deviceInfo: {
          type: 'desktop',
          os: navigator.platform,
          browser: 'Chrome',
          screenResolution: {
            width: window.screen.width,
            height: window.screen.height
          },
          touchCapable: 'ontouchstart' in window,
          performanceClass: 'high' // Could be detected dynamically
        },
        networkConditions: {
          speed: 'fast', // Could be detected using Network Information API
          latency: 50,
          connectionType: 'wifi',
          reliability: 0.95
        },
        browserCapabilities: {
          jsEnabled: true,
          cookiesEnabled: navigator.cookieEnabled,
          localStorage: typeof(Storage) !== 'undefined',
          webGL: !!window.WebGLRenderingContext,
          supportedFeatures: ['automation', 'websockets', 'webworkers']
        },
        userPreferences: {
          preferredExecutionMode: 'fast',
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
            keyboardNavigation: false,
            reducedMotion: false
          }
        }
      };

      // Session context for AI analysis
      const sessionContext = {
        recentActions: [],
        browserState: 'idle' as const
      };

      console.log('🚀 Executing enhanced AI task:', userInput);

      // Execute the task with all enhancements
      const result = await integration.executeEnhancedTask(
        userInput,
        sessionContext,
        executionContext
      );

      setResults(result);
      
      console.log('✅ Enhanced task execution completed:', result);

      // Get performance insights
      const insights = integration.getPerformanceInsights(executionContext.userId);
      setPerformanceInsights(insights);

    } catch (error) {
      console.error('❌ Enhanced task execution failed:', error);
      setResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle user feedback submission
  const handleFeedbackSubmission = async (taskId: string, feedback: Omit<UserFeedback, 'taskId'>) => {
    if (!integration) return;

    try {
      await integration.submitUserFeedback(taskId, feedback);
      console.log('📝 User feedback submitted successfully');
      
      // Refresh performance insights after feedback
      const insights = integration.getPerformanceInsights('demo_user_123');
      setPerformanceInsights(insights);
    } catch (error) {
      console.error('❌ Failed to submit feedback:', error);
    }
  };

  return (
    <div className="enhanced-ai-task-manager-example">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          🤖 Enhanced AI Task Manager
        </h1>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">
            🚀 Advanced Features Enabled
          </h2>
          <ul className="text-blue-800 space-y-1">
            <li>✅ Performance Optimization</li>
            <li>✅ Advanced Monitoring</li>
            <li>✅ Resource Management</li>
            <li>✅ Adaptive Execution</li>
            <li>✅ User Feedback Loop</li>
          </ul>
        </div>

        {/* Enhanced AI Task Manager Component */}
        <div className="mb-8">
          <EnhancedAITaskManager
            onTaskSubmit={handleEnhancedTaskExecution}
            isLoading={isLoading}
            results={results}
            onFeedbackSubmit={handleFeedbackSubmission}
          />
        </div>

        {/* Performance Insights */}
        {performanceInsights && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-green-900 mb-4">
              📊 Performance Insights
            </h3>
            
            {performanceInsights.averagePerformance && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white p-4 rounded-lg shadow">
                  <h4 className="font-medium text-gray-700">Response Time</h4>
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.round(performanceInsights.averagePerformance.responseTime)}ms
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <h4 className="font-medium text-gray-700">Success Rate</h4>
                  <p className="text-2xl font-bold text-green-600">
                    {Math.round(performanceInsights.averagePerformance.successRate * 100)}%
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <h4 className="font-medium text-gray-700">User Satisfaction</h4>
                  <p className="text-2xl font-bold text-purple-600">
                    {performanceInsights.averagePerformance.userSatisfactionScore.toFixed(1)}/5
                  </p>
                </div>
              </div>
            )}

            {/* Trend Analysis */}
            {performanceInsights.trendAnalysis.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">📈 Trend Analysis</h4>
                <ul className="space-y-1">
                  {performanceInsights.trendAnalysis.map((trend: string, index: number) => (
                    <li key={index} className="text-gray-600">{trend}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {performanceInsights.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">💡 Recommendations</h4>
                <ul className="space-y-1">
                  {performanceInsights.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="text-gray-600">• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Integration Status */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            🔧 Integration Status
          </h3>
          <div className="flex items-center space-x-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              integration 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {integration ? '✅ Connected' : '❌ Not Connected'}
            </span>
            {integration && (
              <span className="text-gray-600 text-sm">
                All enhanced features are active and monitoring
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Example usage in a page or app
export const ExampleUsagePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <EnhancedAITaskManagerExample />
    </div>
  );
};

// Example of programmatic usage without UI
export const programmaticExample = async () => {
  // Initialize enhanced integration
  const integration = new EnhancedAITaskManagerIntegration({
    enablePerformanceOptimization: true,
    enableAdvancedMonitoring: true,
    enableResourceManagement: true,
    enableAdaptiveExecution: true,
    enableUserFeedbackLoop: true,
    enableABTesting: false,
    performanceThresholds: {
      maxResponseTime: 5000,
      maxMemoryUsage: 200 * 1024 * 1024,
      minSuccessRate: 0.90
    }
  });

  try {
    // Example task execution
    const result = await integration.executeEnhancedTask(
      'Navigate to Google and search for "AI automation tools"',
      { recentActions: [], browserState: 'idle' },
      {
        sessionId: 'example_session_123',
        userId: 'example_user_456',
        deviceInfo: {
          type: 'desktop',
          os: 'macOS',
          browser: 'Chrome',
          screenResolution: { width: 1920, height: 1080 },
          touchCapable: false,
          performanceClass: 'high'
        },
        networkConditions: {
          speed: 'fast',
          latency: 30,
          connectionType: 'wifi',
          reliability: 0.98
        },
        browserCapabilities: {
          jsEnabled: true,
          cookiesEnabled: true,
          localStorage: true,
          webGL: true,
          supportedFeatures: ['automation', 'websockets']
        },
        userPreferences: {
          preferredExecutionMode: 'fast',
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
            keyboardNavigation: false,
            reducedMotion: false
          }
        }
      }
    );

    console.log('Task Result:', result);

    // Submit feedback
    if (result.success) {
      await integration.submitUserFeedback(result.sessionId, {
        rating: 5,
        feedback: 'Task completed successfully and quickly!',
        timestamp: new Date(),
        completionTime: result.performance.executionTime,
        improvementSuggestions: ['Keep up the great performance']
      });
    }

    // Get performance insights
    const insights = integration.getPerformanceInsights('example_user_456');
    console.log('Performance Insights:', insights);

  } catch (error) {
    console.error('Error in programmatic example:', error);
  } finally {
    // Cleanup
    integration.destroy();
  }
};

export default EnhancedAITaskManagerExample;
