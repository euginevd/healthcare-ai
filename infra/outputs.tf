output "ec2_public_ip" {
  description = "Public IP of the EC2 instance — use this in GitHub secrets as EC2_HOST"
  value       = aws_instance.app.public_ip
}

output "ecr_nextjs_url" {
  description = "ECR URL for the Next.js image"
  value       = aws_ecr_repository.nextjs.repository_url
}

output "ecr_api_url" {
  description = "ECR URL for the API image"
  value       = aws_ecr_repository.api.repository_url
}

output "github_actions_role_arn" {
  description = "IAM role ARN — add this to GitHub secrets as AWS_ROLE_ARN"
  value       = aws_iam_role.github_actions.arn
}

output "aws_account_id" {
  description = "AWS account ID — add this to GitHub secrets as AWS_ACCOUNT_ID"
  value       = data.aws_caller_identity.current.account_id
}

data "aws_caller_identity" "current" {}
