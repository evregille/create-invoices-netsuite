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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInvoiceQuickbooks = void 0;
// QUICKBOOKS CONFIGURATION
const QBP_CLIENT_ID = process.env['QBO_CLIENT_ID'] || 'ABXfK4OUkvFHU326PEppa5YhB8If1oq0ECWeze25L05MpjdQIx';
const QBO_CLIENT_SECRET = process.env['QBO_CLIENT_SECRET'] || 'uYuj2MwECwT8BC9KySCcGn77J1OdihLtvvDg6wvd';
const QBO_BASE_URL = process.env['QBO_BASE_URL'] || 'https://sandbox-quickbooks.api.intuit.com/v3';
const QBO_REALMID = process.env['QBO_REALMID'] || '9341453458559242';
const createInvoiceQuickbooks = (invoice) => __awaiter(void 0, void 0, void 0, function* () {
    const qboInvoice = formatMetronomeInvoiceToQuickbooks(invoice);
    console.log(`invoice formatted to be sent to QBO`, JSON.stringify(qboInvoice));
    const response = yield sendQuickbooksRequest(qboInvoice);
    console.log(`invoice created in QBO with error = ${response.error} and status = ${response.status}`);
    return {
        error: response.error,
        status: response.status,
        external_invoice_id: response.data,
    };
});
exports.createInvoiceQuickbooks = createInvoiceQuickbooks;
const formatMetronomeInvoiceToQuickbooks = function (invoice) {
    return {
        "Line": invoice.line_items.map(item => {
            return {
                "DetailType": 'SalesItemLineDetail',
                "Amount": item.amount,
                "SalesItemLineDetail": {
                    "ItemRef": {
                        "name": item.name,
                        "value": item.external_item_id
                    }
                }
            };
        }),
        "CustomerRef": {
            "value": invoice.external_customer_id
        }
    };
};
const sendQuickbooksRequest = function (data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch(`${QBO_BASE_URL}/company/${QBO_REALMID}/invoice`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            return {
                error: false,
                status: response.status,
                data: response.status < 400 ? response.headers.get('location') : yield response.json()
            };
        }
        catch (e) {
            console.log('Exception', e);
            return {
                error: true,
                message: `Exception Netsuite Request - ${JSON.stringify(e)}`,
            };
        }
    });
};
