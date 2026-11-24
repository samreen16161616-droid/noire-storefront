import { createClient } from '@supabase/supabase-js';
import { verifyPayFastStatus } from './verify-status.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function handler(event) {
    const { orderId, transactionRef } = event.queryStringParameters;

    // SECURITY: Reject request immediately if parameters are missing
    if (!orderId || !transactionRef) {
        return { statusCode: 302, headers: { Location: '/order-failed.html' } };
    }

    // 1. Verify status with PayFast via secure Server-to-Server request
    const statusResult = await verifyPayFastStatus(transactionRef);

    // SECURITY: Only proceed if status is explicitly verified as SUCCESS by the gateway
    if (statusResult.status === 'SUCCESS' && statusResult.amount) {
        // 2. Finalize order (atomic stock/status update using gateway-verified amount)
        const { error } = await supabase.rpc('finalize_order_payment', {
            p_order_id: orderId,
            p_transaction_ref: transactionRef,
            p_amount: statusResult.amount
        });

        if (error) {
            console.error('Finalization error:', error.message);
            return { statusCode: 302, headers: { Location: '/order-failed.html' } };
        }
        return { statusCode: 302, headers: { Location: '/order-confirmation.html' } };
    }

    // SECURITY: Fail closed. Any unconfigured, pending, or failed gateway state preserves pending order status.
    console.warn(`Payment verification failed or not configured for order ${orderId}, status: ${statusResult.status}`);
    return { statusCode: 302, headers: { Location: '/order-pending.html' } };
}
