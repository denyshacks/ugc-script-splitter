# DigitalOcean App Platform Deployment Guide

Deploy your UGC Script Splitter to DigitalOcean App Platform with GitHub integration - the easiest way to deploy!

## 🚀 Why App Platform?

- **Easy GitHub Integration**: Automatic deployments from your repo
- **Managed Infrastructure**: No server management required
- **Auto-scaling**: Scales based on traffic
- **Built-in SSL**: Free HTTPS certificates
- **Cost-effective**: Pay only for what you use
- **Zero-downtime Deployments**: Seamless updates

## 📋 Prerequisites

- GitHub account
- DigitalOcean account
- API keys ready:
  - OpenAI API key
  - Google Gemini API key
  - Kie.ai API key (optional)

## 🔧 Step-by-Step Deployment

### Step 1: Push to GitHub

1. **Create a new repository on GitHub**:
   - Go to https://github.com/new
   - Repository name: `ugc-script-splitter`
   - Make it public or private (your choice)
   - Don't initialize with README (we already have one)

2. **Connect your local repo to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/ugc-script-splitter.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Create App Platform App

1. **Go to DigitalOcean Console**:
   - Navigate to https://cloud.digitalocean.com/apps
   - Click "Create App"

2. **Connect GitHub**:
   - Select "GitHub" as source
   - Authorize DigitalOcean to access your repositories
   - Select your `ugc-script-splitter` repository
   - Choose `main` branch
   - Enable "Autodeploy" (deploys automatically on push)

3. **Configure App Settings**:
   - **App Name**: `ugc-script-splitter`
   - **Region**: Choose closest to your users
   - **Branch**: `main`

### Step 3: Configure Service

App Platform should auto-detect your Node.js app. Verify these settings:

- **Service Type**: Web Service
- **Source Directory**: `/` (root)
- **Build Command**: `npm run do:build`
- **Run Command**: `npm run do:start`
- **HTTP Port**: `3001`
- **Health Check**: `/api/health`

### Step 4: Set Environment Variables

In the App Platform console, add these environment variables:

**Required Variables:**
```
NODE_ENV=production
PORT=3001
OPENAI_API_KEY=sk-your-actual-openai-key-here
GOOGLE_GEMINI_API_KEY=your-actual-gemini-key-here
```

**Optional Variables:**
```
KIEAI_API_KEY=your-actual-kieai-key-here
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=10
```

**Important**: Mark API keys as "Encrypted" in the dropdown!

### Step 5: Choose Plan

**Recommended Plans:**

| Plan | vCPU | Memory | Price/Month | Use Case |
|------|------|--------|-------------|----------|
| **Basic** | 0.5 | 512 MB | $5 | Development/Light usage |
| **Professional** | 1 | 1 GB | $12 | Production (Recommended) |
| **Professional** | 2 | 2 GB | $24 | High traffic |

### Step 6: Deploy

1. **Review Configuration**
2. **Click "Create Resources"**
3. **Wait for Deployment** (5-10 minutes)

Your app will be available at: `https://your-app-name-xxxxx.ondigitalocean.app`

## 🎯 App Platform Configuration File

Your repository includes `.do/app.yaml` which can be used for advanced configuration:

```yaml
name: ugc-script-splitter
services:
- name: web
  source_dir: /
  run_command: node server.js
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  http_port: 3001
  health_check:
    http_path: /api/health
  envs:
  - key: NODE_ENV
    value: production
  - key: OPENAI_API_KEY
    value: ${OPENAI_API_KEY}
    type: SECRET
```

## 🌐 Custom Domain Setup

### 1. Add Domain in App Platform

1. Go to your app in DigitalOcean console
2. Click "Settings" → "Domains"
3. Click "Add Domain"
4. Enter your domain: `yourdomain.com`

### 2. Configure DNS

Add these DNS records at your domain registrar:

```
Type: CNAME
Name: www
Value: your-app-name-xxxxx.ondigitalocean.app

Type: A
Name: @
Value: [IP provided by DigitalOcean]
```

### 3. SSL Certificate

App Platform automatically provisions SSL certificates for custom domains!

## 📊 Monitoring and Logs

### View Application Logs

1. Go to your app in DigitalOcean console
2. Click "Runtime Logs"
3. Filter by service and time range

### Monitor Performance

- **Metrics**: CPU, Memory, Request count
- **Alerts**: Set up alerts for high resource usage
- **Scaling**: Auto-scale based on metrics

### Health Checks

App Platform monitors your `/api/health` endpoint:
- **Healthy**: Returns 200 status
- **Unhealthy**: Automatic restart

## 🔄 Updates and Deployments

### Automatic Deployments

Every push to `main` branch triggers automatic deployment:

```bash
# Make changes to your code
git add .
git commit -m "Update feature X"
git push origin main
# Deployment starts automatically!
```

### Manual Deployment

In DigitalOcean console:
1. Go to your app
2. Click "Actions" → "Force Rebuild and Deploy"

### Rollback

1. Go to "Deployments" tab
2. Find previous successful deployment
3. Click "Redeploy"

## 💰 Cost Management

### Pricing Structure

- **Compute**: Based on vCPU and memory
- **Bandwidth**: First 100GB free, then $0.01/GB
- **Build Minutes**: 3,000 free minutes/month

### Cost Optimization Tips

1. **Right-size your app**: Start small, scale up as needed
2. **Monitor usage**: Use DigitalOcean metrics
3. **Optimize build time**: Use efficient Docker layers
4. **Set spending alerts**: Get notified of unusual costs

### Sample Monthly Costs

```
Basic Plan (512MB): $5/month
+ API Usage (OpenAI): ~$10-50/month
+ Bandwidth: Usually free (under 100GB)
Total: ~$15-55/month
```

## 🛠️ Troubleshooting

### Build Failures

**Common Issues:**
- Missing environment variables
- Node.js version mismatch
- Build timeout (increase in settings)

**Solutions:**
```bash
# Check build logs in DigitalOcean console
# Verify package.json scripts
# Ensure all dependencies are in package.json
```

### Runtime Errors

**Check Runtime Logs:**
1. Go to app console
2. Click "Runtime Logs"
3. Look for error messages

**Common Fixes:**
- Verify environment variables are set
- Check API key validity
- Monitor memory usage

### Health Check Failures

**Verify Health Endpoint:**
```bash
curl https://your-app-url.ondigitalocean.app/api/health
```

Should return:
```json
{"status":"ok","timestamp":"2024-XX-XX..."}
```

### Performance Issues

**Monitor Metrics:**
- High CPU: Consider upgrading plan
- High Memory: Optimize code or upgrade
- Slow Response: Check API latency

## 🔐 Security Best Practices

### Environment Variables

- ✅ Mark API keys as "Encrypted"
- ✅ Use strong, unique keys
- ✅ Rotate keys regularly
- ❌ Never commit keys to Git

### App Security

- ✅ HTTPS enforced automatically
- ✅ Rate limiting configured
- ✅ CORS properly set
- ✅ Security headers in place

### Access Control

- ✅ Use GitHub private repos for sensitive code
- ✅ Limit DigitalOcean team access
- ✅ Enable 2FA on accounts

## 📈 Scaling Your Application

### Vertical Scaling

Upgrade your plan in DigitalOcean console:
1. Go to app settings
2. Change instance size
3. Deploy changes

### Horizontal Scaling

Increase instance count:
1. Edit `.do/app.yaml`
2. Change `instance_count: 2`
3. Push to GitHub

### Database Scaling

For future database needs:
- DigitalOcean Managed Databases
- Redis for caching
- CDN for static assets

## 🎯 Advanced Features

### Custom Build Commands

```yaml
# In .do/app.yaml
build_command: |
  npm ci
  cd client && npm ci && npm run build
  cd .. && cp -r client/build .
```

### Multiple Environments

Create separate apps for:
- `ugc-script-splitter-dev` (development)
- `ugc-script-splitter-staging` (testing)
- `ugc-script-splitter-prod` (production)

### Database Integration

```yaml
# Add to .do/app.yaml
databases:
- name: ugc-db
  engine: PG
  version: "13"
```

## ✅ Deployment Checklist

- [ ] GitHub repository created and code pushed
- [ ] DigitalOcean App Platform app created
- [ ] GitHub connected and autodeploy enabled
- [ ] Environment variables configured (encrypted)
- [ ] App plan selected (Professional recommended)
- [ ] Health checks passing
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Monitoring and alerts set up
- [ ] Team access configured
- [ ] Backup strategy planned

## 🆘 Support Resources

### DigitalOcean Support

- **Documentation**: https://docs.digitalocean.com/products/app-platform/
- **Community**: https://www.digitalocean.com/community/
- **Support Tickets**: Available with paid plans

### Application Support

- **Logs**: Check runtime logs in console
- **Health**: Monitor `/api/health` endpoint
- **GitHub Issues**: Track problems in your repo

## 🎉 Success!

Your UGC Script Splitter is now live on DigitalOcean App Platform!

**Next Steps:**
1. Test all functionality at your live URL
2. Set up monitoring and alerts
3. Configure custom domain (optional)
4. Share your app with users
5. Monitor usage and costs

**Live URL**: `https://your-app-name-xxxxx.ondigitalocean.app`

Enjoy your cost-effective, scalable, and fully managed deployment! 🚀
