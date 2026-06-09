terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.80"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  type    = string
  default = "ap-southeast-2"
}

variable "github_org" {
  type    = string
  default = "euginevd"
}

variable "github_repo" {
  type    = string
  default = "healthcare-ai"
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

# OIDC provider so GitHub Actions can authenticate to AWS without static credentials
resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

# IAM role GitHub Actions assumes — broad enough to run the full infra apply
resource "aws_iam_role" "github_actions" {
  name = "${var.project}-github-actions-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = aws_iam_openid_connect_provider.github.arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringLike = {
          "token.actions.githubusercontent.com:sub" = "repo:${var.github_org}/${var.github_repo}:ref:refs/heads/main"
        }
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })
}

resource "aws_iam_role_policy" "github_actions" {
  name = "${var.project}-github-actions-policy"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["ec2:*", "ecr:*", "iam:*", "s3:*", "sts:GetCallerIdentity"]
      Resource = "*"
    }]
  })
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

output "github_actions_role_arn" {
  value       = aws_iam_role.github_actions.arn
  description = "Add this to GitHub secrets as AWS_ROLE_ARN"
}
