-- Adds optional ministry context fields to service plans.
alter table public.service_plans
  add column if not exists theme text,
  add column if not exists scripture text;
