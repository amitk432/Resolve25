# Automation Server Deployment Guide

## Quick Setup for Railway (Recommended)

1. **Create Railway Account**: Go to railway.app
2. **Deploy from GitHub**:
   - Connect your repo
   - Set root directory to: `src/automation-server`
   - Railway will auto-detect Node.js

3. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=3003
   ```

4. **Update Frontend**:
   ```typescript
   // In your AI service
   const AUTOMATION_SERVER_URL = process.env.AUTOMATION_SERVER_URL || 'http://localhost:3003';
   ```

## Alternative: Render Deployment

1. **Create render.yaml** in `src/automation-server/`:
   ```yaml
   services:
     - type: web
       name: ai-automation-server
       env: node
       region: oregon
       plan: starter # Free tier
       buildCommand: npm install
       startCommand: npm start
       envVars:
         - key: NODE_ENV
           value: production
   ```

2. **Connect to Render**: render.com → New Web Service → Connect Repo

## Production Configuration

Add to your automation server:

```javascript
const ALLOWED_ORIGINS = [
  'https://your-app.vercel.app',
  'http://localhost:3000', // for development
  'http://localhost:9002'  // your dev port
];

app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true
}));
```

## Cost Breakdown

- **Railway**: $5-10/month (recommended)
- **Render**: Free tier available, $7/month for paid
- **DigitalOcean**: $5/month minimum
- **Vercel**: Stays free for frontend

## Health Check Endpoint

Add to your server:
```javascript
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    uptime: process.uptime(),
    browser: browser ? 'active' : 'inactive'
  });
});
```
