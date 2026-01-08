variable "aws_region" {
  description = "AWS Region to deploy resources"
  type        = string
  default     = "ap-southeast-1" // Singapore (Good for Vietnam)
}

variable "project_name" {
  description = "Project Name Prefix"
  type        = string
  default     = "ecommerce-platform"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}
