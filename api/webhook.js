// Vercel Serverless Function — Dodo Payments Webhook for StyleSnap
// POST /api/webhook
// Receives payment events from Dodo Payments.
//
// For one-time payments, we care about:
// - payment.succeeded → user paid $29, we can log it
// - payment.failed → payment failed

const DODO_WEBHOOK_SECRET = process.env.DODO_WEBHOOK_SECRET || '';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    const eventType = body.type || body.event_type || '';
    const payload = body.data || body.payload || body;

    console.log('[Webhook] Event:', eventType, 'Payload keys:', Object.keys(payload));

    if (eventType === 'payment.succeeded') {
      const email = payload.customer?.email || payload.billing_address?.email || '';
      const paymentId = payload.id || payload.payment_id || '';
      console.log(`[Webhook] ✅ Payment succeeded: ${email} (${paymentId})`);
    }

    if (eventType === 'payment.failed') {
      const email = payload.customer?.email || '';
      const paymentId = payload.id || '';
      console.log(`[Webhook] ❌ Payment failed: ${email} (${paymentId})`);
    }

    // Always return 200 quickly
    return res.status(200).json({ received: true });

  } catch (err) {
    console.error('[Webhook] Error:', err.message);
    return res.status(200).json({ received: true });
  }
}
