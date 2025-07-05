#!/bin/bash

# Emergency Assistance System - Complete Application Startup Script
# This script starts all components of the emergency assistance system

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚨 Starting Emergency Assistance System...${NC}"

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${YELLOW}⚠️  Port $port is already in use${NC}"
        return 1
    else
        echo -e "${GREEN}✅ Port $port is available${NC}"
        return 0
    fi
}

# Function to start backend
start_backend() {
    echo -e "${BLUE}🔧 Starting Backend Server...${NC}"
    cd operational_backend
    
    # Check if backend dependencies are installed
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
        npm install
    fi
    
    # Start backend in background
    if check_port 5000; then
        echo -e "${GREEN}🚀 Starting backend on port 5000...${NC}"
        npm run dev &
        BACKEND_PID=$!
        echo $BACKEND_PID > ../backend.pid
        sleep 5
        echo -e "${GREEN}✅ Backend started successfully (PID: $BACKEND_PID)${NC}"
    else
        echo -e "${RED}❌ Cannot start backend - port 5000 is occupied${NC}"
        return 1
    fi
    
    cd ..
}

# Function to start frontend
start_frontend() {
    echo -e "${BLUE}📱 Starting Frontend Application...${NC}"
    cd operational_frontend
    
    # Check if frontend dependencies are installed
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
        npm install --legacy-peer-deps
    fi
    
    # Start frontend web version in background
    if check_port 3000; then
        echo -e "${GREEN}🚀 Starting frontend on port 3000...${NC}"
        npm run web &
        FRONTEND_PID=$!
        echo $FRONTEND_PID > ../frontend.pid
        sleep 5
        echo -e "${GREEN}✅ Frontend started successfully (PID: $FRONTEND_PID)${NC}"
    else
        echo -e "${RED}❌ Cannot start frontend - port 3000 is occupied${NC}"
        return 1
    fi
    
    cd ..
}

# Function to start dashboard
start_dashboard() {
    echo -e "${BLUE}🖥️  Starting Responder Dashboard...${NC}"
    cd operational_responder_dashboard
    
    # Check if dashboard dependencies are installed
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing dashboard dependencies...${NC}"
        npm install
    fi
    
    # Start dashboard in background
    if check_port 8080; then
        echo -e "${GREEN}🚀 Starting dashboard on port 8080...${NC}"
        # Create a start script for dashboard
        echo "npx expo start --web --port 8080" > start_dashboard.sh
        chmod +x start_dashboard.sh
        ./start_dashboard.sh &
        DASHBOARD_PID=$!
        echo $DASHBOARD_PID > ../dashboard.pid
        sleep 5
        echo -e "${GREEN}✅ Dashboard started successfully (PID: $DASHBOARD_PID)${NC}"
    else
        echo -e "${RED}❌ Cannot start dashboard - port 8080 is occupied${NC}"
        return 1
    fi
    
    cd ..
}

# Function to display access information
show_access_info() {
    echo -e "\n${GREEN}🎉 Emergency Assistance System is now running!${NC}"
    echo -e "\n${BLUE}📍 Access URLs:${NC}"
    echo -e "   📱 Frontend (User App):    ${GREEN}http://localhost:3000${NC}"
    echo -e "   🖥️  Dashboard (Responders): ${GREEN}http://localhost:8080${NC}"
    echo -e "   🔧 Backend API:           ${GREEN}http://localhost:5000${NC}"
    echo -e "   🩺 Health Check:          ${GREEN}http://localhost:5000/health${NC}"
    
    echo -e "\n${BLUE}📋 System Components:${NC}"
    echo -e "   ✅ Backend Server (Node.js/Express + Socket.io)"
    echo -e "   ✅ Frontend Application (React Native Web)"
    echo -e "   ✅ Responder Dashboard (React/Expo)"
    echo -e "   ✅ Real-time Chat & Location Tracking"
    echo -e "   ✅ Emergency Request Management"
    
    echo -e "\n${YELLOW}⚠️  Note: Firebase services are running in development mode${NC}"
    echo -e "${YELLOW}   To enable full Firebase functionality, update the service account in:${NC}"
    echo -e "${YELLOW}   operational_backend/config/firebase-service-account.json${NC}"
    
    echo -e "\n${BLUE}🔄 To stop all services, run:${NC}"
    echo -e "   ${GREEN}./stop-app.sh${NC}"
}

# Function to create stop script
create_stop_script() {
    cat > stop-app.sh << 'EOF'
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
EOF
    chmod +x stop-app.sh
}

# Main execution
main() {
    echo -e "${BLUE}🔍 Checking system requirements...${NC}"
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Node.js and npm are available${NC}"
    
    # Create stop script
    create_stop_script
    
    # Start services
    start_backend
    if [ $? -eq 0 ]; then
        start_frontend
        if [ $? -eq 0 ]; then
            start_dashboard
            if [ $? -eq 0 ]; then
                show_access_info
                
                # Wait for user input to stop
                echo -e "\n${YELLOW}Press [CTRL+C] to stop all services${NC}"
                trap 'echo -e "\n${YELLOW}Stopping services...${NC}"; ./stop-app.sh; exit' INT
                
                # Keep script running
                while true; do
                    sleep 1
                done
            fi
        fi
    fi
}

# Run main function
main
