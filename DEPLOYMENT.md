# Deployment Guide

## Architecture

```
GitHub (source code)
    │
    ├── push to master (infra/ changed)
    │       └── infra.yml → terraform apply → EC2 + ECR + OIDC role on AWS
    │
    └── push to master (app code changed)
            └── deploy.yml → build images → push to ECR → SSH to EC2 → docker compose up
```

```
AWS (runtime)
    │
    ├── ECR
    │   ├── healthcare-ai-nextjs   (Next.js image)
    │   └── healthcare-ai-api      (FastAPI image)
    │
    └── EC2 t3.micro
        └── Docker Compose
            ├── nginx      (port 80, reverse proxy)
            ├── nextjs     (port 3000)
            └── api        (port 8000)
```

**External services** (not hosted on AWS):
- Neon — PostgreSQL database
- Clerk — authentication
- OpenAI — AI generation

---

## How CI/CD Works

### `infra.yml` — Infrastructure provisioning
- Triggers on push to `master` when files under `infra/` change
- Authenticates to AWS via OIDC (no static keys)
- Runs `terraform apply` — creates/updates EC2, ECR repos, security group, IAM roles
- Copies `docker-compose.yml` and `nginx.conf` to the EC2 instance

### `deploy.yml` — Application deployment
- Triggers on push to `master` when app code changes
- Also triggers automatically after `infra.yml` completes
- Authenticates to AWS via OIDC
- Builds Docker images for Next.js and FastAPI
- Pushes both images to ECR
- SSHes into EC2, pulls new images, restarts containers

### OIDC (no long-lived AWS keys in GitHub)
GitHub Actions requests a short-lived token from AWS using OpenID Connect. AWS trusts GitHub's identity provider and allows the token to assume a specific IAM role. No `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` stored anywhere.

### Terraform state
Stored in S3 with native file locking (`use_lockfile = true`, Terraform 1.11+). A `.tflock` file is written to S3 during `apply` to prevent concurrent runs from corrupting state.

---

## One-Time Bootstrap

Run once from **AWS CloudShell** — no local setup needed.

### 1. Open CloudShell
In the AWS Console, click the CloudShell icon (top navigation bar). Make sure you're in your target region.

### 2. Install Terraform

```bash
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://rpm.releases.hashicorp.com/AmazonLinux/hashicorp.repo
sudo yum install -y terraform
terraform version   # must be 1.11+
```

### 3. Clone the repo

```bash
git clone https://github.com/euginevd/healthcare-ai.git
cd healthcare-ai/infra/bootstrap
```

### 4. Create S3 state bucket + bootstrap IAM user

```bash
terraform init
terraform apply
```

Note the outputs — you will need them shortly:

```bash
terraform output s3_bucket_name             # → TF_STATE_BUCKET
terraform output bootstrap_access_key_id    # temporary, used in next step only
terraform output -raw bootstrap_secret_access_key
```

### 5. Run the main terraform apply

This creates the EC2 instance, ECR repos, security group, and the OIDC IAM role that GitHub Actions will use for all future runs.

```bash
cd ../

terraform init \
  -backend-config="bucket=$(cd bootstrap && terraform output -raw s3_bucket_name)" \
  -backend-config="key=healthcare-ai/terraform.tfstate" \
  -backend-config="region=us-east-1" \
  -backend-config="encrypt=true" \
  -backend-config="use_lockfile=true"

terraform apply \
  -var="github_org=euginevd" \
  -var="github_repo=healthcare-ai"
```

### 6. Save the outputs

```bash
terraform output ec2_public_ip              # → EC2_HOST
terraform output github_actions_role_arn    # → AWS_ROLE_ARN
terraform output aws_account_id             # → AWS_ACCOUNT_ID
cat healthcare-ai-key.pem                   # → EC2_SSH_KEY (full file contents)
```

---

## GitHub Secrets

Go to: **GitHub repo → Settings → Secrets and variables → Actions**

| Secret | Where it comes from |
|---|---|
| `AWS_REGION` | The region you deployed into e.g. `us-east-1` |
| `AWS_ACCOUNT_ID` | `terraform output aws_account_id` |
| `AWS_ROLE_ARN` | `terraform output github_actions_role_arn` |
| `TF_STATE_BUCKET` | `terraform output s3_bucket_name` (from bootstrap) |
| `EC2_HOST` | `terraform output ec2_public_ip` |
| `EC2_SSH_KEY` | Contents of `infra/healthcare-ai-key.pem` |
| `GITHUB_ORG` | `euginevd` |
| `GITHUB_REPO` | `healthcare-ai` |
| `OPENAI_API_KEY` | Your OpenAI key |
| `DATABASE_URL` | Your Neon PostgreSQL connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Your Clerk publishable key |
| `CLERK_SECRET_KEY` | Your Clerk secret key |

---

## First Deployment

Once all secrets are set, push to master:

```bash
git add .
git commit -m "deploy"
git push origin master
```

GitHub Actions runs both workflows. The app will be live at:

```
http://<EC2_HOST>
```

---

## Ongoing Operations

### Deploy app changes
Push to `master`. `deploy.yml` runs automatically — builds, pushes, restarts.

### Change infrastructure
Edit any file under `infra/`, push to `master`. `infra.yml` runs `terraform apply`.

### SSH into the EC2 instance
```bash
ssh -i infra/healthcare-ai-key.pem ec2-user@<EC2_HOST>
```

### View running containers
```bash
ssh -i infra/healthcare-ai-key.pem ec2-user@<EC2_HOST>
docker compose -f /home/ec2-user/healthcare-ai/docker-compose.yml ps
docker compose -f /home/ec2-user/healthcare-ai/docker-compose.yml logs -f
```

### Tear down everything
```bash
cd infra
terraform destroy
```
The S3 state bucket has `prevent_destroy = true` — delete it manually in the AWS Console if needed.
