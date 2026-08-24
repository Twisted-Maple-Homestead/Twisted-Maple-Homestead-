# Homestead Helper v5 — Live Module QA Checklist

Use this after the v4 migrations/seed are installed and `config.js` is connected.

## Garden

- Sign in as User A.
- Add a bed.
- Add a planting.
- Add bed history.
- Record a harvest.
- Refresh and verify all records reload from Supabase.
- Sign in as User B and verify User A's rows are not visible.

## Animals

- Add an animal group.
- Record an animal loss and verify current count decreases.
- Add a health record.
- Add a preventive-care reminder with a due date.
- Verify a corresponding task appears on Home.
- Add a breeding record with an expected due/hatch date.
- Verify a corresponding task appears on Home.
- Record a birth/hatch event.

## Tree tapping

- Record sap.
- Add a syrup batch.
- Verify the sap:syrup ratio displays on the Homestead tab.
- Refresh and verify the batch reloads from Supabase.

## Tasks

- Care reminders and breeding dates should create tasks.
- Marking a task Done still works locally in this build.
- Next pass should persist task-completion updates to Supabase.

## Known follow-up items

- Crop names in new plantings currently use the UI crop name as `crop_id`; production should map exact crop reference IDs.
- Bed-history family uses the client-side starter crop family map; production should fetch `plant_family` from `crop_reference`.
- True subscription billing is not active yet.
- Task completion needs a Supabase update call.
- Editing/deleting health, care, breeding, and batch records is not yet exposed in UI.


## v6 production-gap tests

### Crop IDs
- Add a planting.
- Confirm `plantings.crop_id` contains a crop-reference ID such as `VEG001`, not `Tomato`.
- Add bed history and confirm both `crop_id` and `plant_family` are stored.

### Task persistence
- Complete a Supabase-backed task.
- Refresh.
- Verify it remains Done.

### Edit/delete
- Edit a planting quantity/status and refresh.
- Delete a health record, care reminder, breeding record, planting, and syrup batch; refresh and verify deletion.

### Billing
- Use Stripe test mode.
- Start monthly checkout.
- Complete Checkout with a Stripe test card.
- Confirm `subscriptions.status` becomes `trialing` or `active`.
- Refresh the app and verify Plus unlocks.
- Cancel/update through Stripe and verify webhook changes are reflected.
