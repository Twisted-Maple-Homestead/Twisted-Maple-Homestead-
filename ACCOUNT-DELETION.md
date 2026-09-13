# Homestead Helper — Account Deletion

The app includes an **Account & data** section on the My tab.

## Current behavior
- Users can export their data first.
- Local demo data can be cleared from the device.
- Cloud deletion stays disabled unless the production backend has been deployed and tested.
- Deletion requires typing `DELETE` and a second confirmation.
- Production configuration defaults `ACCOUNT_DELETION_ENABLED` to `false`.

## Secure backend now included in the repository
The repository contains a Supabase Edge Function at:

`supabase/functions/delete-account/index.ts`

The function:
- only accepts authenticated requests;
- resolves the signed-in user from the bearer token;
- uses the Supabase service-role key only inside the Edge Function environment;
- deletes only the authenticated user's auth record;
- relies on foreign-key `on delete cascade` rules for user-owned data where configured;
- never exposes the service-role key to browser code.

## Production rollout checklist
Before cloud deletion is enabled:
1. Create/configure the production Supabase project.
2. Apply and verify the complete production schema and migrations.
3. Confirm every user-owned table is either linked to `auth.users(id) on delete cascade` or is explicitly cleaned up by the production deletion path.
4. Deploy the `delete-account` Edge Function.
5. Confirm `SUPABASE_SERVICE_ROLE_KEY` is available only to the Edge Function environment.
6. Test with two disposable users and verify deleting User A does not change User B's records.
7. Verify the deleted user can no longer sign in.
8. Verify subscription/billing cleanup behavior before paid accounts are allowed to use deletion.
9. Only after all checks pass, set `ACCOUNT_DELETION_ENABLED: true` in the production frontend configuration.

## Important status
The secure backend code is prepared, but **cloud-account deletion must remain disabled until it is deployed and tested against the final production database**. The current frontend intentionally enforces that safety gate.
