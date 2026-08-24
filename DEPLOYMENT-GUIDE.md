# Homestead Helper — Deployment Guide

This package is ready for a first real test deployment.

## Recommended first deployment path

Use:

- **Supabase** for authentication, database, and Edge Functions
- **Vercel / Netlify / Cloudflare Pages** for the static web/PWA frontend
- **Stripe test mode** for web subscription testing
- **NOAA CDO token** for climate-station lookup

Do not add more core features until this deployment has been smoke-tested.

---

## 1. Create the Supabase project

Create a new project in Supabase.

Copy:

- Project URL
- anon/public key
- service-role key

Keep the service-role key private.

### Run database migrations

Using the Supabase CLI from the project folder:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Then seed the crop database:

```bash
supabase db seed
```

If you prefer the SQL editor, run the files in:

```text
supabase/migrations/
```

in numeric order, then run:

```text
supabase/seed.sql
```

---

## 2. Configure authentication

In Supabase Auth settings:

- enable Email authentication
- add your production URL to Site URL
- add your production URL to Redirect URLs
- keep localhost for development

Example:

```text
https://homestead-helper.example.com
```

---

## 3. Configure the browser app

Copy:

```text
config.production.example.js
```

to:

```text
config.js
```

Then enter:

```js
window.HH_CONFIG = {
  SUPABASE_URL: "https://YOUR_PROJECT_REF.supabase.co",
  SUPABASE_ANON_KEY: "YOUR_ANON_KEY",
  CLIMATE_LOOKUP_URL: "https://YOUR_PROJECT_REF.supabase.co/functions/v1/climate-lookup"
};
```

The anon key is designed for client-side use with Row Level Security enabled.

Never put the service-role key in `config.js`.

---

## 4. Configure NOAA climate lookup

Request a NOAA CDO token.

Then:

```bash
supabase secrets set NOAA_CDO_TOKEN=YOUR_TOKEN
```

Optional hardiness-zone provider:

```bash
supabase secrets set HARDINESS_API_KEY=YOUR_KEY
```

If no automatic hardiness lookup is configured, the app correctly asks for confirmation rather than inventing a zone.

---

## 5. Configure Stripe test mode

Create:

- Monthly recurring price: `$4.99`
- Annual recurring price: `$39.99`

Set secrets:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx
supabase secrets set STRIPE_PRICE_MONTHLY=price_xxx
supabase secrets set STRIPE_PRICE_ANNUAL=price_xxx
supabase secrets set APP_URL=https://YOUR_APP_DOMAIN
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

Deploy functions:

```bash
./scripts/deploy-functions.sh
```

Create the Stripe webhook:

```text
https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
```

Subscribe to:

- checkout.session.completed
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted

Then save the webhook secret:

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

## 6. Deploy the web app

### Vercel

Import this folder as a project.

Settings:

- Framework preset: Other
- Build command: blank
- Output directory: `.`
- Root directory: the app folder

The included `vercel.json` handles basic static behavior.

### Netlify

Create a new site from this folder.

Settings:

- Build command: blank
- Publish directory: `.`

The included `netlify.toml` handles SPA fallback and service-worker caching.

### Cloudflare Pages

Create a Pages project.

Settings:

- Framework preset: None
- Build command: blank
- Build output directory: `.`

---

## 7. Production auth URLs

After the real hosting URL exists, update Supabase Auth:

- Site URL
- Redirect URLs

Then update:

```bash
supabase secrets set APP_URL=https://YOUR_REAL_DOMAIN
```

Redeploy billing functions if needed.

---

## 8. First beta test

Use two completely separate test accounts.

### Account A

Test:

1. Create account
2. Set ZIP
3. Add garden bed
4. Add planting
5. Add bed history
6. Record harvest
7. Add livestock
8. Record animal loss
9. Add health record
10. Add care reminder
11. Add breeding record
12. Record birth/hatch
13. Record sap
14. Add syrup batch
15. Add stored food
16. Complete a task
17. Start Stripe test subscription

Refresh between steps and confirm the records persist.

### Account B

Sign in separately and verify that Account A's private data is invisible.

That is a critical Row Level Security test.

---

## 9. Do not launch publicly until

- RLS isolation passes
- account signup/login/logout works consistently
- password-reset flow is added/tested
- destructive deletes have confirmation
- Stripe test subscription lifecycle passes
- Stripe cancellation updates Plus access
- climate lookup is tested across multiple regions
- freeze-date parsing is validated
- privacy policy exists
- terms exist
- support email exists
- analytics/error monitoring is configured
- mobile usability is tested
- accessibility basics are checked

---

## 10. Native app later

The current product is a web/PWA beta.

If you later package Homestead Helper as a native iOS/Android app, review the current Apple and Google requirements for digital subscriptions at that time. The web Stripe implementation should not simply be copied into native in-app subscription flows.
