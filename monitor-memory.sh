#!/bin/bash

# Memory Monitoring Script
# Run this to continuously monitor memory usage

echo "🔍 Monitoring memory usage for gregmat-server..."
echo "Press Ctrl+C to stop"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Warning threshold in MB
WARNING_THRESHOLD=1200
CRITICAL_THRESHOLD=1400

while true; do
    clear
    echo "================================================"
    echo "   📊 GregMat Server Memory Monitor"
    echo "   $(date '+%Y-%m-%d %H:%M:%S')"
    echo "================================================"
    echo ""
    
    # Get PM2 info
    PM2_INFO=$(pm2 jlist)
    
    # Extract memory usage (in bytes)
    MEMORY_BYTES=$(echo "$PM2_INFO" | jq '.[0].monit.memory' 2>/dev/null)
    
    if [ -n "$MEMORY_BYTES" ] && [ "$MEMORY_BYTES" != "null" ]; then
        # Convert to MB
        MEMORY_MB=$((MEMORY_BYTES / 1024 / 1024))
        
        # Color based on threshold
        if [ $MEMORY_MB -gt $CRITICAL_THRESHOLD ]; then
            COLOR=$RED
            STATUS="🔴 CRITICAL"
        elif [ $MEMORY_MB -gt $WARNING_THRESHOLD ]; then
            COLOR=$YELLOW
            STATUS="⚠️  WARNING"
        else
            COLOR=$GREEN
            STATUS="✅ OK"
        fi
        
        echo -e "Memory Usage: ${COLOR}${MEMORY_MB}MB${NC}"
        echo -e "Status: ${COLOR}${STATUS}${NC}"
        echo ""
        
        # Show memory bar
        PERCENT=$((MEMORY_MB * 100 / 1536))  # Based on 1.5GB limit
        BAR_LENGTH=$((PERCENT / 2))
        
        echo -n "["
        for i in $(seq 1 50); do
            if [ $i -le $BAR_LENGTH ]; then
                echo -n "="
            else
                echo -n " "
            fi
        done
        echo "] ${PERCENT}%"
        
    else
        echo -e "${RED}❌ Could not retrieve memory info${NC}"
        echo "Make sure gregmat-server is running: pm2 list"
    fi
    
    echo ""
    echo "------------------------------------------------"
    
    # Show process details
    pm2 describe gregmat-server 2>/dev/null | grep -E "(status|uptime|restarts|memory|cpu)" || echo "Process not found"
    
    echo ""
    echo "------------------------------------------------"
    echo "System Memory:"
    free -h | grep -E "(Mem|Swap)"
    
    echo ""
    echo "Press Ctrl+C to exit | Refreshing in 10 seconds..."
    
    # Wait 10 seconds
    sleep 10
done
