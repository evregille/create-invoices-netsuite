data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
variable "metronome_api_key" {}

variable "region" {
    default     = "us-west-2"
    type = string
    description = "AWS Region to deploy to"
}

variable "lambda_node_version" {
    type = string
    default = "nodejs20.x"
}

variable "cloud_watch_retention_days" {
  default = 1
  type = number
}

variable "log_errors_bucket_name_s3" {
  default = "metronome-invoices-errors"
  type= string
}

# CONFIGURE INVOICES FILTERS
variable "metronome_invoices_types" {
    default = ["USAGE", "SCHEDULED"]
    type = list(string)
    description = "Metronome invoice types to create in billing provider"
}

variable "metronome_billing_provider_customer_id" {
    default = "billing_provider_customer_id"
    type = string
    description = "Metronome custom field key name sets on customer object for the billing provider customer ID"
}
variable "metronome_billing_provider_item_id" {
  default = "billing_provider_item_id"
  type = string
  description = "Metronome custom field key name sets on product object for the billing provider item ID"
}
variable "line_item_name_separator" {
  default = " / "
  type = string
  description = "Separator between the Metronome grouping keys."
}
variable "billing_provider_retries" {
    default = 1
    type = number
}
variable "ns_invoice_custom_form_id" {
  default = "178"
  type = string
  description = "netsuite invoice custom form id"
}

variable "ns_invoice_custom_form_ref_name" {
  default = "Z -HM Invoice Form"
  type = string
  description = "netsuite invoice custom form refName"
}

# NETSUITE CONFIGURATION
variable "ns_account_id" {}
variable "ns_consumer_key" {}
variable "ns_consumer_secret" {}
variable "ns_token_id" {}
variable "ns_token_secret" {}
