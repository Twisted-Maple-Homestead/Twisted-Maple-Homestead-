-- Homestead Helper production tables used by the current web app.
-- Safe to run after supabase-schema.sql; uses IF NOT EXISTS where possible.

create extension if not exists "pgcrypto";

create table if not exists plantings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bed_id uuid references beds(id) on delete cascade,
  crop_id text not null references crop_reference(id),
  variety text,
  quantity_planted integer not null default 0 check (quantity_planted >= 0),
  season_year integer not null,
  status text not null default 'Planned',
  created_at timestamptz not null default now()
);

create table if not exists bed_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bed_id uuid not null references beds(id) on delete cascade,
  year integer not null,
  crop_id text references crop_reference(id),
  crop_name text,
  plant_family text,
  harvest_lb numeric not null default 0 check (harvest_lb >= 0),
  created_at timestamptz not null default now()
);

create table if not exists animal_health_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  animal_group_id uuid not null references animal_groups(id) on delete cascade,
  record_type text not null,
  record_date date not null default current_date,
  observed_issue_reason text,
  outcome_followup text,
  cost numeric not null default 0 check (cost >= 0),
  created_at timestamptz not null default now()
);

create table if not exists preventive_care (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  animal_group_id uuid not null references animal_groups(id) on delete cascade,
  care_type text not null,
  product_procedure text,
  next_due_date date,
  status text not null default 'Scheduled',
  created_at timestamptz not null default now()
);

create table if not exists breeding_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  animal_group_id uuid not null references animal_groups(id) on delete cascade,
  species text,
  breeding_pairing_date date not null,
  expected_due_hatch_date date,
  pregnancy_fertility_status text,
  outcome text not null default 'Pending',
  created_at timestamptz not null default now()
);

create table if not exists offspring_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  breeding_id uuid not null references breeding_records(id) on delete cascade,
  parent_group_id uuid references animal_groups(id) on delete set null,
  species text,
  birth_hatch_date date not null,
  total_born_hatched integer not null default 0 check (total_born_hatched >= 0),
  live_count integer not null default 0 check (live_count >= 0),
  early_losses_0_7_days integer not null default 0 check (early_losses_0_7_days >= 0),
  created_at timestamptz not null default now(),
  constraint offspring_live_not_over_total check (live_count <= total_born_hatched),
  constraint offspring_losses_not_over_live check (early_losses_0_7_days <= live_count)
);

create unique index if not exists offspring_one_event_per_breeding
  on offspring_events(user_id, breeding_id);

create table if not exists syrup_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  batch_date date not null default current_date,
  sap_used_gal numeric not null default 0 check (sap_used_gal >= 0),
  average_sap_sugar_pct numeric check (average_sap_sugar_pct is null or average_sap_sugar_pct >= 0),
  finished_syrup_gal numeric not null default 0 check (finished_syrup_gal >= 0),
  fuel_cost numeric not null default 0 check (fuel_cost >= 0),
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  area text,
  due_date date,
  status text not null default 'Open',
  created_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'stripe',
  provider_customer_id text,
  provider_subscription_id text,
  status text not null default 'inactive',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists subscriptions_one_provider_per_user
  on subscriptions(user_id, provider);

-- Row Level Security for every user-owned table in this migration.
alter table plantings enable row level security;
alter table bed_history enable row level security;
alter table animal_health_records enable row level security;
alter table preventive_care enable row level security;
alter table breeding_records enable row level security;
alter table offspring_events enable row level security;
alter table syrup_batches enable row level security;
alter table tasks enable row level security;
alter table subscriptions enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'plantings','bed_history','animal_health_records','preventive_care',
    'breeding_records','offspring_events','syrup_batches','tasks','subscriptions'
  ]
  loop
    execute format('drop policy if exists "own rows" on %I', t);
    execute format(
      'create policy "own rows" on %I for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t
    );
  end loop;
end $$;

-- Helpful indexes for common app lookups.
create index if not exists plantings_user_bed_idx on plantings(user_id, bed_id);
create index if not exists bed_history_user_bed_year_idx on bed_history(user_id, bed_id, year);
create index if not exists animal_health_user_group_date_idx on animal_health_records(user_id, animal_group_id, record_date desc);
create index if not exists preventive_care_user_due_idx on preventive_care(user_id, next_due_date);
create index if not exists breeding_user_due_idx on breeding_records(user_id, expected_due_hatch_date);
create index if not exists tasks_user_status_due_idx on tasks(user_id, status, due_date);
create index if not exists syrup_batches_user_date_idx on syrup_batches(user_id, batch_date desc);
