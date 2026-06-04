# StyleSnap Proxy — DodoPayments Vercel Serverless

Vercel serverless API proxy for StyleSnap Pro checkout and purchase verification.

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/checkout` | `{ email?: string }` | Create checkout session → `{ checkout_url, session_id }` |
| `POST /api/verify` | `{ email: string }` | Verify purchase by email → `{ valid: boolean, ... }` |
| `POST /api/webhook` | Dodo event payload | Receive payment webhooks |

## Environment Variables

Set these in Vercel dashboard (Settings → Environment Variables):

| Variable | Value | Notes |
|----------|-------|-------|
| `DODO_API_KEY` | `FpqFn-UIKyng7u87...` | Your Dodo Payments API key |
| `DODO_ENV` | `test` or `live` | Switch between test/live |
| `DODO_PRODUCT_ID` | `pdt_0NgJpLrjYb5WyvHwo2Z5X` | Test: created ✅. Live: create in Dodo dashboard |
| `DODO_WEBHOOK_SECRET` | (from Dodo dashboard) | Optional, for webhook verification |

## Deploy to Vercel

### Option 1: Vercel CLI
```bash
npx vercel --prod
```
Set environment variables when prompted, or add in dashboard afterward.

### Option 2: GitHub Auto-deploy
1. Push to GitHub ✅ (already done)
2. Go to https://vercel.com/new
3. Import `fanyi840317-cpu/stylesnap-proxy`
4. Add environment variables in the UI
5. Click Deploy

After deployment, the proxy URL will be `https://stylesnap-proxy.vercel.app`.

## Test Locally

```bash
# Install Vercel CLI
npm i -g vercel

# Copy env file
cp .env.example .env

# Run locally
vercel dev
```

## Tested ✅

DodoPayments API verified working:
- Product ID: `pdt_0NgJpLrjYb5WyvHwo2Z5X` (StyleSnap Pro, $29 one-time)
- Checkout URL generation: `https://test.checkout.dodopayments.com/session/...`
- Full payment method support: credit, debit, Apple Pay, Google Pay, PayPal, Alipay, WeChat Pay
