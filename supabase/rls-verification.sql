-- Homestead Helper production RLS verification helper.
-- Run these queries in Supabase SQL Editor after applying schema + migrations.
-- This file does not bypass RLS and does not create users.

-- 1) Confirm RLS is enabled on the user-owned tables used by the live app.
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles','gardens','beds','harvests','animal_groups','animal_losses',
    'trees','sap_collections','stored_food','food_goals','user_location_settings',
    'plantings','bed_history','animal_health_records','preventive_care',
    'breeding_records','offspring_events','syrup_batches','tasks','subscriptions'
  )
order by tablename;

-- Expected: rowsecurity = true for every row above.

-- 2) Confirm each user-owned table has the expected own-rows policy.
select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'profiles','gardens','beds','harvests','animal_groups','animal_losses',
    'trees','sap_collections','stored_food','food_goals','user_location_settings',
    'plantings','bed_history','animal_health_records','preventive_care',
    'breeding_records','offspring_events','syrup_batches','tasks','subscriptions'
  )
order by tablename, policyname;

-- 3) Confirm critical foreign keys cascade when an auth user is deleted.
select
  tc.table_name,
  kcu.column_name,
  ccu.table_name as foreign_table_name,
  rc.delete_rule
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
 and tc.constraint_schema = kcu.constraint_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
 and ccu.constraint_schema = tc.constraint_schema
join information_schema.referential_constraints rc
  on rc.constraint_name = tc.constraint_name
 and rc.constraint_schema = tc.constraint_schema
where tc.constraint_type = 'FOREIGN KEY'
  and ccu.table_name = 'users'
  and ccu.table_schema = 'auth'
order by tc.table_name;

-- 4) Manual two-user isolation test (required before launch):
--    a. Create disposable User A and User B through normal app signup.
--    b. While signed in as User A, create one identifiable row in beds, animal_groups and tasks.
--    c. Sign out and sign in as User B.
--    d. Verify User A rows are not visible and cannot be updated/deleted.
--    e. Create User B rows and repeat from User A.
--    f. Delete one disposable account and verify only that user's rows cascade away.
