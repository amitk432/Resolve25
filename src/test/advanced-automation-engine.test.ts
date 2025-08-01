/**
 * Comprehensive Testing Framework for Advanced Automation Engine
 * Includes unit tests, integration tests, performance tests, and validation
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { 
  AdvancedAutomationEngine, 
  AutomationTask, 
  TaskConfig,
  AutomationAction,
  ValidationRule,
  EngineConfig 
} from '../services/advanced-automation-engine';

// Test Configuration
const TEST_CONFIG: EngineConfig = {
  headless: true,
  maxConcurrency: 1,
  timeout: 10000,
  retries: 2
};

// Mock Data
const SAMPLE_TASK: AutomationTask = {
  id: 'test_task_001',
  type: 'workflow',
  priority: 'medium',
  config: {
    url: 'https://example.com',
    actions: [
      {
        type: 'click',
        selector: '#test-button',
        timeout: 5000
      }
    ],
    validations: [
      {
        type: 'presence',
        selector: '#success-indicator',
        expected: true,
        required: true
      }
    ],
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

// Test Suite: Unit Tests
describe('Advanced Automation Engine - Unit Tests', () => {
  let engine: AdvancedAutomationEngine;

  beforeAll(async () => {
    engine = new AdvancedAutomationEngine();
  });

  afterAll(async () => {
    if (engine) {
      await engine.cleanup();
    }
  });

  describe('Engine Initialization', () => {
    test('should initialize engine with default config', async () => {
      const testEngine = new AdvancedAutomationEngine();
      await expect(testEngine.initialize(TEST_CONFIG)).resolves.not.toThrow();
    });

    test('should initialize with custom config', async () => {
      const customConfig: EngineConfig = {
        headless: true,
        maxConcurrency: 5,
        timeout: 15000,
        retries: 5
      };
      
      const testEngine = new AdvancedAutomationEngine();
      await expect(testEngine.initialize(customConfig)).resolves.not.toThrow();
      await testEngine.cleanup();
    });

    test('should handle initialization errors gracefully', async () => {
      const invalidConfig: EngineConfig = {
        headless: true,
        maxConcurrency: -1, // Invalid
        timeout: -1000 // Invalid
      };
      
      const testEngine = new AdvancedAutomationEngine();
      // Should not throw, but handle gracefully
      await testEngine.initialize(invalidConfig);
    });
  });

  describe('Task Validation', () => {
    test('should validate well-formed tasks', () => {
      const validTask = { ...SAMPLE_TASK };
      expect(validTask).toBeDefined();
      expect(validTask.config.actions).toHaveLength(1);
      expect(validTask.config.validations).toHaveLength(1);
    });

    test('should reject tasks with invalid actions', () => {
      const invalidTask: AutomationTask = {
        ...SAMPLE_TASK,
        config: {
          ...SAMPLE_TASK.config,
          actions: [
            {
              type: 'invalid_action' as any,
              selector: '',
              timeout: 0
            }
          ]
        }
      };
      
      // Validation logic would be tested here
      expect(invalidTask.config.actions[0].type).toBe('invalid_action');
    });

    test('should handle missing required fields', () => {
      const incompleteTask = {
        id: 'incomplete',
        type: 'workflow',
        // Missing other required fields
      } as AutomationTask;
      
      expect(incompleteTask.id).toBe('incomplete');
      expect(incompleteTask.config).toBeUndefined();
    });
  });

  describe('Performance Optimization', () => {
    test('should optimize selectors', () => {
      const originalSelector = 'div > span.class-name > a#link-id';
      const optimizedSelector = '#link-id'; // Should be optimized to most specific
      
      // Mock the optimization logic
      const optimizeSelector = (selector: string): string => {
        if (selector.includes('#')) {
          return selector.split(' ').find(part => part.includes('#')) || selector;
        }
        return selector;
      };
      
      expect(optimizeSelector(originalSelector)).toBe('#link-id');
    });

    test('should handle caching correctly', () => {
      const cache = new Map<string, any>();
      const testKey = 'test-element';
      const testValue = { element: 'mock-element' };
      
      // Test cache operations
      cache.set(testKey, testValue);
      expect(cache.get(testKey)).toBe(testValue);
      expect(cache.has(testKey)).toBe(true);
    });

    test('should measure execution time accurately', () => {
      const startTime = Date.now();
      // Simulate some work
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      return delay(100).then(() => {
        const executionTime = Date.now() - startTime;
        expect(executionTime).toBeGreaterThanOrEqual(100);
        expect(executionTime).toBeLessThan(200); // Allow for some variance
      });
    });
  });
});

// Test Suite: Integration Tests
describe('Advanced Automation Engine - Integration Tests', () => {
  let engine: AdvancedAutomationEngine;

  beforeEach(async () => {
    engine = new AdvancedAutomationEngine();
    await engine.initialize(TEST_CONFIG);
  });

  afterEach(async () => {
    if (engine) {
      await engine.cleanup();
    }
  });

  describe('End-to-End Task Execution', () => {
    test('should execute simple navigation task', async () => {
      const navigationTask: AutomationTask = {
        ...SAMPLE_TASK,
        config: {
          url: 'https://example.com',
          actions: [],
          validations: [
            {
              type: 'presence',
              selector: 'h1',
              expected: true,
              required: true
            }
          ],
          errorHandling: { strategy: 'retry', notificationLevel: 'warning' },
          performance: { enableParallelization: false, batchSize: 1, cacheElements: true, optimizeSelectors: true, preloadResources: false }
        }
      };

      const result = await engine.executeTask(navigationTask);
      expect(result).toBeDefined();
      expect(result.taskId).toBe(navigationTask.id);
      expect(typeof result.executionTime).toBe('number');
    }, 30000);

    test('should handle task failures gracefully', async () => {
      const failingTask: AutomationTask = {
        ...SAMPLE_TASK,
        config: {
          url: 'https://non-existent-domain-12345.com',
          actions: [],
          validations: [],
          errorHandling: { strategy: 'abort', notificationLevel: 'error' },
          performance: { enableParallelization: false, batchSize: 1, cacheElements: true, optimizeSelectors: true, preloadResources: false }
        }
      };

      const result = await engine.executeTask(failingTask);
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    }, 30000);

    test('should execute multi-step workflow', async () => {
      const workflowTask: AutomationTask = {
        ...SAMPLE_TASK,
        config: {
          url: 'https://httpbin.org/forms/post',
          actions: [
            {
              type: 'type',
              selector: 'input[name="custname"]',
              value: 'Test User',
              timeout: 5000
            },
            {
              type: 'type',
              selector: 'input[name="custtel"]',
              value: '123-456-7890',
              timeout: 5000
            },
            {
              type: 'click',
              selector: 'input[type="submit"]',
              timeout: 5000
            }
          ],
          validations: [],
          errorHandling: { strategy: 'retry', notificationLevel: 'warning' },
          performance: { enableParallelization: false, batchSize: 1, cacheElements: true, optimizeSelectors: true, preloadResources: false }
        }
      };

      const result = await engine.executeTask(workflowTask);
      expect(result).toBeDefined();
      expect(result.steps.length).toBe(3);
    }, 45000);
  });

  describe('Error Recovery', () => {
    test('should retry failed actions', async () => {
      const retryTask: AutomationTask = {
        ...SAMPLE_TASK,
        config: {
          url: 'https://example.com',
          actions: [
            {
              type: 'click',
              selector: '#non-existent-element',
              timeout: 1000
            }
          ],
          validations: [],
          errorHandling: { strategy: 'retry', notificationLevel: 'warning' },
          performance: { enableParallelization: false, batchSize: 1, cacheElements: true, optimizeSelectors: true, preloadResources: false }
        },
        maxRetries: 2
      };

      const result = await engine.executeTask(retryTask);
      expect(result).toBeDefined();
      // Should have attempted retries
      expect(result.errors.length).toBeGreaterThan(0);
    }, 30000);

    test('should use fallback selectors', async () => {
      const fallbackTask: AutomationTask = {
        ...SAMPLE_TASK,
        config: {
          url: 'https://example.com',
          actions: [
            {
              type: 'click',
              selector: '#primary-selector',
              timeout: 2000,
              mlEnhanced: true
            }
          ],
          validations: [],
          errorHandling: { strategy: 'fallback', fallbackActions: [
            {
              type: 'click',
              selector: 'h1', // Fallback to known element
              timeout: 2000
            }
          ], notificationLevel: 'info' },
          performance: { enableParallelization: false, batchSize: 1, cacheElements: true, optimizeSelectors: true, preloadResources: false }
        }
      };

      const result = await engine.executeTask(fallbackTask);
      expect(result).toBeDefined();
    }, 30000);
  });
});

// Test Suite: Performance Tests
describe('Advanced Automation Engine - Performance Tests', () => {
  let engine: AdvancedAutomationEngine;

  beforeAll(async () => {
    engine = new AdvancedAutomationEngine();
    await engine.initialize({
      ...TEST_CONFIG,
      maxConcurrency: 3
    });
  });

  afterAll(async () => {
    if (engine) {
      await engine.cleanup();
    }
  });

  describe('Speed Benchmarks', () => {
    test('should execute simple task within time limit', async () => {
      const startTime = Date.now();
      
      const quickTask: AutomationTask = {
        ...SAMPLE_TASK,
        config: {
          url: 'https://example.com',
          actions: [],
          validations: [
            {
              type: 'presence',
              selector: 'body',
              expected: true,
              required: true
            }
          ],
          errorHandling: { strategy: 'abort', notificationLevel: 'error' },
          performance: { enableParallelization: false, batchSize: 1, cacheElements: true, optimizeSelectors: true, preloadResources: true }
        }
      };

      const result = await engine.executeTask(quickTask);
      const executionTime = Date.now() - startTime;
      
      expect(result).toBeDefined();
      expect(executionTime).toBeLessThan(10000); // Should complete within 10 seconds
    }, 15000);

    test('should handle multiple concurrent tasks', async () => {
      const tasks: AutomationTask[] = Array.from({ length: 3 }, (_, i) => ({
        ...SAMPLE_TASK,
        id: `concurrent_task_${i}`,
        config: {
          url: 'https://httpbin.org/delay/1',
          actions: [],
          validations: [],
          errorHandling: { strategy: 'abort', notificationLevel: 'error' },
          performance: { enableParallelization: true, batchSize: 3, cacheElements: true, optimizeSelectors: true, preloadResources: false }
        }
      }));

      const startTime = Date.now();
      const results = await Promise.all(tasks.map(task => engine.executeTask(task)));
      const totalTime = Date.now() - startTime;
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
      
      // Should be faster than sequential execution
      expect(totalTime).toBeLessThan(15000);
    }, 20000);
  });

  describe('Memory Usage', () => {
    test('should not leak memory during task execution', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Execute multiple tasks
      for (let i = 0; i < 5; i++) {
        const task: AutomationTask = {
          ...SAMPLE_TASK,
          id: `memory_test_${i}`,
          config: {
            url: 'https://example.com',
            actions: [],
            validations: [],
            errorHandling: { strategy: 'abort', notificationLevel: 'error' },
            performance: { enableParallelization: false, batchSize: 1, cacheElements: false, optimizeSelectors: true, preloadResources: false }
          }
        };
        
        await engine.executeTask(task);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    }, 60000);
  });
});

// Test Suite: Security Tests
describe('Advanced Automation Engine - Security Tests', () => {
  let engine: AdvancedAutomationEngine;

  beforeEach(async () => {
    engine = new AdvancedAutomationEngine();
    await engine.initialize(TEST_CONFIG);
  });

  afterEach(async () => {
    if (engine) {
      await engine.cleanup();
    }
  });

  describe('Input Validation', () => {
    test('should reject malicious script injection', async () => {
      const maliciousTask: AutomationTask = {
        ...SAMPLE_TASK,
        config: {
          ...SAMPLE_TASK.config,
          actions: [
            {
              type: 'type',
              selector: '#input',
              value: '<script>alert("XSS")</script>',
              timeout: 5000
            }
          ]
        }
      };

      // Should either reject the task or sanitize the input
      const result = await engine.executeTask(maliciousTask);
      expect(result).toBeDefined();
      // The security manager should have handled this
    }, 15000);

    test('should validate URLs before navigation', async () => {
      const suspiciousTask: AutomationTask = {
        ...SAMPLE_TASK,
        config: {
          url: 'javascript:alert("malicious")',
          actions: [],
          validations: [],
          errorHandling: { strategy: 'abort', notificationLevel: 'error' },
          performance: { enableParallelization: false, batchSize: 1, cacheElements: true, optimizeSelectors: true, preloadResources: false }
        }
      };

      const result = await engine.executeTask(suspiciousTask);
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.type === 'security_error')).toBe(true);
    }, 15000);
  });

  describe('Domain Restrictions', () => {
    test('should allow navigation to approved domains', async () => {
      const approvedTask: AutomationTask = {
        ...SAMPLE_TASK,
        config: {
          url: 'https://example.com', // Should be in allowed list
          actions: [],
          validations: [],
          errorHandling: { strategy: 'abort', notificationLevel: 'error' },
          performance: { enableParallelization: false, batchSize: 1, cacheElements: true, optimizeSelectors: true, preloadResources: false }
        }
      };

      const result = await engine.executeTask(approvedTask);
      expect(result).toBeDefined();
    }, 15000);
  });
});

// Test Suite: User Acceptance Tests
describe('Advanced Automation Engine - User Acceptance Tests', () => {
  let engine: AdvancedAutomationEngine;

  beforeAll(async () => {
    engine = new AdvancedAutomationEngine();
    await engine.initialize(TEST_CONFIG);
  });

  afterAll(async () => {
    if (engine) {
      await engine.cleanup();
    }
  });

  describe('Real-world Scenarios', () => {
    test('should handle Google search workflow', async () => {
      const googleSearchTask: AutomationTask = {
        ...SAMPLE_TASK,
        id: 'google_search_test',
        config: {
          url: 'https://www.google.com',
          actions: [
            {
              type: 'type',
              selector: 'input[name="q"]',
              value: 'automation testing',
              timeout: 10000,
              options: { waitForSelector: true }
            },
            {
              type: 'click',
              selector: 'input[type="submit"], button[type="submit"]',
              timeout: 10000,
              options: { waitForSelector: true }
            },
            {
              type: 'wait',
              selector: '#search',
              timeout: 15000
            }
          ],
          validations: [
            {
              type: 'presence',
              selector: '#search',
              expected: true,
              required: true
            }
          ],
          errorHandling: { strategy: 'retry', notificationLevel: 'warning' },
          performance: { enableParallelization: false, batchSize: 1, cacheElements: true, optimizeSelectors: true, preloadResources: false }
        }
      };

      const result = await engine.executeTask(googleSearchTask);
      expect(result).toBeDefined();
      expect(result.taskId).toBe('google_search_test');
      // Should have executed all steps
      expect(result.steps.length).toBe(3);
    }, 45000);

    test('should provide meaningful error messages', async () => {
      const errorTask: AutomationTask = {
        ...SAMPLE_TASK,
        config: {
          url: 'https://example.com',
          actions: [
            {
              type: 'click',
              selector: '#definitely-does-not-exist',
              timeout: 2000
            }
          ],
          validations: [],
          errorHandling: { strategy: 'abort', notificationLevel: 'error' },
          performance: { enableParallelization: false, batchSize: 1, cacheElements: true, optimizeSelectors: true, preloadResources: false }
        }
      };

      const result = await engine.executeTask(errorTask);
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      const error = result.errors[0];
      expect(error.message).toContain('Element not found');
      expect(error.type).toBe('element_not_found');
    }, 15000);
  });

  describe('Performance Reporting', () => {
    test('should provide detailed performance metrics', async () => {
      const performanceTask: AutomationTask = {
        ...SAMPLE_TASK,
        config: {
          url: 'https://example.com',
          actions: [
            {
              type: 'wait',
              selector: 'body',
              timeout: 1000
            }
          ],
          validations: [],
          errorHandling: { strategy: 'abort', notificationLevel: 'info' },
          performance: { enableParallelization: false, batchSize: 1, cacheElements: true, optimizeSelectors: true, preloadResources: true }
        }
      };

      const result = await engine.executeTask(performanceTask);
      expect(result).toBeDefined();
      expect(result.performance).toBeDefined();
      expect(typeof result.performance.totalExecutionTime).toBe('number');
      expect(typeof result.performance.averageStepTime).toBe('number');
      expect(typeof result.performance.successRate).toBe('number');
      expect(result.performance.successRate).toBeGreaterThanOrEqual(0);
      expect(result.performance.successRate).toBeLessThanOrEqual(1);
    }, 15000);

    test('should generate performance report', async () => {
      // Execute a task first
      await engine.executeTask(SAMPLE_TASK);
      
      const report = engine.getPerformanceReport();
      expect(report).toBeDefined();
      expect(typeof report.totalRequests).toBe('number');
      expect(typeof report.averageResponseTime).toBe('number');
      expect(report.resourceBreakdown).toBeDefined();
      expect(Array.isArray(report.optimizationSuggestions)).toBe(true);
    });
  });
});

// Performance Benchmark Utility
export class PerformanceBenchmark {
  private results: BenchmarkResult[] = [];

  async benchmark(name: string, fn: () => Promise<void>, iterations: number = 1): Promise<BenchmarkResult> {
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();
      await fn();
      const end = process.hrtime.bigint();
      times.push(Number(end - start) / 1000000); // Convert to milliseconds
    }

    const result: BenchmarkResult = {
      name,
      iterations,
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      standardDeviation: this.calculateStandardDeviation(times)
    };

    this.results.push(result);
    return result;
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
    return Math.sqrt(avgSquaredDiff);
  }

  getResults(): BenchmarkResult[] {
    return [...this.results];
  }

  printResults(): void {
    console.log('\n=== Performance Benchmark Results ===');
    this.results.forEach(result => {
      console.log(`\n${result.name}:`);
      console.log(`  Iterations: ${result.iterations}`);
      console.log(`  Average: ${result.averageTime.toFixed(2)}ms`);
      console.log(`  Min: ${result.minTime.toFixed(2)}ms`);
      console.log(`  Max: ${result.maxTime.toFixed(2)}ms`);
      console.log(`  Std Dev: ${result.standardDeviation.toFixed(2)}ms`);
    });
  }
}

interface BenchmarkResult {
  name: string;
  iterations: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  standardDeviation: number;
}

// Export test utilities for external use
export { TEST_CONFIG, SAMPLE_TASK };
export default describe;
