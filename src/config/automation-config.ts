/**
 * Advanced Automation Engine Configuration
 * Centralized configuration for performance, security, and behavior settings
 */

export interface AutomationConfig {
  engine: EngineSettings;
  performance: PerformanceSettings;
  security: SecuritySettings;
  monitoring: MonitoringSettings;
  ui: UISettings;
}

export interface EngineSettings {
  headless: boolean;
  maxConcurrency: number;
  defaultTimeout: number;
  defaultRetries: number;
  viewport: {
    width: number;
    height: number;
  };
  userAgent: string;
  browserArgs: string[];
}

export interface PerformanceSettings {
  enableCaching: boolean;
  cacheTimeout: number;
  enableParallelization: boolean;
  batchSize: number;
  optimizeSelectors: boolean;
  preloadResources: boolean;
  resourceFiltering: {
    blockImages: boolean;
    blockCSS: boolean;
    blockFonts: boolean;
    allowedResourceTypes: string[];
  };
}

export interface SecuritySettings {
  allowedDomains: string[];
  blockedPatterns: RegExp[];
  enableInputValidation: boolean;
  enableScriptBlocking: boolean;
  enableSSLVerification: boolean;
  maxRequestSize: number;
  requestTimeout: number;
}

export interface MonitoringSettings {
  enableRealTimeLogs: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enablePerformanceTracking: boolean;
  enableErrorTracking: boolean;
  screenshotOnError: boolean;
  maxLogEntries: number;
}

export interface UISettings {
  theme: 'light' | 'dark' | 'auto';
  defaultTab: string;
  enableAnimations: boolean;
  autoSaveInterval: number;
  maxRecentTasks: number;
}

// Default Configuration
export const DEFAULT_CONFIG: AutomationConfig = {
  engine: {
    headless: false,
    maxConcurrency: 3,
    defaultTimeout: 30000,
    defaultRetries: 3,
    viewport: {
      width: 1920,
      height: 1080
    },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    browserArgs: [
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ]
  },
  
  performance: {
    enableCaching: true,
    cacheTimeout: 300000, // 5 minutes
    enableParallelization: true,
    batchSize: 5,
    optimizeSelectors: true,
    preloadResources: false,
    resourceFiltering: {
      blockImages: false,
      blockCSS: false,
      blockFonts: false,
      allowedResourceTypes: ['document', 'script', 'xhr', 'fetch']
    }
  },
  
  security: {
    allowedDomains: [
      'localhost',
      '127.0.0.1',
      'example.com',
      'httpbin.org',
      'google.com',
      'github.com',
      'stackoverflow.com'
    ],
    blockedPatterns: [
      /eval\(/gi,
      /document\.write/gi,
      /innerHTML\s*=/gi,
      /javascript:/gi,
      /<script/gi
    ],
    enableInputValidation: true,
    enableScriptBlocking: true,
    enableSSLVerification: true,
    maxRequestSize: 10485760, // 10MB
    requestTimeout: 30000
  },
  
  monitoring: {
    enableRealTimeLogs: true,
    logLevel: 'info',
    enablePerformanceTracking: true,
    enableErrorTracking: true,
    screenshotOnError: true,
    maxLogEntries: 1000
  },
  
  ui: {
    theme: 'auto',
    defaultTab: 'designer',
    enableAnimations: true,
    autoSaveInterval: 30000, // 30 seconds
    maxRecentTasks: 10
  }
};

// Environment-specific configurations
export const DEVELOPMENT_CONFIG: Partial<AutomationConfig> = {
  engine: {
    ...DEFAULT_CONFIG.engine,
    headless: false
  },
  monitoring: {
    ...DEFAULT_CONFIG.monitoring,
    logLevel: 'debug',
    screenshotOnError: true
  }
};

export const PRODUCTION_CONFIG: Partial<AutomationConfig> = {
  engine: {
    ...DEFAULT_CONFIG.engine,
    headless: true,
    maxConcurrency: 5
  },
  performance: {
    ...DEFAULT_CONFIG.performance,
    enableParallelization: true,
    batchSize: 10
  },
  monitoring: {
    ...DEFAULT_CONFIG.monitoring,
    logLevel: 'warn',
    screenshotOnError: false
  }
};

export const TESTING_CONFIG: Partial<AutomationConfig> = {
  engine: {
    ...DEFAULT_CONFIG.engine,
    headless: true,
    maxConcurrency: 1,
    defaultTimeout: 10000
  },
  performance: {
    ...DEFAULT_CONFIG.performance,
    enableCaching: false,
    enableParallelization: false
  },
  monitoring: {
    ...DEFAULT_CONFIG.monitoring,
    logLevel: 'debug',
    maxLogEntries: 100
  }
};

// Configuration Manager
export class ConfigurationManager {
  private static instance: ConfigurationManager;
  private config: AutomationConfig;

  private constructor() {
    this.config = this.loadConfiguration();
  }

  public static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  private loadConfiguration(): AutomationConfig {
    const environment = process.env.NODE_ENV || 'development';
    
    let envConfig: Partial<AutomationConfig>;
    switch (environment) {
      case 'production':
        envConfig = PRODUCTION_CONFIG;
        break;
      case 'test':
        envConfig = TESTING_CONFIG;
        break;
      default:
        envConfig = DEVELOPMENT_CONFIG;
    }

    // Merge default config with environment-specific config
    return this.mergeConfigs(DEFAULT_CONFIG, envConfig);
  }

  private mergeConfigs(base: AutomationConfig, override: Partial<AutomationConfig>): AutomationConfig {
    return {
      engine: { ...base.engine, ...override.engine },
      performance: { ...base.performance, ...override.performance },
      security: { ...base.security, ...override.security },
      monitoring: { ...base.monitoring, ...override.monitoring },
      ui: { ...base.ui, ...override.ui }
    };
  }

  public getConfig(): AutomationConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<AutomationConfig>): void {
    this.config = this.mergeConfigs(this.config, updates);
    this.saveConfiguration();
  }

  public resetConfig(): void {
    this.config = this.loadConfiguration();
    this.saveConfiguration();
  }

  private saveConfiguration(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('automation_config', JSON.stringify(this.config));
      }
    } catch (error) {
      console.warn('Failed to save configuration to localStorage:', error);
    }
  }

  public exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  public importConfig(configJson: string): boolean {
    try {
      const importedConfig = JSON.parse(configJson);
      this.validateConfig(importedConfig);
      this.config = importedConfig;
      this.saveConfiguration();
      return true;
    } catch (error) {
      console.error('Failed to import configuration:', error);
      return false;
    }
  }

  private validateConfig(config: any): void {
    // Basic validation - extend as needed
    if (!config.engine || !config.performance || !config.security || !config.monitoring || !config.ui) {
      throw new Error('Invalid configuration structure');
    }

    if (typeof config.engine.maxConcurrency !== 'number' || config.engine.maxConcurrency < 1) {
      throw new Error('Invalid maxConcurrency value');
    }

    if (typeof config.engine.defaultTimeout !== 'number' || config.engine.defaultTimeout < 1000) {
      throw new Error('Invalid defaultTimeout value');
    }

    // Add more validation rules as needed
  }
}

// Utility functions
export function getOptimalConcurrency(): number {
  // Determine optimal concurrency based on system resources
  const cpuCores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
  return Math.max(2, Math.min(cpuCores, 8));
}

export function getOptimalTimeout(actionType: string): number {
  // Return optimal timeout based on action type
  const timeouts: Record<string, number> = {
    click: 5000,
    type: 3000,
    navigate: 15000,
    wait: 10000,
    extract: 8000,
    scroll: 2000,
    select: 4000
  };
  
  return timeouts[actionType] || DEFAULT_CONFIG.engine.defaultTimeout;
}

export function isSecureDomain(url: string, allowedDomains: string[]): boolean {
  try {
    const domain = new URL(url).hostname;
    return allowedDomains.some(allowed => 
      domain === allowed || domain.endsWith('.' + allowed)
    );
  } catch {
    return false;
  }
}

export function sanitizeInput(input: string, blockedPatterns: RegExp[]): string {
  let sanitized = input;
  
  // Remove blocked patterns
  blockedPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  // Basic HTML encoding
  sanitized = sanitized
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return sanitized.trim();
}

// Export singleton instance
export const configManager = ConfigurationManager.getInstance();

export default {
  DEFAULT_CONFIG,
  DEVELOPMENT_CONFIG,
  PRODUCTION_CONFIG,
  TESTING_CONFIG,
  ConfigurationManager,
  configManager,
  getOptimalConcurrency,
  getOptimalTimeout,
  isSecureDomain,
  sanitizeInput
};
