# AI Automation Server

A Puppeteer-based automation server that enables the AI Task Manager to perform complex multi-step web automation tasks.

## Features

- **Multi-Step Task Execution**: Execute sequential browser actions like "Open Google and search for weather"
- **Visual Browser Control**: Opens a visible Chrome browser window for user monitoring
- **Real-time Progress**: Live progress updates via WebSocket-like polling
- **Robust Error Handling**: Graceful fallbacks and error reporting
- **RESTful API**: Simple HTTP API for task management

## Quick Start

### Option 1: Using the main project script
```bash
# From the main project root
npm run automation-server
```

### Option 2: Direct server start
```bash
# Navigate to automation server directory
cd src/automation-server

# Install dependencies
npm install

# Start the server
npm start
```

## API Endpoints

- `GET /health` - Check server status
- `POST /execute-task` - Execute automation task
- `GET /task-status/:taskId` - Get task progress
- `GET /tasks` - List all tasks
- `DELETE /task/:taskId` - Delete task

## Supported Actions

### Navigation
```javascript
{
  type: 'navigate',
  target: 'https://www.google.com',
  description: 'Opening Google'
}
```

### Search
```javascript
{
  type: 'search',
  value: 'weather forecast',
  description: 'Searching for weather'
}
```

### Click
```javascript
{
  type: 'click',
  selector: 'button[type="submit"]',
  description: 'Clicking submit button'
}
```

### Type
```javascript
{
  type: 'type',
  selector: 'input[name="username"]',
  value: 'user@example.com',
  description: 'Entering username'
}
```

### Wait
```javascript
{
  type: 'wait',
  duration: 3000,
  description: 'Waiting 3 seconds'
}
```

## Example Usage

The AI Task Manager automatically uses this server when available. Users can request complex tasks like:

- "Open Google and search for weather forecast"
- "Go to YouTube and search for React tutorials"
- "Open Amazon and search for laptops"

## Configuration

The server runs on `http://localhost:3001` by default. The AI Task Manager automatically detects when the server is running and switches to full automation mode.

## Browser Configuration

The server launches Chrome with:
- Visible UI (headless: false)
- Maximized window
- Disabled web security for automation
- User agent spoofing for compatibility

## Error Handling

If the automation server fails or is unavailable, the AI Task Manager automatically falls back to direct navigation mode, ensuring the application always remains functional.

## Dependencies

- **Express**: Web server framework
- **Puppeteer**: Browser automation
- **CORS**: Cross-origin requests support

## Development

For development with auto-reload:
```bash
npm install -g nodemon
npm run dev
```

## Security Note

This server is designed for local development and personal use. Do not expose it to public networks without proper authentication and security measures.
