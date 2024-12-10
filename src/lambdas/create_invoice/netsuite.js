"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInvoiceInNetsuite = void 0;
const crypto_1 = __importDefault(require("crypto"));
const oauth_1_0a_1 = __importDefault(require("oauth-1.0a"));
// NETSUITE CONFIGURATION
const NS_ACCOUNT_ID = process.env['NS_ACCOUNT_ID'] || '';
const NS_CONSUMER_KEY = process.env['NS_CONSUMER_KEY'] || '';
const NS_CONSUMER_SECRET = process.env['NS_CONSUMER_SECRET'] || '';
const NS_TOKEN_ID = process.env['NS_TOKEN_ID'] || '';
const NS_TOKEN_SECRET = process.env['NS_TOKEN_SECRET'] || '';
const NS_INVOICE_CUSTOM_FORM = (process.env['NS_INVOICE_CUSTOM_FORM_ID'] && process.env['NS_INVOICE_CUSTOM_FORM_REF_NAME']) ? {
    id: process.env['NS_INVOICE_CUSTOM_FORM_ID'],
    refName: process.env['NS_INVOICE_CUSTOM_FORM_REF_NAME'],
} : undefined;
const NS_REST_URL = `https://${NS_ACCOUNT_ID.toLowerCase().replace(/_/g, '-')}.suitetalk.api.netsuite.com/services/rest/`;
const path = 'record/v1/invoice';
const method = 'POST';
const url = `${NS_REST_URL}${path}`;
const ALGORITHM = 'HMAC-SHA256';
const createInvoiceInNetsuite = (invoice) => __awaiter(void 0, void 0, void 0, function* () {
    const netsuiteInvoice = formatMetronomeInvoiceToNetsuite(invoice);
    console.log(`invoice formatted to be sent to NS`, JSON.stringify(netsuiteInvoice));
    const response = yield sendNetsuiteRequest(netsuiteInvoice);
    console.log(`invoice created in NS with error = ${response.error} and status = ${response.status}`);
    return response;
});
exports.createInvoiceInNetsuite = createInvoiceInNetsuite;
const formatMetronomeInvoiceToNetsuite = function (invoice) {
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
                };
            })
        },
        "externalId": invoice.id,
        "startDate": invoice.start_date,
        "endDate": invoice.end_date,
        "customForm": NS_INVOICE_CUSTOM_FORM
    };
};
const sendNetsuiteRequest = function (data) {
    return __awaiter(this, void 0, void 0, function* () {
        const parameters = {
            realm: NS_ACCOUNT_ID.toUpperCase(),
            consumer_key: NS_CONSUMER_KEY,
            consumer_secret: NS_CONSUMER_SECRET,
            token: NS_TOKEN_ID,
            token_secret: NS_TOKEN_SECRET,
            url: url,
            method: method
        };
        const headers = getAuthorizationHeader(parameters);
        try {
            const response = yield fetch(url, {
                method: method,
                headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
                body: JSON.stringify(data)
            });
            return {
                error: response.status < 400 ? undefined : yield response.json(),
                status: response.status,
                external_invoice_id: response.status < 400 ? response.headers.get('location') || undefined : undefined,
            };
        }
        catch (e) {
            console.log('Exception', e);
            return {
                error: `Exception Netsuite Request - ${JSON.stringify(e)}`,
                status: 500,
                external_invoice_id: undefined,
            };
        }
    });
};
const getAuthorizationHeader = function (parameters) {
    const oauth = new oauth_1_0a_1.default({
        consumer: {
            key: parameters.consumer_key,
            secret: parameters.consumer_secret,
        },
        realm: parameters.realm,
        signature_method: ALGORITHM,
        hash_function(base_string, key) {
            return crypto_1.default
                .createHmac("sha256", key)
                .update(base_string)
                .digest("base64");
        },
    });
    return oauth.toHeader(oauth.authorize({
        url: parameters.url,
        method: parameters.method,
    }, {
        key: parameters.token,
        secret: parameters.token_secret,
    }));
};
