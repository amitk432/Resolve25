# ⚡ Quick Render Deployment Checklist

## 🚀 **5-Minute Deploy Guide**

### **Phase 1: Setup (2 minutes)**
- [ ] Go to [render.com](https://render.com)
- [ ] Sign up with GitHub
- [ ] Click "New +" → "Web Service"
- [ ] Connect repository: `amitk432/Resolve25`

### **Phase 2: Configure (2 minutes)**
```
Name: ai-automation-server
Environment: Node
Region: Oregon (US West)
Branch: master
Root Directory: src/automation-server
Build Command: npm install
Start Command: npm start
```

### **Phase 3: Environment Variables (1 minute)**
```
NODE_ENV=production
ENABLE_KEEP_ALIVE=true
```

### **Phase 4: Deploy & Test (5 minutes)**
- [ ] Click "Create Web Service"
- [ ] Wait for build completion
- [ ] Copy your service URL
- [ ] Test: `https://your-app.onrender.com/health`
- [ ] Add `BASE_URL` environment variable
- [ ] Update Vercel with `AUTOMATION_SERVER_URL`

### **Phase 5: Verify (2 minutes)**
- [ ] Test health endpoint
- [ ] Test from your frontend
- [ ] Check logs for errors
- [ ] Confirm auto-deploy is enabled

## 🎯 **Total Time: ~10 minutes**
## 💰 **Total Cost: $0/month**
## ✅ **Result: Production-ready AI Task Manager**

---

## 📱 **Quick Commands**

### **Test Server:**
```bash
curl https://your-app.onrender.com/health
curl https://your-app.onrender.com/wake
```

### **Monitor Logs:**
```bash
# In Render dashboard → Logs tab
# Watch for startup messages and errors
```

### **Environment Variables:**
```bash
NODE_ENV=production
ENABLE_KEEP_ALIVE=true
BASE_URL=https://your-actual-url.onrender.com
```

---

## 🚨 **Common First-Deploy Issues**

| Issue | Solution | Time |
|-------|----------|------|
| 502 Error | Server starting, wait | 2-3 min |
| Build Failed | Check root directory | 1 min fix |
| CORS Error | Already configured | N/A |
| Timeout | Server wake-up, normal | 30-60 sec |

---

## ✅ **Success Indicators**

- 🟢 Build logs show "Your service is live"
- 🟢 Health endpoint returns JSON response
- 🟢 Frontend can make requests (may be slow first time)
- 🟢 Subsequent requests are fast
- 🟢 No critical errors in logs

**You're live! 🎉**
