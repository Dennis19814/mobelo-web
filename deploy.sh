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

# Build Next.js app on server (AFTER configuring production .env)
build_web_on_server() {
    log_info "Building Next.js application on production server..."

    ssh -i "$SSH_KEY" $SERVER << 'ENDSSH'
        set -e
        cd /var/www/mobelo-web

        echo "[SERVER] Clearing build cache to prevent Server Action mismatch..."
        rm -rf .next .turbo node_modules/.cache

        echo "[SERVER] Installing dependencies..."
        npm ci --legacy-peer-deps

        echo "[SERVER] Building production bundle with production environment..."
        NODE_ENV=production npm run build

        # Verify build output
        if [ ! -d ".next/standalone" ]; then
            echo "[SERVER] ✗ Build failed - .next/standalone directory not found"
            exit 1
        fi

        # Copy static assets for standalone build
        echo "[SERVER] Copying static assets for standalone build..."
        cp -r public .next/standalone/
        cp -r .next/static .next/standalone/.next/

        echo "[SERVER] ✓ Next.js app built successfully on server"
ENDSSH

    log_info "✓ Next.js app built successfully on server"
}

# Upload files to server
upload_files() {
    log_info "Uploading files to production server..."

    # Use rsync to sync SOURCE files to server (will build on server)
    log_info "Syncing source files to server..."
    rsync -avz --progress \
        --exclude='.git' \
        --exclude='*.log' \
        --exclude='.env' \
        --exclude='.DS_Store' \
        --exclude='deploy.sh' \
        --exclude='production-dennis.pem' \
        --exclude='.next' \
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

# API Configuration - CRITICAL: Must use production API URLs
NEXT_PUBLIC_API_URL=https://api.mobelo.dev
NEXT_PUBLIC_WORKER_URL=https://worker.mobelo.dev
NEXT_PUBLIC_WEB_URL=https://mobelo.dev
NEXT_PUBLIC_APP_URL=https://mobelo.dev

# Application Configuration
NEXT_PUBLIC_APP_NAME="Mobile App Designer"
NEXT_PUBLIC_APP_DESCRIPTION="AI-powered mobile app design tool"
NEXT_PUBLIC_APP_VERSION="1.0.0"

# API Timeout
NEXT_PUBLIC_API_TIMEOUT="10000"

# Authentication Configuration
NEXT_PUBLIC_OTP_LENGTH="6"
NEXT_PUBLIC_OTP_EXPIRY_MINUTES="10"

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS="false"
NEXT_PUBLIC_ENABLE_ERROR_REPORTING="false"
NEXT_PUBLIC_ENABLE_MOCK_DATA="false"

# Production Settings
NEXT_PUBLIC_DEBUG_MODE="false"
NEXT_PUBLIC_SHOW_PERFORMANCE_METRICS="false"
NEXT_PUBLIC_DISABLE_DIRECT_API_IN_DEV="false"

# Stripe Configuration (update with your keys)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=your_stripe_public_key_here

# Add other required environment variables here
EOF
            echo "[SERVER] ✓ .env file created"
            echo "[SERVER] ⚠️  Please update .env with actual values"
        else
            echo "[SERVER] .env exists, ensuring production values..."

            # Update basic production settings
            sed -i 's/NODE_ENV=.*/NODE_ENV=production/' .env
            sed -i 's/PORT=.*/PORT=3001/' .env

            # Ensure all production API URLs are set (critical for client-side API calls)
            if grep -q "^NEXT_PUBLIC_API_URL=" .env; then
                sed -i 's|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=https://api.mobelo.dev|' .env
            else
                echo "NEXT_PUBLIC_API_URL=https://api.mobelo.dev" >> .env
            fi

            if grep -q "^NEXT_PUBLIC_WORKER_URL=" .env; then
                sed -i 's|NEXT_PUBLIC_WORKER_URL=.*|NEXT_PUBLIC_WORKER_URL=https://worker.mobelo.dev|' .env
            else
                echo "NEXT_PUBLIC_WORKER_URL=https://worker.mobelo.dev" >> .env
            fi

            if grep -q "^NEXT_PUBLIC_WEB_URL=" .env; then
                sed -i 's|NEXT_PUBLIC_WEB_URL=.*|NEXT_PUBLIC_WEB_URL=https://mobelo.dev|' .env
            else
                echo "NEXT_PUBLIC_WEB_URL=https://mobelo.dev" >> .env
            fi

            if grep -q "^NEXT_PUBLIC_APP_URL=" .env; then
                sed -i 's|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=https://mobelo.dev|' .env
            else
                echo "NEXT_PUBLIC_APP_URL=https://mobelo.dev" >> .env
            fi

            # Update feature flags for production
            sed -i 's/NEXT_PUBLIC_DEBUG_MODE=.*/NEXT_PUBLIC_DEBUG_MODE="false"/' .env
            sed -i 's/NEXT_PUBLIC_ENABLE_MOCK_DATA=.*/NEXT_PUBLIC_ENABLE_MOCK_DATA="false"/' .env

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
    upload_files
    configure_production
    build_web_on_server
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
    log_warn "IMPORTANT: Users may need to hard refresh their browser to clear cached JavaScript:"
    log_warn "  • Chrome/Edge: Ctrl+Shift+F5 (Windows) or Cmd+Shift+R (Mac)"
    log_warn "  • Firefox: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)"
    echo ""
    log_info "Monitor logs: ssh -i $SSH_KEY $SERVER 'pm2 logs mobelo-web'"
    log_info "Check status:  ssh -i $SSH_KEY $SERVER 'pm2 status'"
    echo ""
}

# Run main function
main
