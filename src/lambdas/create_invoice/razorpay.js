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
exports.createInvoiceRazorpay = void 0;
const razorpay_1 = __importDefault(require("razorpay"));
// QUICKBOOKS CONFIGURATION
const RAZORPAY_API_KEY_ID = process.env['RAZORPAY_API_KEY_ID'] || '';
const RAZORPAY_API_KEY_SECRET = process.env['RAZORPAY_API_KEY_SECRET'] || '';
const createInvoiceRazorpay = (invoice) => __awaiter(void 0, void 0, void 0, function* () {
    const razorpayInvoice = formatMetronomeInvoiceToRazopayInvoice(invoice);
    console.log(`invoice formatted to be sent to Razorpay`, JSON.stringify(razorpayInvoice));
    const response = yield sendRazorpayRequest(razorpayInvoice);
    console.log(`invoice created in Razorpay with error = ${response.error} and status = ${response.status}`);
    return response;
});
exports.createInvoiceRazorpay = createInvoiceRazorpay;
const formatMetronomeInvoiceToRazopayInvoice = function (invoice) {
    return {
        "type": "invoice",
        "date": invoice.start_date,
        "customer_id": invoice.external_customer_id,
        "line_items": invoice.line_items.map(item => {
            return {
                "name": item.name,
                "amount": item.amount,
                "quantity": item.quantity,
            };
        })
    };
};
const sendRazorpayRequest = function (data) {
    return __awaiter(this, void 0, void 0, function* () {
        if (RAZORPAY_API_KEY_ID.length > 0 && RAZORPAY_API_KEY_SECRET.length > 0) {
            const razoprpay_instance = new razorpay_1.default({ key_id: RAZORPAY_API_KEY_ID, key_secret: RAZORPAY_API_KEY_SECRET });
            try {
                const result = yield razoprpay_instance.invoices.create(data);
                if (result.error)
                    return {
                        error: `${result.error.code} - ${result.error.description}`,
                        status: 400,
                        external_invoice_id: undefined,
                    };
                return {
                    error: undefined,
                    status: 200,
                    external_invoice_id: result.id
                };
            }
            catch (e) {
                console.log('Exception', e);
                return {
                    error: `Exception Razorpay Invoice create request - ${JSON.stringify(e)}`,
                    status: 500,
                    external_invoice_id: undefined,
                };
            }
        }
        else
            return {
                error: `Exception Razorpay service not configured properly`,
                status: 500,
                external_invoice_id: undefined,
            };
    });
};
