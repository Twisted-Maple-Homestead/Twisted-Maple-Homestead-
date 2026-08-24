# Homestead Helper v6 — Stripe Billing Setup

This build replaces the premium CTA with a live Stripe Checkout path when Supabase + Stripe are configured.

## Stripe objects to create

Create two recurring prices in Stripe:

- Monthly: `$4.99/month`
- Annual: `$39.99/year`

The Edge Function adds a 14-day subscription trial.

## Supabase secrets

Set:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_or_test_key
supabase secrets set STRIPE_PRICE_MONTHLY=price_xxx
supabase secrets set STRIPE_PRICE_ANNUAL=price_xxx
supabase secrets set APP_URL=https://your-app-domain.example
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
```

Supabase automatically provides `SUPABASE_URL` and you should provide the service-role secret to the webhook environment if it is not already available:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Deploy functions

```bash
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy create-billing-portal
```

## Stripe webhook endpoint

Configure Stripe to send subscription events to:

```text
https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
```

Subscribe at minimum to:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Subscription state

The webhook writes to the `subscriptions` table.

The app treats statuses `active` and `trialing` as Plus access.

## Important mobile-store note

This Stripe path is appropriate for the web/PWA version.

If Homestead Helper later ships as a native iOS/Android app and sells digital subscriptions inside the app, implement the applicable App Store / Google Play billing flow (often through RevenueCat or direct store SDKs) instead of routing native in-app purchases through Stripe.
