#!/bin/bash

#####################################################################
# Mobelo Web - Production Deployment Script
#
# This script deploys the mobelo-web Next.js application to production.
#
# What this script does:
# - Builds the Next.js app locally
# - Syncs files to production server using rsync
# - Restarts PM2 and nginx
# - Verifies deployment health
#
# Prerequisites:
# - nginx configured and running
# - PM2 installed on server
# - SSH key access to production server
# - rsync installed locally and on server
#
# Usage: ./deploy.sh
#####################################################################

set -e  # Exit on any error

# Configuration
SERVER_USER="ubuntu"
SERVER_HOST="13.51.2.100"
SERVER="$SERVER_USER@$SERVER_HOST"
REMOTE_DIR="/var/www/mobelo-web"
SSH_KEY="/Users/ideabits/Documents/SourceCode/keys/production-dennis.pem"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if SSH connection works
check_connection() {
    log_info "Checking SSH connection to production server..."
    if ssh -i "$SSH_KEY" -o ConnectTimeout=5 $SERVER "echo 'SSH connection successful'" > /dev/null 2>&1; then
        log_info "✓ SSH connection successful"
    else
        log_error "✗ Cannot connect to production server"
        log_error "Please check your SSH keys and server access"
        exit 1
    fi

    # Ensure deployment directory exists with proper permissions
    log_info "Ensuring deployment directory exists..."
    ssh -i "$SSH_KEY" $SERVER "sudo mkdir -p $REMOTE_DIR && sudo chown -R ubuntu:ubuntu $REMOTE_DIR"
    log_info "✓ Deployment directory configured"
}

# Build Next.js app locally
build_web() {
    log_info "Building Next.js application locally..."

    # Clean install for consistency
    log_info "Installing dependencies..."
    npm ci --legacy-peer-deps

    # Build Next.js app with NODE_ENV=production
    log_info "Building production bundle..."
    NODE_ENV=production npm run build

    # Verify build output
    if [ ! -d ".next/standalone" ]; then
        log_error "✗ Build failed - .next/standalone directory not found"
        exit 1
    fi

    # Copy static assets for standalone build
    log_info "Copying static assets for standalone build..."
    cp -r public .next/standalone/
    cp -r .next/static .next/standalone/.next/

    log_info "✓ Next.js app built successfully"
}

# Upload files to server
upload_files() {
    log_info "Uploading files to production server..."

    # Use rsync to sync files directly to server
    log_info "Syncing files to server..."
    rsync -avz --progress \
        --exclude='.git' \
        --exclude='*.log' \
        --exclude='.env' \
        --exclude='.DS_Store' \
        --exclude='deploy.sh' \
        --exclude='production-dennis.pem' \
        --exclude='.next/cache' \
        --exclude='node_modules' \
        -e "ssh -i $SSH_KEY" \
        ./ $SERVER:$REMOTE_DIR/

    log_info "✓ Files synced successfully"
}

# Configure production environment
configure_production() {
    log_info "Configuring production environment on server..."

    ssh -i "$SSH_KEY" $SERVER << 'ENDSSH'
        set -e
        cd /var/www/mobelo-web

        echo "[SERVER] Configuring environment file..."

        # Create or update .env file
        if [ ! -f .env ]; then
            echo "[SERVER] Creating production .env file..."
            cat > .env << 'EOF'
# Production Environment Configuration
NODE_ENV=production
PORT=3001

# Stripe Configuration (update with your keys)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=your_stripe_public_key_here

# Add other required environment variables here
EOF
            echo "[SERVER] ✓ .env file created"
            echo "[SERVER] ⚠️  Please update .env with actual values"
        else
            echo "[SERVER] .env exists, ensuring production values..."
            sed -i 's/NODE_ENV=.*/NODE_ENV=production/' .env
            sed -i 's/PORT=.*/PORT=3001/' .env
            echo "[SERVER] ✓ .env updated for production"
        fi

        echo "[SERVER] ✓ Production configuration complete"
ENDSSH

    log_info "✓ Production environment configured"
}

# Restart services with PM2 and nginx
restart_services() {
    log_info "Restarting services..."

    ssh -i "$SSH_KEY" $SERVER << 'ENDSSH'
        set -e
        cd /var/www/mobelo-web

        # Check if PM2 is installed
        if ! command -v pm2 &> /dev/null; then
            echo "[SERVER] Installing PM2..."
            npm install -g pm2
        fi

        echo "[SERVER] Restarting mobelo-web with PM2..."

        # Stop and delete existing process
        pm2 delete mobelo-web 2>/dev/null || true

        # Start new process from standalone build
        cd .next/standalone
        NODE_ENV=production PORT=3001 pm2 start server.js --name "mobelo-web" --update-env
        cd ../..

        # Save PM2 configuration
        pm2 save

        # Setup PM2 startup script (if not already configured)
        sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu || true

        echo "[SERVER] Waiting for service to start..."
        sleep 5

        # Show PM2 status
        pm2 status

        echo "[SERVER] ✓ PM2 service restarted"

        # Reload nginx
        echo "[SERVER] Reloading nginx..."
        sudo systemctl reload nginx
        echo "[SERVER] ✓ nginx reloaded"
ENDSSH

    log_info "✓ Services restarted successfully"
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."

    ssh -i "$SSH_KEY" $SERVER << 'ENDSSH'
        set -e

        echo "[SERVER] Checking PM2 status..."
        pm2 status

        echo ""
        echo "[SERVER] Checking service health..."

        # Check if app is responding
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 | grep -q "200\|301\|302"; then
            echo "[SERVER] ✓ mobelo-web is healthy and responding"
        else
            echo "[SERVER] ✗ mobelo-web health check failed"
            echo "[SERVER] Check logs with: pm2 logs mobelo-web"
        fi
ENDSSH

    log_info "✓ Deployment verification complete"
}

# Main deployment process
main() {
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo "  Mobelo Web - Production Deployment"
    echo "  Target: $SERVER_HOST"
    echo "════════════════════════════════════════════════════════════"
    echo ""

    log_warn "This will deploy to PRODUCTION server: $SERVER_HOST"
    read -p "Are you sure you want to continue? (yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "Deployment cancelled"
        exit 0
    fi

    check_connection
    build_web
    upload_files
    configure_production
    restart_services
    verify_deployment

    echo ""
    log_info "════════════════════════════════════════════════════════════"
    log_info "  ✓ Deployment Complete!"
    log_info "════════════════════════════════════════════════════════════"
    echo ""
    log_info "Production URL: https://mobelo.dev (or configured domain)"
    log_info "App running on: http://localhost:3001"
    echo ""
    log_info "Monitor logs: ssh -i $SSH_KEY $SERVER 'pm2 logs mobelo-web'"
    log_info "Check status:  ssh -i $SSH_KEY $SERVER 'pm2 status'"
    echo ""
}

# Run main function
main
