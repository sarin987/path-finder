#!/bin/bash

# Exit on error
set -e

# Variables
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=$(aws configure get region)
ENVIRONMENT=${1:-production}

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment to ${ENVIRONMENT} environment...${NC}"

# Function to build and push a Docker image
build_and_push() {
  local service=$1
  local context=$2
  local dockerfile=${3:-Dockerfile}
  
  echo -e "${YELLOW}Building ${service} Docker image...${NC}"
  
  # Build the Docker image
  docker build -t ${service}:${ENVIRONMENT} -f ${context}/${dockerfile} ${context}
  
  # Tag the image for ECR
  docker tag ${service}:${ENVIRONMENT} ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${service}:${ENVIRONMENT}
  
  echo -e "${YELLOW}Pushing ${service} to ECR...${NC}"
  
  # Push the image to ECR
  docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${service}:${ENVIRONMENT}
  
  echo -e "${GREEN}Successfully deployed ${service} to ECR!${NC}"
}

# Login to ECR
echo -e "${YELLOW}Logging in to ECR...${NC}"
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Deploy each service
declare -a services=("operational-backend" "operational-frontend" "operational-responder-dashboard")

for service in "${services[@]}"; do
  case $service in
    "operational-backend")
      build_and_push $service "operational_backend" "Dockerfile"
      ;;
    "operational-frontend")
      build_and_push $service "operational_frontend" "Dockerfile"
      ;;
    "operational-responder-dashboard")
      build_and_push $service "operational_responder_dashboard" "Dockerfile"
      ;;
  esac
done

# Update ECS services
echo -e "${YELLOW}Updating ECS services...${NC}"

for service in "${services[@]}"; do
  echo -e "${YELLOW}Updating ${service} service...${NC}"
  aws ecs update-service \
    --cluster operational-responder-cluster \
    --service ${service} \
    --force-new-deployment \
    --region ${AWS_REGION}
  
  echo -e "${GREEN}${service} service update initiated!${NC}"
done

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${YELLOW}Please allow a few minutes for the new containers to start and for the load balancer to route traffic.${NC}"
