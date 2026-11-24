import { createClient } from '@supabase/supabase-js';

// Netlify environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PAYFAST_API_URL = process.env.PAYFAST_API_URL;
const MERCHANT_ID = process.env.MERCHANT_ID;
const SECURED_KEY = process.env.SECURED_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function handler(event) {
    if (event.httpMethod !== 'POST') return { statusCode: 405 };

    const { cartItems, customerName, customerEmail, shippingAddress } = JSON.parse(event.body);

    // 1. Calculate price and validate stock server-side
    let total = 0;
    const validatedItems = [];

    for (const item of cartItems) {
        const { data: product } = await supabase
            .from('products')
            .select('price, stock_quantity')
            .eq('id', item.productId)
            .single();

        if (!product || product.stock_quantity < item.quantity) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Stock insufficient' }) };
        }
        total += product.price * item.quantity;
        validatedItems.push({ ...item, price: product.price });
    }

    // 2. Create pending order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            customer_name: customerName,
            customer_email: customerEmail,
            shipping_address: shippingAddress,
            total_amount: total,
            status: 'pending'
        })
        .select('id')
        .single();

    if (orderError) return { statusCode: 500, body: JSON.stringify({ error: 'Order creation failed' }) };

    // 3. Initiate PayFast session (using placeholders for actual API call)
    // const paymentSession = await fetch(`${PAYFAST_API_URL}/initiate`, ...);

    return {
        statusCode: 200,
        body: JSON.stringify({ orderId: order.id, paymentUrl: 'PLACEHOLDER_PAYFAST_URL' })
    };
}
