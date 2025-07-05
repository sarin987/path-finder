# AWS Deployment Guide for Operational Responder

This guide will walk you through deploying the Operational Responder application to AWS using Terraform and ECS Fargate.

## Prerequisites

1. AWS CLI installed and configured with appropriate permissions
2. Terraform installed (v1.0+)
3. Docker installed
4. AWS credentials configured with permissions for ECS, ECR, RDS, and other required services

## Deployment Steps

### 1. Initialize Terraform

```bash
cd terraform
terraform init
```

### 2. Create a `terraform.tfvars` file

Create a `terraform.tfvars` file in the terraform directory with the following content:

```hcl
aws_region = "us-west-2"
db_username = "your_db_username"
db_password = "your_secure_password"
db_name     = "operational_responder"
environment = "production"
```

### 3. Plan and Apply Terraform

```bash
# Plan the deployment
terraform plan -out=tfplan

# Apply the changes
terraform apply tfplan
```

### 4. Build and Push Docker Image

Make the deployment script executable and run it:

```bash
chmod +x deploy.sh
./deploy.sh
```

### 5. Update ECS Service (if needed)

If you've already deployed the service and just need to update the container image:

```bash
aws ecs update-service \
  --cluster operational-responder-cluster \
  --service operational-responder-backend \
  --force-new-deployment \
  --region us-west-2
```

## Accessing the Application

After deployment, you can access the application using the ALB DNS name shown in the Terraform outputs.

## Database Migrations

Run database migrations manually after the initial deployment:

```bash
# Replace with your task ID
task_id=$(aws ecs list-tasks --cluster operational-responder-cluster --service operational-responder-backend --query 'taskArns[0]' --output text)

# Run migrations
aws ecs execute-command \
  --cluster operational-responder-cluster \
  --task $task_id \
  --container backend \
  --command "/bin/sh -c 'npx sequelize-cli db:migrate'" \
  --interactive \
  --region us-west-2
```

## Cleaning Up

To destroy all resources created by Terraform:

```bash
cd terraform
terraform destroy
```

## Monitoring

- **ECS**: Monitor your ECS service in the AWS ECS console
- **RDS**: Monitor database performance in the RDS console
- **CloudWatch**: Check logs and set up alarms in CloudWatch

## Troubleshooting

- **ECS Service Not Starting**: Check the ECS service events in the AWS Console
- **Database Connection Issues**: Verify security group rules and database credentials
- **Container Health Checks Failing**: Check the container logs in CloudWatch Logs
