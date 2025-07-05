#!/bin/bash

# Emergency Assistance System - Stop Script

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo -e "${YELLOW}🛑 Stopping Emergency Assistance System...${NC}"

# Stop backend
if [ -f "backend.pid" ]; then
    BACKEND_PID=$(cat backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        echo -e "${GREEN}✅ Backend stopped${NC}"
    fi
    rm backend.pid
fi

# Stop frontend
if [ -f "frontend.pid" ]; then
    FRONTEND_PID=$(cat frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        echo -e "${GREEN}✅ Frontend stopped${NC}"
    fi
    rm frontend.pid
fi

# Stop dashboard
if [ -f "dashboard.pid" ]; then
    DASHBOARD_PID=$(cat dashboard.pid)
    if kill -0 $DASHBOARD_PID 2>/dev/null; then
        kill $DASHBOARD_PID
        echo -e "${GREEN}✅ Dashboard stopped${NC}"
    fi
    rm dashboard.pid
fi

# Kill any remaining node processes on our ports
fuser -k 3000/tcp 2>/dev/null
fuser -k 5000/tcp 2>/dev/null
fuser -k 8080/tcp 2>/dev/null

echo -e "${GREEN}🎉 All services stopped successfully!${NC}"
