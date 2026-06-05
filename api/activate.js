// Vercel Serverless Function — Activate StyleSnap Pro License Key
// POST /api/activate
// Body: { license_key: string, device_name: string }
// Returns: { activated: boolean, instance_id?, error?, limit_reached? }
//
// Proxies to DodoPayments public /licenses/activate endpoint (no API key needed)

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
    const deviceName = ((body || {}).device_name || 'Unknown Device').trim();

    if (!licenseKey) {
      return res.status(200).json({ activated: false, error: 'License key is required.' });
    }

    // DodoPayments public endpoint — no API key needed
    const activateRes = await fetch(`${DODO_BASE_URL}/licenses/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        license_key: licenseKey,
        name: deviceName,
      }),
    });

    const data = await activateRes.json();

    if (!activateRes.ok) {
      console.error('[Activate] Dodo error:', activateRes.status, JSON.stringify(data));
      const errMsg = data.error || data.message || 'Activation failed.';
      const isLimitReached = activateRes.status === 403 || (errMsg || '').toLowerCase().includes('limit');
      return res.status(200).json({
        activated: false,
        error: errMsg,
        limit_reached: isLimitReached,
      });
    }

    console.log(`[Activate] ✅ License activated: ${licenseKey.substring(0, 8)}... instance=${data.id}`);

    return res.status(200).json({
      activated: true,
      instance_id: data.id,
    });

  } catch (err) {
    console.error('[Activate] Error:', err.message);
    return res.status(200).json({ activated: false, error: 'Activation service unavailable.' });
  }
}
