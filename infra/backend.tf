terraform {
  backend "s3" {
    # Values filled in by GitHub Actions via -backend-config flags.
    # When running locally after bootstrap, create infra/backend.hcl:
    #   bucket       = "healthcare-ai-tf-state-<your-account-id>"
    #   key          = "healthcare-ai/terraform.tfstate"
    #   region       = "us-east-1"
    #   encrypt      = true
    #   use_lockfile = true
  }
}
