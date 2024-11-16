// https://www.notion.so/teammetronome/Updating-Invoice-Status-API-30f446648102410eb281f9df4a310d0c
import crypto from 'crypto';
import OAuth from 'oauth-1.0a';

const METRONOME_API_KEY = process.env['METRONOME_API_KEY'] || '';
const NS_ACCOUNT_ID = process.env['NS_ACCOUNT_ID'] || '';
const NS_CONSUMER_KEY = process.env['NS_CONSUMER_KEY'] || '';
const NS_CONSUMER_SECRET = process.env['NS_CONSUMER_SECRET'] || '';
const NS_TOKEN_ID = process.env['NS_TOKEN_ID'] || '';
const NS_TOKEN_SECRET = process.env['NS_TOKEN_SECRET'] || '';
const ALGORITHM = 'HMAC-SHA256';

const METRONOME_STATUS = ["DRAFT",
    "FINALIZED",
    "PAID",
    "UNCOLLECTIBLE",
    "VOID",
    "DELETED",
    "PAYMENT_FAILED",
    "INVALID_REQUEST_ERROR"]

type Invoice = {
    id: string,
    metronome_customer_id: string,
    external_customer_id: string,
    start_date: string,
    end_date: string,
    issue_date: string,
    line_items: LineItem[],
}

type LineItem = {
    quantity: number,
    name: string, 
    amount: number,
    external_item_id: string,
}

type NetsuiteInvoice = {
    entity: {id: string},
    item: Array<any>,
    externalId: string,
    startDate: string,
    endDate: string,
    customForm: any,
}

type AuthParameters = any

// Netsuite Parameters
const NS_REST_URL = `https://${NS_ACCOUNT_ID.toLowerCase().replace(/_/g, '-')}.suitetalk.api.netsuite.com/services/rest/`;
const NS_CUSTOM_FORM = {
    "id": "178",
    "refName": "Z -HM Invoice Form"
}
const path = 'record/v1/invoice';
const method = 'POST';
const url = `${NS_REST_URL}${path}`;
const BILLING_PROVIDER_NAME='netsuite'

export const handler = async function(message: any){
    try{
        const invoice: Invoice = JSON.parse(message?.Records[0]?.body);
        if(!invoice) throw new Error(`Error fetching the Metronome Invoice`);
        console.log(`message received to process invoice ${invoice.id} for customer ${invoice.metronome_customer_id}`)
        const netsuiteInvoice: NetsuiteInvoice = formatMetronomeInvoiceToNetsuite(invoice);
        console.log(`invoice formatted to be sent to NS`, JSON.stringify(netsuiteInvoice));
        const responseNSRequest = await sendNetsuiteRequest(netsuiteInvoice);  
        console.log(`invoice created in NS with error = ${responseNSRequest.error} and status = ${responseNSRequest.status}`);
        const responseStatusMetronome = await updateInvoiceStatusInMetronome(
            responseNSRequest.error || responseNSRequest.status >= 400 ?  METRONOME_STATUS[7] :METRONOME_STATUS[1] , 
            invoice.id,
            invoice.issue_date,
            responseNSRequest.error || responseNSRequest.status >= 400 ? undefined : responseNSRequest.data ? responseNSRequest.data : ''
        );
        console.log(`metronome invoice billing provider created with error = ${responseStatusMetronome.error} and status = ${responseStatusMetronome.status}`)
        if(responseNSRequest.error || responseNSRequest.status >= 400) throw Error('Error creating the Netsuite invoice');
    } catch(error){
        console.log('exception', error)
        throw error;
    }
}

const formatMetronomeInvoiceToNetsuite = function (invoice: Invoice): any {
    return {
        "entity": {
            "id": invoice.external_customer_id
        },
        "item": {
            "items": invoice.line_items.map(item => {
                return {
                    "item": {
                        "id": item.external_item_id
                    },
                    "description": item.name,
                    "quantity": item.quantity,
                    "amount": item.amount
                }
            })
        },
        "externalId":invoice.id,
        "startDate": invoice.start_date,
        "endDate": invoice.end_date,
        "customForm": NS_CUSTOM_FORM
    }
}

const sendNetsuiteRequest = async function(data: any ): Promise<any> {
    const parameters = {
        realm: NS_ACCOUNT_ID.toUpperCase(),
        consumer_key: NS_CONSUMER_KEY,
        consumer_secret : NS_CONSUMER_SECRET,
        token: NS_TOKEN_ID,
        token_secret: NS_TOKEN_SECRET,
        url: url,
        method: method
    };
    const headers = getAuthorizationHeader(parameters);
    try {
        const response = await fetch( url , {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body: JSON.stringify(data) 
        });
        return {
            error: false,
            status: response.status,
            data: response.status < 400 ? response.headers.get('location') : await response.json()
        }
    } catch (e){
        console.log('Exception', e)
        return {
            error: true,
            message: `Exception Netsuite Request - ${JSON.stringify(e)}`,
        };
    }
}

const getAuthorizationHeader = function(parameters: AuthParameters) : any {
    const oauth = new OAuth({
      consumer: {
        key: parameters.consumer_key,
        secret: parameters.consumer_secret,
      },
      realm: parameters.realm,
      signature_method: ALGORITHM,
      hash_function(base_string, key) {
        return crypto
          .createHmac("sha256", key)
          .update(base_string)
          .digest("base64");
      },
    });
    return oauth.toHeader(
      oauth.authorize(
        {
          url: parameters.url,
          method: parameters.method,
        },
        {
          key: parameters.token,
          secret: parameters.token_secret,
        }
      )
    );
}

const updateInvoiceStatusInMetronome = async function(
    status: string, 
    metronomeInvoiceId: string | undefined, 
    issued_at: string, 
    billing_provider_invoice_id: string): Promise<any> {
    const url = `https://api.metronome.com/v1/invoices/billingProvider`;
    console.log({
        "billing_provider_invoice_id": billing_provider_invoice_id,
        "invoice_id": metronomeInvoiceId,
        "billing_provider": BILLING_PROVIDER_NAME,
        "issued_at": issued_at,
        "external_status": status
      })
    try {
        const response = await fetch( url , {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${METRONOME_API_KEY}`
            },
            body: JSON.stringify([
                {
                  "billing_provider_invoice_id": billing_provider_invoice_id,
                  "invoice_id": metronomeInvoiceId,
                  "billing_provider": BILLING_PROVIDER_NAME,
                  "issued_at": issued_at,
                  "external_status": status
                }
              ])
        });
        return {
            error: response.status < 400 ? false : true,
            status: response.status,
            message: '',
            data: await response.json()
        }
    } catch (e){
        console.log('Exception', e)
        return {
            error: true,
            message: `Exception Metronome request to update the invoice status - ${JSON.stringify(e)}`,
        };
    }
}