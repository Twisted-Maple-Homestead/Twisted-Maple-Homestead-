# Homestead Helper — Working MVP Starter

This folder is the first runnable implementation of the Homestead Helper app specification.

## What already works

- Email/password authentication UI
  - Local demo mode works immediately.
  - Supabase mode activates when `config.js` contains your project URL + anon key.
- Six-tab navigation:
  - Home
  - Garden
  - Animals
  - Homestead
  - Insights
  - My Homestead
- Local persistence with `localStorage`
- Year-Round Harvest Planner calculator
- Garden beds and crop list
- Harvest logging
- Livestock group tracking
- Animal loss logging that reduces current group count
- Tree tapping / sap collection
- Pantry + freezer inventory
- Premium preview with 14-day demo trial
- JSON data export
- Installable PWA shell (manifest + service worker)

## Run it

The easiest local option:

```bash
python3 -m http.server 8000
```

Then open:

`http://localhost:8000`

You can also deploy the folder to Netlify, Vercel static hosting, GitHub Pages, Cloudflare Pages, or another static host.

## Turn on Supabase

1. Create a Supabase project.
2. Open the SQL editor.
3. Review and run `supabase-schema.sql`.
4. Copy `config.js.example` to `config.js` if needed.
5. Add your project URL and anon key:

```js
window.HH_CONFIG = {
  SUPABASE_URL: "https://YOUR-PROJECT.supabase.co",
  SUPABASE_ANON_KEY: "YOUR-ANON-KEY"
};
```

The starter currently uses Supabase for authentication when configured. The next development pass should replace the localStorage CRUD functions with Supabase CRUD calls for each entity.

## Production work still required

This is a working MVP starter, not a finished App Store build. Before launch, the next engineering steps are:

- Replace local demo data persistence with Supabase row-level CRUD
- Import the full crop database from the v13 workbook
- Add ZIP/NOAA/USDA planting-date service integration
- Add notification infrastructure
- Add breeding/health/treatment UI
- Add proper subscription billing (App Store / Play + RevenueCat or equivalent)
- Add legal/privacy pages
- Add analytics/error monitoring
- Test accessibility and mobile layouts
- Package as native iOS/Android or deploy as a PWA first

## Safety choices built into the UX

- Animal-loss cause can be recorded as suspected; the app does not diagnose disease.
- Preservation premium examples are planning-oriented; production should link only to tested canning/food-safety guidance.
- Harvest and planting quantities are estimates, not guarantees.
- Tree tapping recommendations must be validated against regional extension guidance before public release.


## This pass adds

- Supabase-aware CRUD helpers for:
  - garden beds
  - harvests
  - livestock groups
  - animal losses
  - sap collections
  - stored food
- Cloud hydration after Supabase login
- Starter `crop_reference` and `crop_timing_rules` database tables
- `crop-seed.sql` with the first 10 crops
- `user_location_settings` table
- `location-engine.js` for converting frost-date anchors + crop offsets into planting windows

## Supabase setup order

Run:

1. `supabase-schema.sql`
2. `crop-seed.sql`

Then fill in `config.js`.

The application still falls back to local demo storage if Supabase is not configured, which makes development/testing easier.

## Remaining location work

The calculation engine is now in place, but the production app still needs an external ZIP/climate lookup service that supplies:
- latitude/longitude
- USDA hardiness zone
- nearby representative NOAA station
- spring/fall freeze-normal dates

Once those anchors are stored in `user_location_settings`, `location-engine.js` can calculate the crop windows.


## v3 climate integration

This build adds:
- `climate-service.js`
- a Supabase Edge Function at `supabase/functions/climate-lookup/index.ts`
- ZIP centroid lookup
- NOAA token-protected nearby-station discovery
- NOAA 1991-2020 climate-normal integration path
- optional automatic hardiness-zone provider
- My Homestead -> Set Location UI
- fail-safe handling when freeze normals or zone cannot be confidently resolved

See `CLIMATE-DEPLOYMENT.md`.


## v4 backend package

See `BACKEND-SETUP.md`. This release adds the complete migration set and the full 46-crop starter seed data.


## v5 live modules

This release connects working UI flows to the v4 backend for:
- plantings
- bed history
- animal health records
- preventive-care reminders
- breeding records
- birth/hatch outcomes
- syrup batches
- task creation from care and breeding dates

See `LIVE-MODULE-QA.md` for the smoke-test checklist.


## v6 production pass

This release closes the previously listed production gaps:

- exact `crop_reference.id` values are used in planting and bed-history writes
- task completion persists to Supabase
- edit/delete actions are exposed for live modules
- Stripe Checkout + 14-day trial Edge Function
- Stripe webhook -> Supabase subscription entitlement sync
- billing portal Edge Function foundation

See `BILLING-SETUP.md`.


## v7 deployment-ready package

This release adds:
- `.env.example`
- production config template
- Supabase CLI config
- Vercel config
- Netlify config
- Cloudflare Pages notes
- deployment scripts
- full deployment guide
- beta checklist
- go-live checklist
- deployment status template

Start with `DEPLOYMENT-GUIDE.md`.
