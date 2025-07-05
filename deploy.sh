#!/bin/bash

# Exit on error
set -e

# Variables
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION="us-west-2"
ECR_REPOSITORY="operational-responder-backend"
TAG="latest"

# Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build Docker image
echo "Building Docker image..."
docker build -t $ECR_REPOSITORY:$TAG -f operational_backend/Dockerfile ./operational_backend

# Tag Docker image
echo "Tagging Docker image..."
docker tag $ECR_REPOSITORY:$TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$TAG

# Push Docker image
echo "Pushing Docker image to ECR..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$TAG

echo "Deployment completed successfully!"
echo "Don't forget to run 'terraform apply' to update the ECS service with the new image."
