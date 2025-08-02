const express = require('express');
const cors = require('cors');
const { chromium, firefox } = require('playwright');
const { execSync } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3003;

// Production-ready CORS configuration
const ALLOWED_ORIGINS = [
  'https://resolve25.vercel.app',
  'http://localhost:3000',
  'http://localhost:9002',
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global browser and session management
let browser = null;
const browserSessions = new Map();
const taskQueue = [];
const activeTasks = new Map();

// Browser configuration for production
const BROWSER_CONFIG = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--no-first-run',
    '--no-zygote',
    '--single-process',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding'
  ]
};

// Initialize browser on demand
async function initializeBrowser() {
  if (browser) return browser;
  
  try {
    console.log('🚀 Initializing browser...');
    browser = await chromium.launch(BROWSER_CONFIG);
    console.log('✅ Browser initialized successfully');
    return browser;
  } catch (error) {
    console.error('❌ Failed to initialize browser:', error);
    console.log('🔧 Attempting to install Playwright browsers...');
    
    try {
      // Try to install browsers if they're missing
      const { execSync } = require('child_process');
      execSync('npx playwright install chromium', { stdio: 'inherit' });
      console.log('✅ Playwright browsers installed, retrying...');
      
      browser = await chromium.launch(BROWSER_CONFIG);
      console.log('✅ Browser initialized successfully after installation');
      return browser;
    } catch (installError) {
      console.error('❌ Failed to install browsers:', installError);
      throw error; // Throw original error
    }
  }
}

// Cleanup function
async function cleanup() {
  console.log('🧹 Starting cleanup...');
  
  // Close all browser sessions
  for (const [sessionId, context] of browserSessions) {
    try {
      await context.close();
      console.log(`✅ Closed session: ${sessionId}`);
    } catch (error) {
      console.error(`❌ Error closing session ${sessionId}:`, error);
    }
  }
  browserSessions.clear();
  
  // Close browser
  if (browser) {
    try {
      await browser.close();
      console.log('✅ Browser closed');
    } catch (error) {
      console.error('❌ Error closing browser:', error);
    }
  }
  
  console.log('🧹 Cleanup completed');
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Resolve25 Automation Server', 
    status: 'running',
    version: '1.0.0',
    endpoints: ['/health', '/wake', '/api/automation/submit', '/api/automation/status/:taskId'],
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint for production monitoring
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    browser: browser ? 'active' : 'inactive',
    activeSessions: browserSessions.size,
    timestamp: new Date().toISOString()
  });
});

// Wake-up endpoint for free tier management
app.get('/wake', (req, res) => {
  res.json({ 
    status: 'awake', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'Server is now awake and ready'
  });
});

// Automation API endpoints
app.post('/api/automation/submit', async (req, res) => {
  try {
    const taskData = req.body;
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const task = {
      id: taskId,
      ...taskData,
      status: 'pending',
      createdAt: new Date(),
      retryCount: 0
    };
    
    taskQueue.push(task);
    activeTasks.set(taskId, task);
    
    // Process task immediately (you could also use a queue system)
    processTask(task);
    
    res.json({ taskId, message: 'Task submitted successfully' });
  } catch (error) {
    console.error('Error submitting task:', error);
    res.status(500).json({ error: 'Failed to submit task' });
  }
});

app.get('/api/automation/status/:taskId', (req, res) => {
  const { taskId } = req.params;
  const task = activeTasks.get(taskId);
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  res.json(task);
});

app.get('/api/automation/result/:taskId', (req, res) => {
  const { taskId } = req.params;
  const task = activeTasks.get(taskId);
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  if (task.status !== 'completed' && task.status !== 'failed') {
    return res.status(202).json({ message: 'Task still in progress' });
  }
  
  res.json({
    taskId,
    status: task.status,
    data: task.result,
    error: task.error,
    metadata: {
      duration: task.duration || 0,
      timestamp: task.completedAt || task.createdAt,
      retryCount: task.retryCount,
      performance: task.performance || {}
    }
  });
});

app.post('/api/automation/cancel/:taskId', (req, res) => {
  const { taskId } = req.params;
  const task = activeTasks.get(taskId);
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  task.status = 'cancelled';
  task.completedAt = new Date();
  
  res.json({ success: true, message: 'Task cancelled' });
});

app.get('/api/automation/tasks', (req, res) => {
  const tasks = Array.from(activeTasks.values());
  res.json(tasks);
});

app.get('/api/automation/stats', (req, res) => {
  const tasks = Array.from(activeTasks.values());
  const completed = tasks.filter(t => t.status === 'completed');
  const failed = tasks.filter(t => t.status === 'failed');
  const running = tasks.filter(t => t.status === 'running');
  
  const avgDuration = completed.length > 0 
    ? completed.reduce((sum, t) => sum + (t.duration || 0), 0) / completed.length 
    : 0;
  
  res.json({
    activeTasks: running.length,
    completedTasks: completed.length,
    failedTasks: failed.length,
    totalTasks: tasks.length,
    averageExecutionTime: avgDuration,
    memoryUsage: process.memoryUsage().heapUsed
  });
});

// Task processing function
async function processTask(task) {
  const startTime = Date.now();
  
  try {
    console.log(`🎯 Processing task: ${task.id}`);
    task.status = 'running';
    
    // Initialize browser on demand
    await initializeBrowser();
    
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    
    const page = await context.newPage();
    
    // Execute task actions
    let result = {};
    
    if (task.config && task.config.url) {
      await page.goto(task.config.url, { waitUntil: 'networkidle' });
      
      if (task.config.actions) {
        for (const action of task.config.actions) {
          await executeAction(page, action);
        }
      }
      
      // Extract data if needed
      if (task.type === 'extraction' || task.type === 'workflow') {
        result = await extractData(page, task.config.actions);
      }
    }
    
    await context.close();
    
    task.status = 'completed';
    task.result = result;
    task.completedAt = new Date();
    task.duration = Date.now() - startTime;
    
    console.log(`✅ Task completed: ${task.id} (${task.duration}ms)`);
    
  } catch (error) {
    console.error(`❌ Task failed: ${task.id}`, error);
    task.status = 'failed';
    task.error = error.message;
    task.completedAt = new Date();
    task.duration = Date.now() - startTime;
  }
}

async function executeAction(page, action) {
  switch (action.type) {
    case 'click':
      if (action.selector) {
        await page.click(action.selector);
      }
      break;
    case 'type':
      if (action.selector && action.value) {
        await page.fill(action.selector, action.value);
      }
      break;
    case 'wait':
      if (action.selector) {
        await page.waitForSelector(action.selector, { timeout: action.timeout || 30000 });
      } else {
        await page.waitForTimeout(action.timeout || 1000);
      }
      break;
    case 'scroll':
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      break;
    default:
      console.warn(`Unknown action type: ${action.type}`);
  }
}

async function extractData(page, actions) {
  const extractActions = actions.filter(a => a.type === 'extract');
  const results = {};
  
  for (const action of extractActions) {
    if (action.selector) {
      try {
        const elements = await page.$$(action.selector);
        const data = [];
        
        for (const element of elements) {
          if (action.options && action.options.attribute) {
            const value = await element.getAttribute(action.options.attribute);
            data.push(value);
          } else {
            const text = await element.textContent();
            data.push(text);
          }
        }
        
        results[action.selector] = data;
      } catch (error) {
        console.warn(`Failed to extract from ${action.selector}:`, error.message);
        results[action.selector] = [];
      }
    }
  }
  
  return results;
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  await cleanup();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  await cleanup();
  process.exit(0);
});

process.on('uncaughtException', async (error) => {
  console.error('🚨 Uncaught Exception:', error);
  await cleanup();
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  await cleanup();
  process.exit(1);
});

// Keep-alive mechanism for free tier deployments
if (process.env.NODE_ENV === 'production' && process.env.ENABLE_KEEP_ALIVE === 'true') {
  const WAKE_UP_INTERVAL = 14 * 60 * 1000; // 14 minutes
  const SERVER_URL = process.env.BASE_URL || `https://your-render-url.onrender.com`;
  
  setInterval(async () => {
    try {
      const response = await fetch(`${SERVER_URL}/health`);
      console.log('🔄 Keep-alive ping:', response.status, new Date().toISOString());
    } catch (error) {
      console.log('⚠️ Keep-alive failed:', error.message);
    }
  }, WAKE_UP_INTERVAL);
  
  console.log('🔄 Keep-alive mechanism enabled');
}

// Start server
async function startServer() {
  try {
    // Don't initialize browser at startup - do it on demand
    console.log('🚀 Starting automation server...');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Automation server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔧 Browser: Will initialize on first request`);
      console.log(`📊 Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
