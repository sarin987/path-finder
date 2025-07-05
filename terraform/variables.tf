variable "aws_region" {
  description = "AWS region to deploy to"
  type        = string
  default     = "us-west-2"
}

variable "domain_name" {
  description = "Base domain name for the application (e.g., example.com)"
  type        = string
}

variable "db_username" {
  description = "Database username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "operational_responder"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

variable "frontend_port" {
  description = "Port for the frontend application"
  type        = number
  default     = 3000
}

variable "dashboard_port" {
  description = "Port for the responder dashboard"
  type        = number
  default     = 3001
}

variable "backend_port" {
  description = "Port for the backend API"
  type        = number
  default     = 5000
}

variable "frontend_cpu" {
  description = "CPU units for frontend task"
  type        = number
  default     = 256
}

variable "frontend_memory" {
  description = "Memory (in MiB) for frontend task"
  type        = number
  default     = 512
}

variable "dashboard_cpu" {
  description = "CPU units for dashboard task"
  type        = number
  default     = 256
}

variable "dashboard_memory" {
  description = "Memory (in MiB) for dashboard task"
  type        = number
  default     = 512
}

variable "backend_cpu" {
  description = "CPU units for backend task"
  type        = number
  default     = 512
}

variable "backend_memory" {
  description = "Memory (in MiB) for backend task"
  type        = number
  default     = 1024
}
