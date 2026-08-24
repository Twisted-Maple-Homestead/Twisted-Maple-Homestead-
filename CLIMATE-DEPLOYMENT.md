# Climate Lookup Deployment

This version adds a real server-side climate lookup layer.

## What it can do

1. ZIP code -> city/state + latitude/longitude using Zippopotam.us.
2. Latitude/longitude -> nearby NOAA station using NOAA Climate Data Online Web Services v2.
3. NOAA station -> attempt to read 1991-2020 Annual/Seasonal Climate Normals.
4. USDA hardiness zone -> optional lookup through API Verve if you configure a key.
5. Save the resolved location to `user_location_settings`.
6. Use the existing `location-engine.js` to turn freeze-date anchors + crop offsets into planting dates.

## Why there is a server-side function

NOAA CDO requires an API token. That token should not be shipped in browser JavaScript.

## Set up NOAA

Request a NOAA CDO token, then set the Supabase Edge Function secret:

```bash
supabase secrets set NOAA_CDO_TOKEN=YOUR_TOKEN
```

## Optional automatic USDA zone lookup

The official USDA 2023 Plant Hardiness Zone Map supports ZIP search on its website, but a public production API is not documented on the official site.

This build therefore supports an optional third-party API only if you choose to use one:

```bash
supabase secrets set HARDINESS_API_KEY=YOUR_API_VERVE_KEY
```

If no key is configured, the app deliberately says the USDA zone needs confirmation instead of inventing one.

## Deploy the function

```bash
supabase functions deploy climate-lookup
```

The URL will look like:

```text
https://YOUR_PROJECT_REF.supabase.co/functions/v1/climate-lookup
```

Put that URL in `config.js`:

```js
window.HH_CONFIG = {
  SUPABASE_URL: "https://YOUR_PROJECT_REF.supabase.co",
  SUPABASE_ANON_KEY: "YOUR_ANON_KEY",
  CLIMATE_LOOKUP_URL: "https://YOUR_PROJECT_REF.supabase.co/functions/v1/climate-lookup"
};
```

## Important production note about NOAA freeze normals

NOAA's current 1991-2020 Annual/Seasonal Climate Normals include agricultural freeze-date probabilities. The exact CSV field layout may vary by access method.

This function is intentionally fail-safe: if it cannot confidently parse 32°F spring/fall freeze dates, it returns `needsManualFreezeDates: true`. The app then asks for confirmation rather than using made-up dates.

Before launch, test the parser against a broad national sample of stations and pin the exact NOAA field names used by the deployed endpoint.

## Official references used for architecture

- USDA 2023 Plant Hardiness Zone Map: https://planthardiness.ars.usda.gov/
- NOAA/NCEI U.S. Climate Normals: https://www.ncei.noaa.gov/products/land-based-station/us-climate-normals
- NOAA CDO Web Services v2: https://www.ncei.noaa.gov/cdo-web/webservices/v2
