terraform {
  required_version = ">= 1.10"

  backend "s3" {
    bucket       = "haisonnguyen-portfolio-tfstate-441353787478"
    key          = "portfolio/prod/terraform.tfstate"
    region       = "ap-southeast-1"
    use_lockfile = true
    encrypt      = true
  }

  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 6.0" }
    tls = { source = "hashicorp/tls", version = "~> 4.0" }
    cloudflare = { source = "cloudflare/cloudflare", version = "~> 5.0" }
    archive = { source = "hashicorp/archive", version = "~> 2.0" }
  }
}

provider "aws" {
  region = "ap-southeast-1"
  default_tags { tags = { project = "portfolio", env = "prod", managed_by = "terraform" } }
}

# Only for the CloudFront certificate
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
  default_tags { tags = { project = "portfolio", env = "prod", managed_by = "terraform" } }
}