# Automatically create Metronome invoices in invoice provider
You need:
- an AWS account 
- Terraform
- Netsuite account
- Metronome account

# Configure
## 1. set up Metronome and Netsuite
1. Make sure that all Metronome customers and products are properly mapped via custom_fields with Netsuite Customers and Netsuite Items.

2. Authentication: you need a Metronome API Token as well as Netsuite OAuth1.0 consumer and tokens. 

## 2. set your secret keys
Create in the root folder a `terraform.tfvars` with the following content:
```bash
metronome_api_key="YOUR_METRONOME_API_KEY"
# if you use Netsuite a billing provider
ns_account_id="TSTDRVxxxx"
ns_consumer_key="NETSUITE_CONSUMER_KEY"
ns_consumer_secret="NS_CONSUMER_SECRET"
ns_token_id="NS_TOKEN_ID"
ns_token_secret="NS_TOKEN_SECRET"
# if you use Razorpay as billing provider
razorpay_apikey_id="RAZORPAY_API_KEY_ID"
razorpay_apikey_secret="RAZORPAY_API_KEY_SECRET"
```

## 3. set your integration settings
In the `variables.tf` files, you can update the default settings values:
| variable name                           | description                                    | examples               |
| ----------------------------------------|------------------------------------------------| -----------------------|
| metronome_invoices_types                | Metronome Invoices types to create in Billing Provider | ["USAGE", "SCHEDULED"] |
| metronome_billing_provider_customer_id  | Metronome custom field key name on Customer with the Billing Provider internal customer ID reference      |   "netsuite_internal_item_id" |
| metronome_billing_provider_destination  | Metronome custom field key name on Customer with the Billing Provider name: 'netsuite' | "billing_provider_destination" |
| metronome_billing_provider_item_id | Metronome custom field key name on Product for the Billing Provider internal Item ID| "netsuite_internal_item_id"|
| line_item_name_separator | In case of presentation/pricing grouping keys, it is the string used as a separator in the NS invoice line item description field | " / " |
| billing_provider_retries | how many times the creation invoice request to retry in case of failure| 1 |
| ns_invoice_custom_form_id & ns_invoice_custom_form_ref_name | reference name and id of the NS invoice template | |

## 4. deploy

you can choose how to configure your AWS authentication for Terraform, one way to deploy:
```bash
terraform init
AWS_ACCESS_KEY=YOURKEY AWS_SECRET_ACCESS_KEY=YOURSECRET terraform apply
```

## 5. configure metronome webhook
once you have deployed, you should see your webhook URL: go into Metronome and set it up to receive notifications when invoices are finalized.

# How it works

![overview](./overview.png?raw=true "overview")

