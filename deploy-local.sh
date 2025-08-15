#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting local deployment...${NC}"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}ℹ️  Please edit the .env file with your configuration and run this script again.${NC}"
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Create necessary directories
echo -e "📂 Creating necessary directories..."
mkdir -p mysql/data mysql/init mysql/conf.d mysql/backups
mkdir -p operational_backend/logs operational_backend/uploads

# Set proper permissions
echo -e "🔒 Setting file permissions..."
chmod +x operational_backend/docker-entrypoint.sh
chmod -R 777 mysql/data operational_backend/logs operational_backend/uploads

# Build and start containers
echo -e "🐳 Starting Docker containers..."
docker-compose down --remove-orphans
docker-compose up -d --build

# Wait for services to be ready
echo -e "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
echo -e "🔍 Checking services status..."
docker-compose ps

# Show service URLs
echo -e "\n${GREEN}✅ Deployment successful!${NC}"
echo -e "\n🌐 Services are running at:"
echo -e "----------------------------------------"
echo -e "Frontend:     http://localhost:3000"
echo -e "Backend API:  http://localhost:5000/api"
echo -e "Ngrok UI:     http://localhost:4040"
echo -e "phpMyAdmin:   http://localhost:8080"
echo -e "----------------------------------------"
echo -e "\n📝 Logs can be viewed with: docker-compose logs -f"
echo -e "🛑 To stop services: docker-compose down"

# If ngrok is enabled, show public URL
if [ "$NGROK_ENABLED" = "true" ] && [ -n "$NGROK_AUTH" ]; then
    echo -e "\n🌍 Waiting for ngrok URL..."
    sleep 5
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url' 2>/dev/null || echo "")
    if [ -n "$NGROK_URL" ]; then
        echo -e "\n🔗 ${GREEN}Ngrok Public URL: $NGROK_URL${NC}"
        echo -e "   Use this URL to access your application from the internet"
    fi
fi

echo -e "\n✨ Deployment completed successfully!"
