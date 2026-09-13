# Homestead Helper — Supabase Backend Setup

The repository now contains the database pieces needed by the current Homestead Helper web app.

## Apply in this order

1. Run `supabase-schema.sql` in the Supabase SQL Editor. This creates the original core tables, crop reference tables, user location settings, and their RLS policies.
2. Run `crop-seed.sql` to load the starter crop reference data.
3. Run `supabase/migrations/0001_app_production_tables.sql`. This creates the additional tables currently used by the live app: plantings, bed history, animal health, preventive care, breeding, offspring events, syrup batches, tasks, and subscriptions.
4. Run `supabase/rls-verification.sql` and review every result before enabling production accounts.
5. Perform the manual two-user isolation test described at the bottom of `supabase/rls-verification.sql`.

## Current browser mappings

The current app reads or writes these Supabase-backed modules:

- garden beds and harvests
- plantings and bed history
- animal groups and losses
- animal health records and preventive care
- breeding records and offspring events
- trees, sap collections, and syrup batches
- pantry/freezer records and food goals
- tasks and reminders
- subscription entitlement state

## Security model

User-owned tables use Row Level Security. Their policies restrict reads and writes to rows whose `user_id` matches `auth.uid()`; `profiles` uses its `id` column instead. The new production migration also adds indexes for common user/group/date lookups and a unique guard that allows only one offspring event per breeding record for a user.

The account-deletion Edge Function is present in `supabase/functions/delete-account/index.ts`, but cloud deletion must remain disabled until the production project, cascade behavior, and two-user isolation test have all been verified.

## Production verification required

Do not mark Supabase production-ready until all of these are complete:

- production Supabase project created;
- schema, crop seed, and production migration applied successfully;
- email/password authentication tested;
- RLS verification query shows RLS enabled on every user-owned table;
- User A cannot read, edit, or delete User B data, and vice versa;
- account deletion removes only the authenticated user's account and dependent rows;
- the deployed web app is configured with the production project URL and anon key;
- no service-role key appears in frontend files or browser-visible configuration.

## Safety boundaries

The database may store animal observations, veterinarian-provided treatment records, withdrawal/restriction dates, suspected versus confirmed causes of animal loss, preservation planning records, and harvest estimates. The app should not diagnose animal disease, invent medication dosing, invent shelf-stable canning instructions, or present yield, frost, or tapping estimates as guarantees.
