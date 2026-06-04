// Vercel Serverless Function — Verify StyleSnap Pro Purchase by Email
// POST /api/verify
// Body: { email: string }
// Returns: { valid: boolean, customer_id?, payment_id?, error? }
//
// For one-time purchases, we find the customer by email and check their payments.

const DODO_API_KEY = process.env.DODO_API_KEY || '';
const DODO_BASE_URL = process.env.DODO_ENV === 'live'
  ? 'https://live.dodopayments.com'
  : 'https://test.dodopayments.com';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    const email = ((body || {}).email || '').trim().toLowerCase();

    if (!email) {
      return res.status(200).json({ valid: false, error: 'Email is required.' });
    }

    // Step 1: Find customer by email
    const customerRes = await fetch(
      `${DODO_BASE_URL}/customers?email=${encodeURIComponent(email)}&page_size=5`,
      {
        headers: {
          'Authorization': `Bearer ${DODO_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!customerRes.ok) {
      const errText = await customerRes.text();
      console.error('[Verify] Customer lookup error:', customerRes.status, errText);
      return res.status(200).json({ valid: false, error: 'Failed to verify purchase.' });
    }

    const customerData = await customerRes.json();
    const customers = customerData.items || [];

    if (customers.length === 0) {
      return res.status(200).json({ valid: false, error: 'No purchase found for this email.' });
    }

    // Step 2: Check payments for each matched customer
    for (const customer of customers) {
      const paymentRes = await fetch(
        `${DODO_BASE_URL}/payments?customer_id=${encodeURIComponent(customer.customer_id)}&status=succeeded&page_size=10`,
        {
          headers: {
            'Authorization': `Bearer ${DODO_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!paymentRes.ok) {
        console.error('[Verify] Payment lookup error:', paymentRes.status);
        continue;
      }

      const paymentData = await paymentRes.json();
      const payments = paymentData.items || [];

      if (payments.length > 0) {
        const payment = payments[0];
        console.log(`[Verify] ✅ Purchase found: ${email} -> ${payment.payment_id}`);
        return res.status(200).json({
          valid: true,
          customer_id: customer.customer_id,
          payment_id: payment.payment_id,
          amount: payment.amount,
          currency: payment.currency,
        });
      }
    }

    return res.status(200).json({
      valid: false,
      error: 'No completed purchase found for this email.',
    });

  } catch (err) {
    console.error('[Verify] Error:', err.message);
    return res.status(200).json({ valid: false, error: 'Verification service unavailable.' });
  }
}
