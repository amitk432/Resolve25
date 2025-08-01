# 🚀 Complete Render.com Deployment Guide

## 📋 **Prerequisites**
- ✅ Your code is already in GitHub repository
- ✅ All deployment files are prepared (render.yaml, server configs)
- ✅ Takes approximately 10-15 minutes total

---

## 🔧 **Step 1: Sign Up for Render**

1. **Go to [render.com](https://render.com)**
2. **Click "Get Started for Free"**
3. **Sign up with GitHub** (recommended)
   - Click "GitHub" button
   - Authorize Render to access your repositories
   - This automatically connects your GitHub account

![Render Signup](https://render.com/docs/static/images/connect-github.png)

---

## 🔗 **Step 2: Create New Web Service**

1. **In Render Dashboard**, click **"New +"** (top right)
2. **Select "Web Service"**
3. **Connect Repository:**
   - Find your repository: `amitk432/Resolve25`
   - Click **"Connect"** next to it
   - If you don't see it, click "Configure GitHub App" to grant access

---

## ⚙️ **Step 3: Configure Your Service**

Fill in these exact settings:

### **Basic Settings:**
```
Name: ai-automation-server
Environment: Node
Region: Oregon (US West) - Recommended
Branch: master
```

### **Build & Deploy Settings:**
```
Root Directory: src/automation-server
Build Command: npm install
Start Command: npm start
```

### **Advanced Settings (Click "Advanced"):**
```
Auto-Deploy: Yes (enabled by default)
```

---

## 🌍 **Step 4: Environment Variables**

1. **Scroll down to "Environment Variables"**
2. **Click "Add Environment Variable"**
3. **Add these variables:**

```bash
NODE_ENV=production
ENABLE_KEEP_ALIVE=true
```

**Note**: Don't add `BASE_URL` yet - we'll get this after deployment.

---

## 🚀 **Step 5: Deploy**

1. **Review all settings**
2. **Click "Create Web Service"**
3. **Wait for deployment** (5-10 minutes)

You'll see the build logs in real-time:
```
==> Building application
==> Installing dependencies
==> npm install
==> Starting application
==> npm start
==> Your service is live at https://ai-automation-server.onrender.com
```

---

## 📝 **Step 6: Get Your Server URL**

After successful deployment:

1. **Copy your service URL** from the top of the page
   - Format: `https://your-app-name.onrender.com`
   - Example: `https://ai-automation-server-abcd.onrender.com`

2. **Test the health endpoint:**
   ```bash
   curl https://your-app-name.onrender.com/health
   ```
   
   Expected response:
   ```json
   {
     "status": "healthy",
     "uptime": 45,
     "browser": "active",
     "activeSessions": 0,
     "timestamp": "2025-08-02T10:30:00.000Z"
   }
   ```

---

## 🔄 **Step 7: Update Environment Variables**

1. **Go back to Environment Variables section**
2. **Add the BASE_URL variable:**
   ```
   BASE_URL=https://your-actual-url.onrender.com
   ```
3. **Click "Save Changes"**
4. **Service will automatically redeploy**

---

## 🌐 **Step 8: Update Your Frontend (Vercel)**

1. **Go to your Vercel dashboard**
2. **Select your project**
3. **Go to Settings → Environment Variables**
4. **Add new variable:**
   ```
   AUTOMATION_SERVER_URL=https://your-app-name.onrender.com
   ```
5. **Redeploy your frontend**

---

## ✅ **Step 9: Test the Full Integration**

### **Test Server Directly:**
```bash
# Health check
curl https://your-app.onrender.com/health

# Wake-up endpoint
curl https://your-app.onrender.com/wake
```

### **Test from Your Frontend:**
1. **Open your app** (Vercel URL)
2. **Try using the AI Task Manager**
3. **Make a browser automation request**
4. **First request might take 30-60 seconds** (server wake-up)
5. **Subsequent requests should be fast**

---

## 🔍 **Step 10: Monitor and Troubleshoot**

### **Check Logs:**
1. **In Render dashboard** → Your service
2. **Click "Logs" tab**
3. **Monitor for any errors**

### **Common First-Time Issues:**

**Issue**: 502 Bad Gateway
**Solution**: Server is starting up, wait 2-3 minutes

**Issue**: Build Failed
**Solution**: Check if `src/automation-server/package.json` exists

**Issue**: App Crashed
**Solution**: Check logs for missing dependencies

---

## 🎛️ **Step 11: Optional Optimizations**

### **Enable Auto-Deploy:**
1. **Settings tab** → **Auto-Deploy**
2. **Enable "Auto-deploy from GitHub"**
3. **Now every push to master automatically deploys**

### **Custom Domain** (Optional):
1. **Settings tab** → **Custom Domains**
2. **Add your domain** (if you have one)
3. **Follow DNS setup instructions**

---

## 📊 **Step 12: Verify Free Tier Limits**

Your free tier includes:
- ✅ **750 hours/month** (≈25 days runtime)
- ✅ **512MB RAM**
- ✅ **Shared CPU**
- ✅ **Auto-SSL certificates**
- ✅ **GitHub integration**

**Usage tracking:**
- **Billing tab** → View current usage
- **Should stay well within free limits**

---

## 🚨 **Troubleshooting Guide**

### **Build Errors:**
```bash
# If build fails, check:
1. src/automation-server/package.json exists
2. Root directory is correct: src/automation-server
3. Start command is: npm start
```

### **Runtime Errors:**
```bash
# Check logs for:
1. Missing environment variables
2. Playwright installation issues
3. Port conflicts (should use process.env.PORT)
```

### **Connection Issues:**
```bash
# If frontend can't connect:
1. Verify AUTOMATION_SERVER_URL in Vercel
2. Check CORS settings in server.js
3. Test health endpoint directly
```

---

## 🎉 **Success Checklist**

- ✅ Service deployed successfully on Render
- ✅ Health endpoint returns 200 OK
- ✅ Frontend environment variable updated
- ✅ First automation request works (may take 60s)
- ✅ Subsequent requests are fast (<5s)
- ✅ Logs show no critical errors

---

## 🔄 **Auto-Deployment Workflow**

Now your workflow is:
1. **Make changes** to your code
2. **Push to GitHub** (master branch)
3. **Render automatically deploys** (3-5 minutes)
4. **New version is live**

---

## 💡 **Pro Tips**

1. **Bookmark your service URL** for easy access
2. **Monitor logs regularly** during first week
3. **Set up status page** to track uptime
4. **Use wake endpoint** to manually wake server
5. **Keep GitHub repo updated** for auto-deployment

---

## 🎯 **Final Result**

You now have:
- 🆓 **FREE backend server** on Render
- 🤖 **Full AI Task Manager** with browser automation
- 🔄 **Automatic deployments** from GitHub
- 📊 **Monitoring and logs** 
- ⚡ **Production-ready** setup

**Your AI Task Manager is now live and running completely FREE!** 🚀

---

## 📞 **Need Help?**

- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Community**: [community.render.com](https://community.render.com)
- **Status**: [status.render.com](https://status.render.com)
