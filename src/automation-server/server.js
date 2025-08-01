const express = requir// Health check endpoint for production monitoring
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

// Keep-alive mechanism for free tier deployments
if (process.env.NODE_ENV === 'production' && process.env.ENABLE_KEEP_ALIVE === 'true') {
  const WAKE_UP_INTERVAL = 14 * 60 * 1000; // 14 minutes
  const SERVER_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
  
  setInterval(async () => {
    try {
      const response = await fetch(`${SERVER_URL}/health`);
      console.log('🔄 Keep-alive ping:', response.status, new Date().toISOString());
    } catch (error) {
      console.log('⚠️ Keep-alive failed:', error.message);
    }
  }, WAKE_UP_INTERVAL);
  
  console.log('🔄 Keep-alive mechanism enabled');
});
const cors = require('cors');
const { chromium, firefox } = require('playwright');

const app = express();
const PORT = process.env.PORT || 3003;

// Production-ready CORS configuration
const ALLOWED_ORIGINS = [
  'https://resolve25.vercel.app', // Your Vercel domain
  'http://localhost:3000',
  'http://localhost:9002',
  // Add your actual Vercel URL here
];

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? ALLOWED_ORIGINS : true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

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

// Store active browser instances and sessions
let browser = null;
let activeTasks = new Map();
let browserSessions = new Map(); // sessionId -> { page, context }

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down server...');
  if (browser) {
    await browser.close();
  }
  browserSessions.clear();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down server...');
  if (browser) {
    await browser.close();
  }
  browserSessions.clear();
  process.exit(0);
});

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Initialize browser with error recovery
async function initBrowser() {
  try {
    // Check if existing browser context is still valid
    if (browser) {
      try {
        // Test if browser is still responsive
        await browser.version();
        console.log('✅ Existing browser is healthy');
        return browser;
      } catch (error) {
        console.log('🔄 Existing browser unresponsive, creating new instance');
        browser = null;
      }
    }

    console.log('🚀 Initializing new browser instance...');
    
    // Production-ready browser configuration
    const browserOptions = {
      headless: process.env.NODE_ENV === 'production' ? true : false,
      args: process.env.NODE_ENV === 'production' ? [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ] : [
        '--start-maximized',
        '--disable-web-security',
        '--allow-running-insecure-content',
        '--disable-blink-features=AutomationControlled',
        '--disable-automation',
        '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ]
    };

    // For development, try Chrome with profile first
    if (process.env.NODE_ENV !== 'production') {
      try {
        browser = await chromium.launchPersistentContext('/Users/amitkumar/Library/Application Support/Google/Chrome/Default', {
          headless: false,
          args: browserOptions.args,
          executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        });
        console.log('✅ Chrome browser launched with existing profile');
        return browser;
      } catch (error) {
        console.log('🔄 Chrome with profile failed, trying basic launch...');
      }
    }

    // Fallback to basic browser launch
    browser = await chromium.launch(browserOptions);
    console.log('✅ Browser initialized successfully');
    return browser;
  } catch (error) {
    console.error('❌ Failed to initialize browser:', error);
    browser = null;
    throw error;
  }
}

// Get or create a browser page for a session
async function getSessionPage(sessionId) {
  // Check if we have an existing session
  if (browserSessions.has(sessionId)) {
    const session = browserSessions.get(sessionId);
    try {
      // Verify the page is still valid
      await session.page.title();
      return session.page;
    } catch (error) {
      console.log(`Session ${sessionId} page is invalid, creating new one`);
      browserSessions.delete(sessionId);
    }
  }

  // Create new session
  const browserContext = await initBrowser();
  let page;

  try {
    if (browserContext.pages) {
      // For persistent context, create a new page for this session
      page = await browserContext.newPage();
    } else {
      // For regular browser, create new page
      page = await browserContext.newPage();
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });
    }

    // Store the session
    browserSessions.set(sessionId, { page, context: browserContext });
    console.log(`Created new session ${sessionId}`);
    
    return page;
  } catch (error) {
    console.error('Failed to create session page:', error);
    throw error;
  }
}

// Task execution engine
class TaskExecutor {
  constructor() {
    this.taskQueue = [];
    this.isExecuting = false;
  }

  async executeTask(taskId, actions, onProgress, sessionId = 'default') {
    try {
      onProgress('🔄 Getting browser session...');
      const page = await getSessionPage(sessionId);
      
      if (!page) {
        throw new Error('Failed to get browser page for session');
      }

      onProgress('�🚀 Starting task execution...');
      
      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        onProgress(`Step ${i + 1}/${actions.length}: ${action.description}`);
        
        try {
          await this.executeAction(page, action, onProgress);
        } catch (actionError) {
          console.error(`❌ Action ${i + 1} failed:`, actionError);
          onProgress(`⚠️ Action ${i + 1} failed: ${actionError.message}, continuing...`);
          // Continue with next action instead of failing completely
        }
        
        // Wait between actions
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      onProgress('✅ All tasks completed successfully!');
      
      // Keep the page open for user interaction
      return {
        success: true,
        pageId: page._guid || 'unknown',
        message: 'Tasks completed successfully'
      };
      
    } catch (error) {
      console.error('❌ Task execution error:', error);
      onProgress(`❌ Task failed: ${error.message}`);
      
      // Try to recover browser for next task
      if (error.message.includes('Target page, context or browser has been closed') || 
          error.message.includes('Browser has been closed')) {
        console.log('🔄 Browser context lost, will reinitialize for next task');
        browser = null;
      }
      
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  async executeAction(page, action, onProgress) {
    switch (action.type) {
      case 'navigate':
        await page.goto(action.target, { waitUntil: 'networkidle', timeout: 30000 });
        onProgress(`✅ Navigated to ${action.target}`);
        break;
        
      case 'search':
        // Handle Google search
        if (page.url().includes('google.com')) {
          await page.waitForSelector('textarea[name="q"], input[name="q"]', { timeout: 10000 });
          await page.fill('textarea[name="q"], input[name="q"]', action.value);
          await page.keyboard.press('Enter');
          await page.waitForLoadState('networkidle');
          onProgress(`✅ Searched for "${action.value}" on Google`);
        } else {
          // Navigate to Google first, then search
          await page.goto('https://www.google.com', { waitUntil: 'networkidle' });
          await page.waitForSelector('textarea[name="q"], input[name="q"]', { timeout: 10000 });
          await page.fill('textarea[name="q"], input[name="q"]', action.value);
          await page.keyboard.press('Enter');
          await page.waitForLoadState('networkidle');
          onProgress(`✅ Searched for "${action.value}" on Google`);
        }
        break;
        
      case 'click':
        await page.waitForSelector(action.selector, { timeout: 10000 });
        await page.click(action.selector);
        onProgress(`✅ Clicked on ${action.description}`);
        break;
        
      case 'type':
        await page.waitForSelector(action.selector, { timeout: 10000 });
        await page.fill(action.selector, action.value);
        onProgress(`✅ Typed "${action.value}" in ${action.description}`);
        break;
        
      case 'wait':
        await new Promise(resolve => setTimeout(resolve, action.duration || 2000));
        onProgress(`✅ Waited ${action.duration || 2000}ms`);
        break;
        
      default:
        onProgress(`⚠️ Unknown action type: ${action.type}`);
    }
  }
}

const taskExecutor = new TaskExecutor();

// API Routes
app.get('/health', async (req, res) => {
  try {
    let browserStatus = 'disconnected';
    if (browser) {
      try {
        // For BrowserContext (persistent context), check if it's still valid
        const pages = browser.pages();
        browserStatus = pages.length > 0 ? 'connected' : 'no-pages';
      } catch (error) {
        browserStatus = 'error';
      }
    }
    
    res.json({ 
      status: 'healthy', 
      browser: browserStatus,
      activeTasks: activeTasks.size,
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      error: error.message,
      browser: 'error'
    });
  }
});

app.post('/execute-task', async (req, res) => {
  const { taskId, actions, sessionId = 'default' } = req.body;
  
  if (!taskId || !actions || !Array.isArray(actions)) {
    return res.status(400).json({ error: 'Missing taskId or actions' });
  }
  
  // Store task progress
  activeTasks.set(taskId, {
    status: 'running',
    progress: [],
    startTime: Date.now()
  });
  
  // Progress callback
  const onProgress = (message) => {
    const task = activeTasks.get(taskId);
    if (task) {
      task.progress.push({
        message,
        timestamp: Date.now()
      });
    }
  };
  
  res.json({ 
    success: true, 
    taskId,
    message: 'Task started successfully' 
  });
  
  // Execute task asynchronously
  taskExecutor.executeTask(taskId, actions, onProgress, sessionId)
    .then(result => {
      const task = activeTasks.get(taskId);
      if (task) {
        task.status = result.success ? 'completed' : 'failed';
        task.result = result;
      }
    })
    .catch(error => {
      const task = activeTasks.get(taskId);
      if (task) {
        task.status = 'failed';
        task.error = error.message;
      }
    });
});

app.get('/task-status/:taskId', (req, res) => {
  const { taskId } = req.params;
  const task = activeTasks.get(taskId);
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  res.json(task);
});

app.get('/tasks', (req, res) => {
  const tasks = Array.from(activeTasks.entries()).map(([id, task]) => ({
    id,
    ...task
  }));
  res.json(tasks);
});

app.delete('/task/:taskId', (req, res) => {
  const { taskId } = req.params;
  activeTasks.delete(taskId);
  res.json({ success: true, message: 'Task deleted' });
});

// Cleanup on exit
process.on('SIGINT', async () => {
  console.log('Shutting down automation server...');
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🤖 AI Automation Server running on http://localhost:${PORT}`);
  console.log('📋 Available endpoints:');
  console.log('  GET  /health - Server health check');
  console.log('  POST /execute-task - Execute automation task');
  console.log('  GET  /task-status/:taskId - Get task progress');
  console.log('  GET  /tasks - List all tasks');
  console.log('  DELETE /task/:taskId - Delete task');
});
