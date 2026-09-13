# Homestead Helper — Live Module QA Checklist

Use this after the production Supabase migrations/seed are installed and `config.js` is connected.

## Garden

- Sign in as User A.
- Add a bed.
- Add a planting.
- Confirm the planting stores the crop-reference ID, not the display name.
- Add bed history and confirm `crop_id` and `plant_family` persist.
- Record a harvest.
- Edit a planting quantity/status.
- Delete a planting.
- Refresh and verify all records reload from Supabase.
- Sign in as User B and verify User A's rows are not visible.

## Animals

- Add an animal group.
- Record an animal loss and verify current count decreases.
- Attempt a loss greater than the current count and verify it is blocked.
- Add a health record.
- Add a preventive-care reminder with a due date.
- Verify a corresponding task appears on Home.
- Add a breeding record with an expected due/hatch date.
- Verify a corresponding task appears on Home.
- Record a birth/hatch event.
- Verify the breeding record becomes Completed.
- Verify surviving offspring are added to the linked animal group.
- Attempt to record a second outcome for the same breeding record and verify it is blocked.
- Delete health, care, and breeding records and verify persistence after refresh.

## Tree tapping

- Record sap.
- Add a syrup batch.
- Verify invalid or negative batch values are blocked.
- Verify the sap:syrup ratio displays on the Homestead tab.
- Delete a syrup batch and refresh to verify deletion persists.
- Refresh and verify batches reload from Supabase.

## Tasks

- Care reminders and breeding dates should create tasks.
- Mark a Supabase-backed task Done.
- Refresh and verify it remains Done.

## Validation

- Try blank required fields in core forms.
- Try zero or negative harvest and sap quantities.
- Try invalid animal counts and bed dimensions.
- Verify validation messages appear before data is saved.

## PWA / mobile

- Install or open the PWA on iPhone.
- Confirm the newest service worker replaces stale caches.
- Verify `offspring-fix.js` and `input-validation.js` are active after refresh.
- Test core screens while offline after they have been cached.
- Reconnect and confirm normal operation resumes.

## Legal / data

- Open Privacy and Terms pages from the app.
- Export app data and confirm the JSON file contains the expected records.
- Verify the final account data removal process once it is implemented.

## Remaining production follow-up items

- Production Supabase project, migrations, seed, and two-user RLS verification.
- Production climate/NOAA configuration and failure testing.
- End-to-end Plus billing and subscription synchronization testing.
- Final account data removal process.
- Full mobile, offline, slow-network, and error-state regression pass.
