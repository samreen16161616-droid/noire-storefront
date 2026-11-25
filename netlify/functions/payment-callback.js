import { createClient } from '@supabase/supabase-js';
import { verifyPayFastStatus } from './verify-status.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function handler(event) {
    // PayFast sends POST for ITN callbacks, or GET for redirect
    const postData = event.httpMethod === 'POST' ? new URLSearchParams(event.body) : event.queryStringParameters;
    const receivedSignature = event.headers['signature'] || postData.signature;
    const { orderId, transactionRef } = postData;

    // SECURITY: Reject request immediately if parameters are missing
    if (!orderId || !transactionRef) {
        return { statusCode: 302, headers: { Location: '/order-failed.html' } };
    }

    // 1. Verify status with PayFast via secure Server-to-Server request
    const statusResult = await verifyPayFastStatus(transactionRef, postData, receivedSignature);

    // 2. Log response
    await supabase.from('payment_logs').insert({
        order_id: orderId,
        gateway_response: { ...statusResult, transactionRef }
    });

    // 3. Finalize order if verified
    if (statusResult.status === 'SUCCESS' && statusResult.amount) {
        const { error } = await supabase.rpc('finalize_order_payment', {
            p_order_id: orderId,
            p_transaction_ref: transactionRef,
            p_verified_amount: statusResult.amount
        });

        if (error) {
            console.error('Finalization error:', error.message);
            return { statusCode: 302, headers: { Location: '/order-failed.html' } };
        }
        return { statusCode: 302, headers: { Location: '/order-confirmation.html' } };
    }

    console.warn(`Payment verification failed or not configured for order ${orderId}, status: ${statusResult.status}`);
    return { statusCode: 302, headers: { Location: '/order-pending.html' } };
}
