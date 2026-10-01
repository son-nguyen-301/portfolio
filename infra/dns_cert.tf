provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

data "cloudflare_zones" "main" {
  name = var.zone_name   # v5: plain argument, no filter block
}

locals {
  zone_id = data.cloudflare_zones.main.result[0].id
}

resource "aws_acm_certificate" "site" {
  provider          = aws.us_east_1
  domain_name       = var.domain
  validation_method = "DNS"

  lifecycle { create_before_destroy = true }
}

resource "cloudflare_dns_record" "acm_validation" {
  for_each = {
    for dvo in aws_acm_certificate.site.domain_validation_options :
    dvo.domain_name => { name = dvo.resource_record_name, type = dvo.resource_record_type, value = dvo.resource_record_value }
  }

  zone_id = local.zone_id
  name    = each.value.name
  type    = each.value.type
  content = each.value.value
  ttl     = 60
  proxied = false
}

resource "aws_acm_certificate_validation" "site" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.site.arn
  validation_record_fqdns = [for r in cloudflare_dns_record.acm_validation : r.name]
}

resource "cloudflare_dns_record" "site" {
  zone_id = local.zone_id
  name    = var.domain                     # me.haisonnguyen.dev
  type    = "CNAME"
  content = aws_cloudfront_distribution.site.domain_name
  ttl     = 1                              # 1 = auto
  proxied = false                          # DNS-only: CloudFront is the CDN, not Cloudflare
}