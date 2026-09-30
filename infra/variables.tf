variable "cloudflare_api_token" {
  type      = string
  sensitive = true
}

variable "domain" {
  type    = string
  default = "me.haisonnguyen.dev"
}

variable "zone_name" {
  type    = string
  default = "haisonnguyen.dev"
}