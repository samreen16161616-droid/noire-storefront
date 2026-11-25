import crypto from 'crypto';

export async function verifyPayFastStatus(transactionRef, postData, receivedSignature) {
    const PAYFAST_API_URL = process.env.PAYFAST_API_URL;
    const MERCHANT_ID = process.env.MERCHANT_ID;
    const SECURED_KEY = process.env.SECURED_KEY;

    if (!PAYFAST_API_URL || !MERCHANT_ID || !SECURED_KEY) {
        console.error('PayFast integration not configured');
        return { status: 'NOT_CONFIGURED' };
    }

    // 1. HMAC Signature Verification (HMAC-SHA512)
    const sortedData = Object.keys(postData)
        .sort()
        .filter(key => key !== 'signature')
        .map(key => `${key}=${encodeURIComponent(postData[key]).replace(/%20/g, '+')}`)
        .join('&');

    const signature = crypto.createHmac('sha512', SECURED_KEY).update(sortedData).digest('hex');

    if (signature !== receivedSignature) {
        console.error('Invalid PayFast signature');
        return { status: 'INVALID_SIGNATURE' };
    }

    // 2. Server-to-Server Query Verification
    // Using PayFast Query API to validate transaction status
    try {
        const response = await fetch(`${PAYFAST_API_URL}/eng/query/validate`, {
            method: 'POST',
            body: new URLSearchParams({
                merchant_id: MERCHANT_ID,
                pf_payment_id: transactionRef
            })
        });

        const result = await response.json();
        if (result.status === 'success' && result.response && result.response.payment_status === 'COMPLETE') {
            return {
                status: 'SUCCESS',
                amount: parseFloat(result.response.amount_gross)
            };
        }
        return { status: 'FAILED' };
    } catch (error) {
        console.error('PayFast Query API error:', error);
        return { status: 'ERROR' };
    }
}
