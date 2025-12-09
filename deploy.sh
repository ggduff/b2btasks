#!/bin/bash
# B2B Tasks Deployment Script
# Run from thinkhuge-b2b-tracker directory
# Usage: ./deploy.sh

set -e

# Configuration
SERVER="root@152.89.209.20"
SSH_PORT="22122"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_rsa}"
REMOTE_DIR="/srv/b2btasks"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "============================================"
echo "  B2B Tasks - Production Deployment"
echo "============================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}ERROR: Run this script from the thinkhuge-b2b-tracker directory${NC}"
    exit 1
fi

echo -e "${YELLOW}[1/5] Building Next.js app...${NC}"
npm run build
echo -e "${GREEN}Build completed successfully.${NC}"
echo ""

echo -e "${YELLOW}[2/5] Syncing files to production server...${NC}"
rsync -avz --delete \
  -e "ssh -i $SSH_KEY -p $SSH_PORT" \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.env.local' \
  --exclude '.env' \
  --exclude '*.db' \
  --exclude '*.db-journal' \
  --exclude '.next/cache' \
  ./ $SERVER:$REMOTE_DIR/
echo -e "${GREEN}Files synced successfully.${NC}"
echo ""

echo -e "${YELLOW}[3/5] Installing dependencies on server...${NC}"
ssh -i "$SSH_KEY" -p $SSH_PORT $SERVER "cd $REMOTE_DIR && npm ci --omit=dev"
echo -e "${GREEN}Dependencies installed.${NC}"
echo ""

echo -e "${YELLOW}[4/5] Running database migrations...${NC}"
ssh -i "$SSH_KEY" -p $SSH_PORT $SERVER "cd $REMOTE_DIR && npx prisma generate && npx prisma migrate deploy"
echo -e "${GREEN}Migrations completed.${NC}"
echo ""

echo -e "${YELLOW}[5/5] Restarting application...${NC}"
ssh -i "$SSH_KEY" -p $SSH_PORT $SERVER "cd $REMOTE_DIR && pm2 restart b2btasks 2>/dev/null || pm2 start ecosystem.config.js && pm2 save"
echo ""

echo "============================================"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo "============================================"
echo ""
echo "Site URL: https://b2btasks.thinkhuge.net"
echo ""

# Show PM2 status
ssh -i "$SSH_KEY" -p $SSH_PORT $SERVER "pm2 status"
