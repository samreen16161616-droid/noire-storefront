import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function handler(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const { cartItems, customerName, customerEmail, customerPhone, shippingAddress } = JSON.parse(event.body || '{}');

        if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Cart is empty or invalid' }) };
        }

        if (!customerName || !customerEmail || !shippingAddress) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing required customer details' }) };
        }

        // Try calling the database RPC function for atomic order creation
        const { data: orderId, error: rpcError } = await supabase.rpc('create_secure_order', {
            p_customer_name: customerName,
            p_customer_email: customerEmail,
            p_customer_phone: customerPhone || '',
            p_shipping_address: shippingAddress,
            p_items: cartItems.map(item => ({
                product_id: item.productId,
                quantity: item.quantity,
                size: item.size || '100ml'
            }))
        });

        if (!rpcError && orderId) {
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ success: true, orderId, message: 'Demonstration order created successfully' })
            };
        }

        // Fallback to direct insertion if RPC is not deployed
        let total = 0;
        for (const item of cartItems) {
            const { data: product } = await supabase
                .from('products')
                .select('price, stock_quantity')
                .eq('id', item.productId)
                .single();

            if (!product) {
                return { statusCode: 400, body: JSON.stringify({ error: `Product ${item.productId} not found` }) };
            }
            total += product.price * item.quantity;
        }

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone || '',
                shipping_address: shippingAddress,
                total_amount: total,
                status: 'pending'
            })
            .select('id')
            .single();

        if (orderError) {
            console.error('Order creation error:', orderError.message);
            return { statusCode: 500, body: JSON.stringify({ error: 'Failed to record demonstration order' }) };
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: true, orderId: order.id, message: 'Demonstration order created successfully' })
        };
    } catch (err) {
        console.error('Checkout error:', err);
        return { statusCode: 500, body: JSON.stringify({ error: 'Server error processing checkout request' }) };
    }
}
