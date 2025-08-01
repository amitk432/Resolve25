# 🔧 Render Deployment Troubleshooting Guide

## 🚨 **Most Common Issues & Solutions**

### **1. Build Failed**
**Error**: `npm install` fails or missing package.json

**✅ Solution:**
```bash
# Check these settings:
Root Directory: src/automation-server  ← Must be exact
Build Command: npm install            ← Must be exact
Start Command: npm start              ← Must be exact
```

**Verify files exist:**
- `src/automation-server/package.json` ✅
- `src/automation-server/server.js` ✅

---

### **2. 502 Bad Gateway**
**Error**: Server returns 502 when accessing URL

**✅ Solutions:**
- **Wait 2-3 minutes** - Server is still starting
- **Check logs** for startup errors
- **Restart service** if stuck

```bash
# In Render dashboard:
# Manual Deploy → Deploy Latest Commit
```

---

### **3. Application Crashed**
**Error**: "Application exited with code 1"

**✅ Check Logs For:**
```bash
# Common crash causes:
- Missing environment variables
- Port binding issues  
- Playwright installation errors
- Dependency conflicts
```

**Fix:**
```bash
# Ensure these env vars are set:
NODE_ENV=production
PORT=(auto-set by Render)
```

---

### **4. Playwright Installation Issues**
**Error**: "Browser executable doesn't exist"

**✅ Solution:**
Already handled in your server.js:
```javascript
// Production browser config automatically uses:
headless: true
--no-sandbox
--disable-setuid-sandbox
```

**If still failing, check logs for:**
- Missing system dependencies
- RAM limitations (512MB free tier)

---

### **5. Frontend Can't Connect**
**Error**: CORS or connection refused

**✅ Solutions:**
1. **Verify environment variable in Vercel:**
   ```
   AUTOMATION_SERVER_URL=https://your-app.onrender.com
   ```

2. **Check server CORS config** (already configured):
   ```javascript
   // server.js includes production CORS
   origin: ALLOWED_ORIGINS
   ```

3. **Test server directly:**
   ```bash
   curl https://your-app.onrender.com/health
   ```

---

### **6. Server Sleeping/Wake-up Issues**
**Error**: First request takes 30-60 seconds

**✅ This is Normal for Free Tier!**
- Server sleeps after 15 minutes
- Wake-up takes 30-60 seconds
- Automatic wake-up is built-in

**To minimize:**
```bash
# Optional: Use external uptime monitoring
# Services like UptimeRobot can ping your /health endpoint
```

---

### **7. Memory/Performance Issues**
**Error**: "Application exceeded memory limit"

**✅ Solutions:**
1. **Free tier has 512MB RAM** - should be sufficient
2. **Browser config is optimized** for low memory
3. **If needed, upgrade to paid plan** ($7/month for 512MB → 1GB)

---

### **8. Build Takes Too Long**
**Error**: Build timeout or very slow

**✅ Solutions:**
- **Use npm install instead of npm ci**
- **Clear build cache**: Manual Deploy → Clear Build Cache
- **Check for large dependencies**

---

### **9. Environment Variables Not Working**
**Error**: process.env.VARIABLE is undefined

**✅ Solutions:**
1. **Check variable names** (case-sensitive)
2. **Restart service** after adding variables
3. **Verify in logs:**
   ```bash
   console.log('Environment check:', process.env.NODE_ENV);
   ```

---

### **10. Auto-Deploy Not Working**
**Error**: Changes not deploying automatically

**✅ Solutions:**
1. **Check auto-deploy setting** is enabled
2. **Verify branch is "master"**
3. **Manual trigger**: Deploy Latest Commit

---

## 🔍 **Debugging Steps**

### **1. Check Service Status**
```bash
# In Render dashboard:
1. Service overview shows "Live" 
2. Recent deployments successful
3. No critical errors in Events
```

### **2. Analyze Logs**
```bash
# Look for these patterns:
✅ "Server listening on port 3003"
✅ "Browser initialized successfully" 
✅ "Keep-alive mechanism enabled"
❌ "EADDRINUSE" - Port conflict
❌ "Cannot find module" - Missing dependency
❌ "Browser launch failed" - Playwright issue
```

### **3. Test Endpoints**
```bash
# Test these URLs:
curl https://your-app.onrender.com/health     # Should return JSON
curl https://your-app.onrender.com/wake       # Should return awake status
curl -X POST https://your-app.onrender.com/api/analyze # Should handle requests
```

---

## 🆘 **Emergency Fixes**

### **Quick Reset:**
1. **Manual Deploy** → Deploy Latest Commit
2. **Clear Build Cache** if build issues
3. **Restart Service** from dashboard

### **If All Else Fails:**
1. **Delete service**
2. **Create new service** with same settings
3. **Usually fixes mysterious issues**

### **Contact Support:**
- **Render Community**: [community.render.com](https://community.render.com)
- **Status Page**: [status.render.com](https://status.render.com)
- **Documentation**: [render.com/docs](https://render.com/docs)

---

## ✅ **Health Check Commands**

### **Verify Everything is Working:**
```bash
# 1. Server health
curl https://your-app.onrender.com/health

# Expected response:
{
  "status": "healthy",
  "uptime": 123,
  "browser": "active",
  "activeSessions": 0
}

# 2. Wake functionality
curl https://your-app.onrender.com/wake

# Expected response:
{
  "status": "awake",
  "message": "Server is now awake and ready"
}

# 3. CORS test
curl -H "Origin: https://your-vercel-app.vercel.app" \
     https://your-app.onrender.com/health
```

---

## 📊 **Performance Expectations**

### **Free Tier Performance:**
- **Cold start**: 30-60 seconds (first request after sleep)
- **Warm requests**: 2-5 seconds
- **Browser automation**: 5-15 seconds per task
- **Memory usage**: ~200-400MB (within 512MB limit)
- **Concurrent users**: 3-5 simultaneously

### **When to Upgrade:**
- Need faster cold starts
- More concurrent users
- Always-on availability
- More memory/CPU

**Upgrade cost: $7/month for Starter plan**

---

**Remember: Your setup is already optimized for the free tier! 🎉**
