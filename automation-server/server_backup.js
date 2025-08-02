const express = require('express');
const cors = require('cors');
const { chromium, firefox } = require('playwright');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

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
    // Check if existing browser is still valid
    if (browser && !browser.isConnected()) {
      console.log('🔄 Browser connection lost, reinitializing...');
      browser = null;
    }
    
    if (!browser) {
      console.log('🚀 Launching browser...');
      try {
        // Try to use system Chrome with existing profile first
        browser = await chromium.launchPersistentContext('/Users/amitkumar/Library/Application Support/Google/Chrome/Default', {
          headless: false,
          args: [
            '--start-maximized',
            '--disable-web-security',
            '--allow-running-insecure-content',
            '--disable-blink-features=AutomationControlled',
            '--disable-automation'
          ],
          executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        });
        console.log('✅ Chrome browser launched with existing profile');
      } catch (error) {
        console.error('❌ Failed to launch Chrome with profile:', error.message);
        console.log('🔄 Trying Firefox fallback...');
        
        try {
          browser = await firefox.launchPersistentContext('/Users/amitkumar/Library/Application Support/Firefox/Profiles', {
            headless: false,
            args: ['--start-maximized']
          });
          console.log('✅ Firefox browser launched with existing profile');
        } catch (firefoxError) {
          console.error('❌ Firefox launch failed:', firefoxError.message);
          console.log('🔄 Trying basic Chromium fallback...');
          
          // Final fallback to basic Chromium
          browser = await chromium.launch({
            headless: false,
            args: [
              '--start-maximized',
              '--disable-web-security',
              '--allow-running-insecure-content',
              '--disable-blink-features=AutomationControlled',
              '--disable-automation',
              '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ]
          });
          console.log('✅ Chromium browser launched (fallback mode)');
        }
      }
    }
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
      
      if (!browserContext) {
        throw new Error('Failed to initialize browser context');
      }
      
      // For persistent context, we get the context directly
      // For regular browser, we create a new page
      let page;
      try {
        if (browserContext.pages) {
          // This is a persistent context
          const pages = browserContext.pages();
          if (pages.length > 0) {
            page = pages[0]; // Use the first existing page
            onProgress('✅ Using existing browser page');
          } else {
            page = await browserContext.newPage();
            onProgress('✅ Created new browser page');
          }
        } else {
          // This is a regular browser, create new page
          page = await browserContext.newPage();
          onProgress('✅ Created new browser page');
          
          // Set viewport and user agent for regular browser
          await page.setViewportSize({ width: 1920, height: 1080 });
          await page.setExtraHTTPHeaders({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          });
        }
      } catch (pageError) {
        console.error('❌ Failed to create page:', pageError);
        // Try to reinitialize browser and create page again
        browser = null;
        const newBrowserContext = await initBrowser();
        if (newBrowserContext.pages) {
          page = await newBrowserContext.newPage();
        } else {
          page = await newBrowserContext.newPage();
        }
        onProgress('� Recovered browser context and created new page');
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
      if (browser.isConnected && browser.isConnected()) {
        browserStatus = 'connected';
      } else if (browser.pages) {
        // For persistent context, check if it's still valid
        try {
          const pages = browser.pages();
          browserStatus = pages.length > 0 ? 'connected' : 'no-pages';
        } catch (error) {
          browserStatus = 'error';
          browser = null; // Reset for next initialization
        }
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
