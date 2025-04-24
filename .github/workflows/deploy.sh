#!/bin/bash
set -e

echo "🚀 Starting Path Finder deployment..."

# Build images
echo "📦 Building Docker images..."
docker-compose build

# Start services
echo "🌟 Starting services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 10

# Health checks
echo "🏥 Checking service health..."
curl -f http://localhost:5000/api/health || exit 1
curl -f http://localhost:3000 || exit 1

echo "✅ Deployment complete!"