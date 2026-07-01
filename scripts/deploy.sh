#!/bin/bash
# Deploy script for Financeiro app on Hetzner VM
# Usage: ./scripts/deploy.sh [branch]
# Auto-deploy: configure GitHub webhook to POST to http://46.224.48.211:9000/hooks/deploy

set -e

BRANCH="${1:-main}"
APP_DIR="/root/apps/financeiro"
LOG_FILE="/var/log/financeiro-deploy.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=== Deploy iniciado (branch: $BRANCH) ==="

# Go to app directory
cd "$APP_DIR"

# Pull latest code
log "Pullando código..."
git fetch origin
git reset --hard "origin/$BRANCH"

# Build and restart
log "Buildando e restartando container..."
docker compose -f docker-compose.yml build --pull
docker compose -f docker-compose.yml up -d --force-recreate

# Clean up old images
log "Limpando imagens antigas..."
docker image prune -f

log "=== Deploy concluído ==="
