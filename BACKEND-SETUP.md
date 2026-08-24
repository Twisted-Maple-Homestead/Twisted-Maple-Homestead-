# Homestead Helper v4 — Complete Supabase Backend

This package turns the growing MVP into one coherent backend.

## New migration set

Run in order:

1. `supabase/migrations/0001_core_garden_food.sql`
2. `supabase/migrations/0002_livestock.sql`
3. `supabase/migrations/0003_tree_tapping.sql`
4. `supabase/migrations/0004_security_views.sql`
5. `supabase/seed.sql`

If you use the Supabase CLI:

```bash
supabase db push
supabase db seed
```

## Included user-owned modules

### Garden + food
- profiles
- gardens
- beds / containers
- plantings
- harvests
- bed history
- food goals
- pantry/freezer lots
- daily tasks
- location/frost settings

### Master/reference data
- full 46-crop starter dataset
- crop timing rules for all 46 crops

### Animals
- animal groups
- animal loss
- health/treatment records
- preventive care
- quarantine
- breeding
- birth/hatch / offspring events
- grow-out records
- feed & expenses
- animal food production
- processing records

### Tree tapping
- trees
- taps
- sap collection
- syrup batches
- syrup inventory

### Product
- subscriptions / entitlement state

## Security

All user-owned tables have Row Level Security enabled.

Reference crop tables are read-only for normal clients.

Three helper views are included:
- `v_animal_group_summary`
- `v_food_supply`
- `v_tree_tapping_season`

They use `security_invoker = true`, so the caller's RLS rules still apply.

## Important next code step

The browser MVP already reads/writes several Supabase tables. The next implementation pass should map the remaining UI modules to these new tables:

- plantings + bed history
- animal health / preventive care
- breeding / offspring / grow-out
- tapping / syrup batches / syrup inventory
- tasks and reminders
- subscription entitlement state

## Data quality

Crop yield, spacing, container, and timing values remain marked as MVP estimates where appropriate. Before public launch, validate crop-by-crop against extension and cultivar-specific sources.

## Safety boundaries

The database stores:
- animal observations and veterinarian-provided treatment records
- withdrawal/restriction dates
- suspected vs confirmed causes of animal loss
- preservation planning records

The app should not:
- diagnose animal disease
- invent medication dosing
- invent shelf-stable canning instructions
- treat yield/frost/tapping estimates as guarantees
