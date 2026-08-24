-- Homestead Helper MVP Supabase schema
-- Run in the Supabase SQL editor. Review before production use.

create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  zip_code text,
  created_at timestamptz default now()
);

create table if not exists gardens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My Garden',
  created_at timestamptz default now()
);

create table if not exists beds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  garden_id uuid references gardens(id) on delete cascade,
  name text not null,
  type text not null,
  length_ft numeric,
  width_ft numeric,
  created_at timestamptz default now()
);

create table if not exists harvests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  crop_name text not null,
  amount_lb numeric not null check (amount_lb >= 0),
  harvested_on date not null default current_date,
  created_at timestamptz default now()
);

create table if not exists animal_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  species text not null,
  purpose text,
  starting_count integer not null default 0,
  current_count integer not null default 0,
  status text not null default 'Active',
  created_at timestamptz default now()
);

create table if not exists animal_losses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  animal_group_id uuid not null references animal_groups(id) on delete cascade,
  loss_date date not null default current_date,
  count_lost integer not null check (count_lost > 0),
  category text not null,
  suspected_cause text,
  financial_loss numeric,
  food_production_impact text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists trees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  species text not null,
  dbh_in numeric,
  health_status text,
  current_taps integer default 0,
  created_at timestamptz default now()
);

create table if not exists sap_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tree_id uuid references trees(id) on delete set null,
  collected_on date not null default current_date,
  gallons numeric not null check (gallons >= 0),
  sugar_percent numeric,
  notes text,
  created_at timestamptz default now()
);

create table if not exists stored_food (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  food_name text not null,
  method text not null,
  storage_location text,
  total_weight_lb numeric not null default 0,
  preserved_on date,
  best_quality_by date,
  notes text,
  created_at timestamptz default now()
);

create table if not exists food_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  crop_name text not null,
  household_size integer not null default 1,
  meals_per_week numeric not null default 0,
  serving_lb_per_person numeric not null default 0,
  weeks_to_cover integer not null default 0,
  safety_buffer_pct numeric not null default 15,
  target_lb numeric,
  created_at timestamptz default now()
);

-- RLS
alter table profiles enable row level security;
alter table gardens enable row level security;
alter table beds enable row level security;
alter table harvests enable row level security;
alter table animal_groups enable row level security;
alter table animal_losses enable row level security;
alter table trees enable row level security;
alter table sap_collections enable row level security;
alter table stored_food enable row level security;
alter table food_goals enable row level security;

do $$
declare t text;
begin
  foreach t in array array['profiles','gardens','beds','harvests','animal_groups','animal_losses','trees','sap_collections','stored_food','food_goals']
  loop
    execute format('drop policy if exists "own rows" on %I', t);
    execute format('create policy "own rows" on %I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  end loop;
end $$;

-- profiles uses id instead of user_id:
drop policy if exists "own rows" on profiles;
create policy "own rows" on profiles
for all using (auth.uid() = id) with check (auth.uid() = id);


create table if not exists crop_reference (
  id text primary key,
  common_name text not null unique,
  category text,
  plant_family text,
  season text,
  days_to_maturity_min integer,
  days_to_maturity_max integer,
  spacing_in numeric,
  row_spacing_in numeric,
  min_container_gal numeric,
  yield_min_lb numeric,
  yield_max_lb numeric,
  succession_interval_days integer
);

create table if not exists crop_timing_rules (
  crop_id text primary key references crop_reference(id) on delete cascade,
  indoor_start_offset_days integer,
  direct_sow_offset_days integer,
  transplant_offset_days integer,
  fall_planting_lead_days integer,
  min_soil_temp_f numeric,
  frost_tolerance text
);

create table if not exists user_location_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  zip_code text,
  latitude numeric,
  longitude numeric,
  usda_zone text,
  noaa_station_id text,
  spring_freeze_50 date,
  spring_freeze_10 date,
  fall_freeze_50 date,
  fall_freeze_10 date,
  microclimate_adjustment_days integer default 0,
  risk_preference text default 'Typical (50%)'
);

alter table user_location_settings enable row level security;
drop policy if exists "own rows" on user_location_settings;
create policy "own rows" on user_location_settings
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
