
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";

const sqsClient = new SQSClient({});
const SQS_INVOICES_QUEUE_URL = process.env['SQS_INVOICES_QUEUE_URL'] || '';

type WebhookEvent = {
    type: string,
    properties: {
        customer_id: string,
        invoice_id: string,
    }
}

type Response = {
    error?: boolean,
    message?: string,
}

// put the invoice finalized webhook on a queue
export const handler = async function (event: any): Promise<void> {
    try{
        const webhook_event:WebhookEvent = JSON.parse(event.body);
        if(webhook_event && webhook_event.type && webhook_event.type === 'invoice.finalized'){
            console.log(`event invoice finalized received for customer ${webhook_event.properties.customer_id} and invoice ${webhook_event.properties.invoice_id}`)
            const sendMessageResponse: Response = await sendMessageToQueue(webhook_event, SQS_INVOICES_QUEUE_URL);
            if(sendMessageResponse.error) {
                await logError(sendMessageResponse)
                return;
            }
            console.log(`event successfully sent to queue.`)
        }
    } catch(e){
        await logError({
            error: true,
            message: `Exception handling the webhook event: ${JSON.stringify(e)} - ${event}`
        })
    }
}

const sendMessageToQueue = async function(message: WebhookEvent, queueUrl: string): Promise<Response> {
    try {
        const response = await sqsClient.send(new SendMessageCommand({
            QueueUrl: queueUrl,
            MessageBody: JSON.stringify(message),
        }));
        if(response && response["$metadata"] && response["$metadata"].httpStatusCode && response["$metadata"].httpStatusCode < 399)
            return {error: false}
        else return {error: true, message: `Log failed to publish to SQS ${response}`}
    } catch (e) {
        return { error: true, message: `Exception in sending message to queue ${JSON.stringify(e)}`}
    }
}

const logError = async function(log: any): Promise<void>{
    console.log(`ERROR`, log)
}