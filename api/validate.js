// Vercel Serverless Function — Validate StyleSnap Pro License Key
// POST /api/validate
// Body: { license_key: string }
// Returns: { valid: boolean, activations_used?, activations_limit?, expires_at?, error? }
//
// Proxies to DodoPayments public /licenses/validate endpoint (no API key needed)

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

    const licenseKey = ((body || {}).license_key || '').trim();

    if (!licenseKey) {
      return res.status(200).json({ valid: false, error: 'License key is required.' });
    }

    // DodoPayments public endpoint — no API key needed
    const validateRes = await fetch(`${DODO_BASE_URL}/licenses/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ license_key: licenseKey }),
    });

    const data = await validateRes.json();

    if (!validateRes.ok) {
      console.error('[Validate] Dodo error:', validateRes.status, JSON.stringify(data));
      return res.status(200).json({
        valid: false,
        error: data.error || data.message || 'Validation failed.',
      });
    }

    return res.status(200).json({
      valid: data.valid === true,
      status: data.status,
      activations_used: data.activations_used,
      activations_limit: data.activations_limit,
      expires_at: data.expires_at || null,
    });

  } catch (err) {
    console.error('[Validate] Error:', err.message);
    return res.status(200).json({ valid: false, error: 'Validation service unavailable.' });
  }
}
