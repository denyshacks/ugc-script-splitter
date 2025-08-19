#!/bin/bash

# DigitalOcean Deployment Script for UGC Script Splitter
# This script automates the deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="ugc-script-splitter"
CONTAINER_NAME="ugc-app"
IMAGE_NAME="$APP_NAME:latest"
BACKUP_DIR="/opt/backups"

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root or with sudo
check_permissions() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root or with sudo"
        exit 1
    fi
}

# Install Docker and Docker Compose if not present
install_docker() {
    if ! command -v docker &> /dev/null; then
        print_status "Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        usermod -aG docker $SUDO_USER
        rm get-docker.sh
        print_success "Docker installed successfully"
    else
        print_status "Docker is already installed"
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_status "Installing Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        print_success "Docker Compose installed successfully"
    else
        print_status "Docker Compose is already installed"
    fi
}

# Create application directory
setup_directories() {
    print_status "Setting up directories..."
    mkdir -p /opt/$APP_NAME
    mkdir -p $BACKUP_DIR
    chown -R $SUDO_USER:$SUDO_USER /opt/$APP_NAME
}

# Backup current deployment
backup_current() {
    if [ -d "/opt/$APP_NAME" ] && [ "$(ls -A /opt/$APP_NAME)" ]; then
        print_status "Creating backup of current deployment..."
        BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
        cp -r /opt/$APP_NAME $BACKUP_DIR/$BACKUP_NAME
        print_success "Backup created: $BACKUP_DIR/$BACKUP_NAME"
    fi
}

# Deploy application
deploy_app() {
    print_status "Deploying application..."
    
    cd /opt/$APP_NAME
    
    # Stop existing containers
    if docker ps -a --format 'table {{.Names}}' | grep -q $CONTAINER_NAME; then
        print_status "Stopping existing containers..."
        docker-compose down
    fi
    
    # Build new image
    print_status "Building Docker image..."
    docker build -t $IMAGE_NAME .
    
    # Start services
    print_status "Starting services..."
    docker-compose up -d
    
    # Wait for health check
    print_status "Waiting for application to be healthy..."
    sleep 30
    
    # Check if application is running
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        print_success "Application deployed successfully!"
        print_success "Access your app at: http://$(curl -s ifconfig.me):3001"
    else
        print_error "Application health check failed"
        print_status "Checking logs..."
        docker-compose logs
        exit 1
    fi
}

# Setup firewall
setup_firewall() {
    print_status "Configuring firewall..."
    ufw allow ssh
    ufw allow 80
    ufw allow 443
    ufw allow 3001
    ufw --force enable
    print_success "Firewall configured"
}

# Setup SSL with Let's Encrypt (optional)
setup_ssl() {
    read -p "Do you want to setup SSL with Let's Encrypt? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your domain name: " DOMAIN
        if [ ! -z "$DOMAIN" ]; then
            print_status "Installing Certbot..."
            apt-get update
            apt-get install -y certbot python3-certbot-nginx
            
            print_status "Obtaining SSL certificate..."
            certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
            
            print_success "SSL certificate installed for $DOMAIN"
        fi
    fi
}

# Main deployment process
main() {
    print_status "Starting DigitalOcean deployment for $APP_NAME"
    
    check_permissions
    install_docker
    setup_directories
    backup_current
    
    # Check if .env file exists
    if [ ! -f "/opt/$APP_NAME/.env" ]; then
        print_warning ".env file not found!"
        print_status "Please create /opt/$APP_NAME/.env with your API keys"
        print_status "You can use env.production.template as a reference"
        exit 1
    fi
    
    deploy_app
    setup_firewall
    setup_ssl
    
    print_success "Deployment completed successfully!"
    print_status "Application is running at http://$(curl -s ifconfig.me):3001"
    print_status "To view logs: docker-compose logs -f"
    print_status "To restart: docker-compose restart"
    print_status "To stop: docker-compose down"
}

# Run main function
main "$@"
