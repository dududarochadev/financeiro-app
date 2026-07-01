#!/bin/bash
set -e

echo "=== 🚀 Deploy Financeiro ==="
cd "$(dirname "$0")/.."

# 1. Pull latest code
echo "[1/4] Pulling latest code..."
git pull origin main

# 2. Build and restart
echo "[2/4] Building and restarting containers..."
cd deploy
docker compose build
docker compose up -d

# 3. Clean old images
echo "[3/4] Cleaning old images..."
docker image prune -f

echo "[4/4] Done! ✅"
echo "App: https://financeiro.duckdns.org"
echo "API: http://localhost:3000"
