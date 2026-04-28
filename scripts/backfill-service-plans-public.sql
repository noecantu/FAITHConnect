-- One-time backfill for environments that previously defaulted service plans to private.
-- Review affected rows before running the UPDATE.

-- Preview
select id, church_id, title, date_string, is_public, groups
from public.service_plans
where is_public = false
order by date_string desc;

-- Backfill all legacy private rows to public
update public.service_plans
set
  is_public = true,
  groups = '{}'
where is_public = false;
