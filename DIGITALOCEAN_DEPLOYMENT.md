# DigitalOcean Deployment Guide

Complete guide for deploying your UGC Script Splitter application to DigitalOcean.

## 🚀 Quick Start (Automated Deployment)

### Prerequisites
- DigitalOcean account
- Domain name (optional, for SSL)
- API keys (OpenAI, Google Gemini, Kie.ai)

### 1. Create DigitalOcean Droplet

**Recommended Configuration:**
- **OS**: Ubuntu 22.04 LTS
- **Size**: Basic Droplet, 2 GB Memory / 1 vCPU / 50 GB SSD ($12/month)
- **Region**: Choose closest to your users
- **Authentication**: SSH keys (recommended) or Password

### 2. Connect to Your Droplet

```bash
ssh root@your-droplet-ip
```

### 3. Upload Your Application

**Option A: Using Git (Recommended)**
```bash
git clone https://github.com/yourusername/your-repo.git
cd your-repo
```

**Option B: Using SCP**
```bash
# On your local machine
scp -r "/Users/denys/Dropbox/TECH/Samar vid/workingveo3testerrr 3" root@your-droplet-ip:/opt/ugc-script-splitter
```

### 4. Configure Environment Variables

```bash
cd /opt/ugc-script-splitter
cp env.production.template .env
nano .env
```

Update with your actual API keys:
```env
OPENAI_API_KEY=sk-your-actual-openai-key
GOOGLE_GEMINI_API_KEY=your-actual-gemini-key
KIEAI_API_KEY=your-actual-kieai-key
```

### 5. Run Automated Deployment

```bash
sudo ./deploy.sh
```

The script will:
- Install Docker and Docker Compose
- Build your application
- Configure firewall
- Start the services
- Optionally setup SSL

### 6. Access Your Application

- **HTTP**: `http://your-droplet-ip:3001`
- **With domain**: `http://yourdomain.com` (after DNS setup)

---

## 🔧 Manual Deployment (Step by Step)

### Step 1: Update System

```bash
apt update && apt upgrade -y
```

### Step 2: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Add user to docker group
usermod -aG docker $USER
```

### Step 3: Setup Application Directory

```bash
mkdir -p /opt/ugc-script-splitter
cd /opt/ugc-script-splitter
```

### Step 4: Upload Files

Upload these files to your droplet:
- `Dockerfile`
- `docker-compose.yml`
- `nginx.conf`
- Your entire application code
- `.env` file with your API keys

### Step 5: Build and Deploy

```bash
# Build the Docker image
docker build -t ugc-script-splitter:latest .

# Start services
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f
```

### Step 6: Configure Firewall

```bash
ufw allow ssh
ufw allow 80
ufw allow 443
ufw allow 3001
ufw --force enable
```

---

## 🌐 Domain and SSL Setup

### 1. Point Domain to Droplet

In your domain registrar's DNS settings:
- Create an A record pointing to your droplet's IP address
- Example: `yourdomain.com` → `your-droplet-ip`

### 2. Install SSL Certificate

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d yourdomain.com

# Auto-renewal (optional)
crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Update Nginx Configuration

Edit `nginx.conf` to uncomment SSL configuration and update domain name.

---

## 📊 Monitoring and Maintenance

### Health Checks

```bash
# Check application health
curl http://localhost:3001/api/health

# Check container status
docker-compose ps

# View logs
docker-compose logs -f
```

### Common Commands

```bash
# Restart application
docker-compose restart

# Stop application
docker-compose down

# Update application
git pull origin main
docker-compose down
docker build -t ugc-script-splitter:latest .
docker-compose up -d

# View resource usage
docker stats

# Backup data
docker-compose down
tar -czf backup-$(date +%Y%m%d).tar.gz /opt/ugc-script-splitter
```

### Log Management

```bash
# Rotate logs
docker-compose logs --no-color | head -1000 > app.log
docker-compose down && docker-compose up -d

# Clear old logs
docker system prune -f
```

---

## 🔒 Security Best Practices

### 1. Firewall Configuration

```bash
# Allow only necessary ports
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80
ufw allow 443
ufw enable
```

### 2. SSH Security

```bash
# Disable root login (optional)
nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
# Set: PasswordAuthentication no
systemctl restart ssh
```

### 3. Regular Updates

```bash
# Update system packages
apt update && apt upgrade -y

# Update Docker images
docker-compose pull
docker-compose up -d
```

### 4. Backup Strategy

```bash
# Create backup script
cat > /opt/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/ugc-backup-$(date +%Y%m%d-%H%M%S).tar.gz /opt/ugc-script-splitter
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x /opt/backup.sh

# Schedule daily backups
crontab -e
# Add: 0 2 * * * /opt/backup.sh
```

---

## 🐛 Troubleshooting

### Application Won't Start

```bash
# Check logs
docker-compose logs

# Check environment variables
docker-compose exec ugc-script-splitter env | grep -E "(OPENAI|GOOGLE|KIEAI)"

# Restart services
docker-compose down && docker-compose up -d
```

### Port Already in Use

```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>
```

### SSL Certificate Issues

```bash
# Check certificate status
certbot certificates

# Renew certificates
certbot renew

# Test renewal
certbot renew --dry-run
```

### High Memory Usage

```bash
# Check resource usage
docker stats

# Restart application
docker-compose restart

# Upgrade droplet if needed
```

---

## 💰 Cost Optimization

### DigitalOcean Droplet Sizes

| Size | Memory | vCPU | Storage | Price/Month | Use Case |
|------|--------|------|---------|-------------|----------|
| Basic | 1 GB | 1 | 25 GB | $6 | Development/Testing |
| **Recommended** | 2 GB | 1 | 50 GB | $12 | Production (Light) |
| Performance | 4 GB | 2 | 80 GB | $24 | Production (Heavy) |

### Monitoring Costs

- Monitor your API usage (OpenAI, Gemini, Kie.ai)
- Set up billing alerts
- Use rate limiting to prevent abuse
- Consider caching for repeated requests

---

## 📈 Scaling Considerations

### Horizontal Scaling

```bash
# Add load balancer
# Use DigitalOcean Load Balancer
# Deploy multiple droplets
# Update nginx.conf for upstream servers
```

### Vertical Scaling

```bash
# Resize droplet through DigitalOcean control panel
# No downtime with proper planning
```

### Database Scaling

```bash
# Add Redis for caching
# Use DigitalOcean Managed Database
# Implement session storage
```

---

## 🎯 Performance Optimization

### 1. Enable Gzip Compression

Already configured in `nginx.conf`

### 2. Implement Caching

```bash
# Add Redis service to docker-compose.yml
redis:
  image: redis:alpine
  restart: unless-stopped
```

### 3. CDN Setup

- Use DigitalOcean Spaces + CDN
- Serve static assets from CDN
- Reduce server load

### 4. Database Optimization

```bash
# If using database, optimize queries
# Add indexes
# Use connection pooling
```

---

## 📞 Support and Resources

### DigitalOcean Resources
- [DigitalOcean Documentation](https://docs.digitalocean.com/)
- [Community Tutorials](https://www.digitalocean.com/community/tutorials)
- [DigitalOcean Support](https://www.digitalocean.com/support/)

### Application Support
- Check application logs: `docker-compose logs`
- Monitor health endpoint: `/api/health`
- Review server metrics in DigitalOcean dashboard

### Emergency Contacts
- Keep backup of your `.env` file
- Document your deployment process
- Have rollback plan ready

---

## ✅ Deployment Checklist

- [ ] DigitalOcean droplet created
- [ ] Domain configured (if applicable)
- [ ] SSH access verified
- [ ] Application code uploaded
- [ ] Environment variables configured
- [ ] Docker and Docker Compose installed
- [ ] Application built and deployed
- [ ] Firewall configured
- [ ] SSL certificate installed (if applicable)
- [ ] Health checks passing
- [ ] Monitoring setup
- [ ] Backup strategy implemented
- [ ] Documentation updated

**🎉 Congratulations! Your UGC Script Splitter is now live on DigitalOcean!**
