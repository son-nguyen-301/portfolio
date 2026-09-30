locals {
  name = "portfolio"
}

# --- Static assets ---------------------------------------------------------
resource "aws_s3_bucket" "assets" {
  bucket = "${local.name}-assets-${data.aws_caller_identity.current.account_id}"
}

data "aws_caller_identity" "current" {}

resource "aws_s3_bucket_public_access_block" "assets" {
  bucket                  = aws_s3_bucket.assets.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
  }
}

# --- Lambda ----------------------------------------------------------------
data "archive_file" "stub" {
  type        = "zip"
  output_path = "${path.module}/.stub.zip"
  source {
    content  = "export const handler = async () => ({ statusCode: 200, body: 'stub' });"
    filename = "index.mjs"
  }
}

resource "aws_cloudwatch_log_group" "ssr" {
  name              = "/aws/lambda/${local.name}-ssr"
  retention_in_days = 14
}

data "aws_iam_policy_document" "lambda_trust" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ssr" {
  name               = "${local.name}-ssr"
  assume_role_policy = data.aws_iam_policy_document.lambda_trust.json
}

# Only what the function needs: write its own logs. No AWSLambdaBasicExecutionRole wildcard.
data "aws_iam_policy_document" "ssr_logs" {
  statement {
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.ssr.arn}:*"]
  }
}

resource "aws_iam_role_policy" "ssr_logs" {
  role   = aws_iam_role.ssr.id
  policy = data.aws_iam_policy_document.ssr_logs.json
}

resource "aws_lambda_function" "ssr" {
  function_name = "${local.name}-ssr"
  role          = aws_iam_role.ssr.arn
  runtime       = "nodejs22.x"
  handler       = "index.handler"
  architectures = ["arm64"]
  memory_size   = 512
  timeout       = 10

  filename         = data.archive_file.stub.output_path
  source_code_hash = data.archive_file.stub.output_base64sha256

  environment {
    variables = { NITRO_PRESET = "aws-lambda" }
  }

  depends_on = [aws_cloudwatch_log_group.ssr]

  # The deploy workflow owns the code; Terraform must not roll it back to the stub.
  lifecycle {
    ignore_changes = [filename, source_code_hash, layers]
  }
}

resource "aws_lambda_function_url" "ssr" {
  function_name      = aws_lambda_function.ssr.function_name
  authorization_type = "AWS_IAM"          # CloudFront signs requests via OAC; nobody else can call it
  invoke_mode        = "RESPONSE_STREAM"  # matches awsLambda.streaming = true
}

# Allow CloudFront (this account only) to invoke the URL. The distribution ARN is
# referenced from Step 4; Terraform resolves the cycle because this is a separate resource.
resource "aws_lambda_permission" "cloudfront" {
  statement_id           = "AllowCloudFrontOAC"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.ssr.function_name
  principal              = "cloudfront.amazonaws.com"
  source_arn             = aws_cloudfront_distribution.site.arn
  function_url_auth_type = "AWS_IAM"
}

output "assets_bucket" { value = aws_s3_bucket.assets.bucket }
output "lambda_name"   { value = aws_lambda_function.ssr.function_name }