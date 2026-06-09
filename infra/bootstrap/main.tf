terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "project" {
  type    = string
  default = "healthcare-ai"
}

# S3 bucket for terraform state
resource "aws_s3_bucket" "tf_state" {
  bucket = "${var.project}-tf-state-${data.aws_caller_identity.current.account_id}"

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "tf_state" {
  bucket = aws_s3_bucket.tf_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tf_state" {
  bucket = aws_s3_bucket.tf_state.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "tf_state" {
  bucket                  = aws_s3_bucket.tf_state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# IAM user with just enough permissions for the one-time bootstrap
# After bootstrap, GitHub Actions uses OIDC — this user can be deleted
resource "aws_iam_user" "bootstrap" {
  name = "${var.project}-bootstrap"
}

resource "aws_iam_user_policy" "bootstrap" {
  user = aws_iam_user.bootstrap.name
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:*"]
        Resource = [aws_s3_bucket.tf_state.arn, "${aws_s3_bucket.tf_state.arn}/*"]
      },
      {
        # Permissions needed to create the main infra (EC2, ECR, IAM, OIDC)
        Effect = "Allow"
        Action = [
          "ec2:*",
          "ecr:*",
          "iam:*",
          "sts:GetCallerIdentity"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_access_key" "bootstrap" {
  user = aws_iam_user.bootstrap.name
}

data "aws_caller_identity" "current" {}

output "s3_bucket_name" {
  value = aws_s3_bucket.tf_state.bucket
}

output "bootstrap_access_key_id" {
  value = aws_iam_access_key.bootstrap.id
}

output "bootstrap_secret_access_key" {
  value     = aws_iam_access_key.bootstrap.secret
  sensitive = true
}
