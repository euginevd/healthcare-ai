variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "Project name prefix for all resources"
  type        = string
  default     = "healthcare-ai"
}

variable "github_org" {
  description = "GitHub organisation or username (e.g. euginevd)"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name (e.g. healthcare-ai)"
  type        = string
}

variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "ec2_ami" {
  description = "Amazon Linux 2023 AMI ID for the chosen region"
  type        = string
  # Update this to the current AL2023 AMI for your region:
  # aws ec2 describe-images --owners amazon --filters "Name=name,Values=al2023-ami-*-x86_64" --query 'sort_by(Images,&CreationDate)[-1].ImageId' --output text
  default     = "ami-0c101f26f147fa7fd"
}
