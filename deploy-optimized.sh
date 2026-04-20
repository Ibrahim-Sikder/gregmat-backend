#!/bin/bash

# Memory Optimization Deployment Script
# Run this script to deploy the optimized version

set -e

echo "🚀 Starting deployment of memory-optimized version..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Build the project
echo -e "${YELLOW}Step 1: Building project...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed! Fix errors and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"

# 2. Stop old process
echo -e "${YELLOW}Step 2: Stopping old PM2 process...${NC}"
pm2 delete gregmat-server 2>/dev/null || echo "No existing process found"
pm2 flush

# 3. Start new process
echo -e "${YELLOW}Step 3: Starting optimized server...${NC}"
pm2 start ecosystem.config.js --env production

# 4. Save PM2 configuration
pm2 save

# 5. Wait a moment for startup
echo -e "${YELLOW}Waiting 5 seconds for server to start...${NC}"
sleep 5

# 6. Check status
echo -e "${YELLOW}Step 4: Checking server status...${NC}"
pm2 describe gregmat-server

# 7. Show initial memory usage
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${YELLOW}📊 Initial Memory Usage:${NC}"
pm2 describe gregmat-server | grep -A 5 "Memory usage"

echo ""
echo -e "${YELLOW}📋 Monitor the server with these commands:${NC}"
echo "  pm2 monit                    # Real-time monitoring"
echo "  pm2 logs gregmat-server      # View logs"
echo "  pm2 describe gregmat-server  # Detailed status"
echo ""
echo -e "${YELLOW}⚠️  Monitor memory for 24 hours to ensure stability${NC}"
