# --- Origin access controls ------------------------------------------------
resource "aws_cloudfront_origin_access_control" "s3" {
  name                              = "${local.name}-s3"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_origin_access_control" "lambda" {
  name                              = "${local.name}-lambda"
  origin_access_control_origin_type = "lambda"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# AWS managed policies, referenced by their fixed IDs
locals {
  cache_optimized       = "658327ea-f89d-4fab-a63d-7e88639e58f6" # CachingOptimized
  cache_disabled        = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # CachingDisabled
  origin_all_viewer_x_h = "b689b0a8-53d0-40ab-baf2-68fd8ad5b3a0" # AllViewerExceptHostHeader
  lambda_url_host       = trimsuffix(trimprefix(aws_lambda_function_url.ssr.function_url, "https://"), "/")
}

# --- Distribution ------------------------------------------------------------
resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  comment             = var.domain
  aliases             = [var.domain]
  price_class         = "PriceClass_200"   # excludes South America; covers Asia/EU/NA
  http_version        = "http2and3"
  is_ipv6_enabled     = true

  origin {
    origin_id                = "lambda"
    domain_name              = local.lambda_url_host
    origin_access_control_id = aws_cloudfront_origin_access_control.lambda.id
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  origin {
    origin_id                = "s3"
    domain_name              = aws_s3_bucket.assets.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.s3.id
  }

  default_cache_behavior {
    target_origin_id         = "lambda"
    viewer_protocol_policy   = "redirect-to-https"
    allowed_methods          = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods           = ["GET", "HEAD"]
    compress                 = true
    cache_policy_id          = local.cache_disabled
    origin_request_policy_id = local.origin_all_viewer_x_h
  }

  ordered_cache_behavior {
    path_pattern           = "/_nuxt/*"
    target_origin_id       = "s3"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    cache_policy_id        = local.cache_optimized
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.site.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }
}

# S3 only answers to this distribution
data "aws_iam_policy_document" "assets_cf" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.assets.arn}/*"]
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.site.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "assets" {
  bucket = aws_s3_bucket.assets.id
  policy = data.aws_iam_policy_document.assets_cf.json
}

output "cloudfront_domain" { value = aws_cloudfront_distribution.site.domain_name }
output "cloudfront_id"     { value = aws_cloudfront_distribution.site.id }