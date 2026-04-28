-- ============================================================
-- FAITHConnect – Supabase Postgres Schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID extension (already enabled by default on Supabase)
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

do $$ begin
  create type billing_status as enum ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'paused', 'unpaid');
exception when duplicate_object then null; end $$;
do $$ begin
  create type church_status as enum ('pending', 'active', 'disabled');
exception when duplicate_object then null; end $$;
do $$ begin
  create type member_status as enum ('Active', 'Prospect', 'Archived');
exception when duplicate_object then null; end $$;
do $$ begin
  create type contribution_category as enum ('Tithes', 'Offering', 'Donation', 'Other');
exception when duplicate_object then null; end $$;
do $$ begin
  create type contribution_type as enum ('Digital Transfer', 'Cash', 'Check', 'Other');
exception when duplicate_object then null; end $$;

-- ============================================================
-- USERS
-- References auth.users (Supabase Auth) – one row per user.
-- ============================================================

create table if not exists public.users (
  id                      uuid primary key references auth.users (id) on delete cascade,
  email                   text not null,
  first_name              text,
  last_name               text,
  display_name            text,
  profile_photo_url       text,

  -- Plan / billing
  plan_id                 text,
  stripe_customer_id      text,
  stripe_subscription_id  text,
  billing_status          text,
  billing_delinquent      boolean default false,
  billing_updated_at      timestamptz,

  -- Roles (array of role strings matching app/lib/auth/roles.ts)
  roles                   text[] not null default '{}',

  -- Explicit module permissions (granular access grants, independent of role titles)
  permissions             text[] not null default '{}',

  -- Church association
  church_id               text,
  roles_by_church         jsonb  not null default '{}',
  managed_church_ids      text[] not null default '{}',

  -- Regional / district
  region_id               text,
  region_name             text,
  region_admin_title      text,
  state                   text,
  district_id             text,
  district_name           text,
  district_title          text,
  district_state          text,

  -- Onboarding
  onboarding_step         text    not null default 'choose-plan',
  onboarding_complete     boolean not null default false,

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Trigger: keep updated_at current
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- ============================================================
-- CHURCHES
-- ============================================================

create table if not exists public.churches (
  id                      text primary key,   -- slug, e.g. "grace-fellowship"
  slug                    text not null unique,
  name                    text not null,
  status                  church_status not null default 'pending',
  timezone                text not null default 'America/New_York',

  logo_url                text,
  description             text,
  address                 text,
  address_1               text,
  address_2               text,
  city                    text,
  state                   text,
  zip                     text,
  country                 text,
  email                   text,
  phone                   text,
  leader_first_name       text,
  leader_last_name        text,
  leader_name             text,
  leader_title            text,

  -- Billing
  billing_owner_uid       uuid references public.users (id) on delete set null,
  billing_contact_email   text,
  billing_status          text,
  billing_delinquent      boolean default false,
  billing_current_period_end bigint,
  stripe_customer_id      text,
  stripe_subscription_id  text,
  plan_id                 text,
  billing_updated_at      timestamptz,

  -- Settings stored as flexible JSON
  settings                jsonb not null default '{}',

  -- Region & District membership
  region_id               text,
  region_selected_id      text,
  region_status           text,
  district_id             text,

  created_by              uuid references public.users (id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  enabled_at              timestamptz,
  disabled_at             timestamptz
);

create or replace trigger churches_updated_at
  before update on public.churches
  for each row execute function public.set_updated_at();

create index if not exists churches_slug_idx on public.churches (slug);

-- Add newer church address columns for existing databases
do $$ begin
  begin alter table public.churches add column address_1 text; exception when duplicate_column then null; end;
  begin alter table public.churches add column address_2 text; exception when duplicate_column then null; end;
  begin alter table public.churches add column leader_first_name text; exception when duplicate_column then null; end;
  begin alter table public.churches add column leader_last_name text; exception when duplicate_column then null; end;
end $$;

-- ============================================================
-- MEMBERS
-- ============================================================

create table if not exists public.members (
  id                  uuid primary key default uuid_generate_v4(),
  church_id           text not null references public.churches (id) on delete cascade,

  first_name          text not null,
  last_name           text not null,
  email               text,
  phone_number        text,
  profile_photo_url   text,
  status              member_status not null default 'Active',
  check_in_code       text,
  qr_code             text,

  -- Dates stored as ISO strings (YYYY-MM-DD) for easy display
  birthday            date,
  baptism_date        date,
  anniversary         date,

  address             jsonb,            -- { street, city, state, zip }
  notes               text,
  family_id           uuid,
  user_id             uuid references public.users (id) on delete set null,

  -- Relationships stored as JSONB array
  relationships       jsonb not null default '[]',

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create or replace trigger members_updated_at
  before update on public.members
  for each row execute function public.set_updated_at();

create index if not exists members_church_id_idx on public.members (church_id);
create index if not exists members_status_idx    on public.members (church_id, status);

-- ============================================================
-- EVENTS
-- ============================================================

create table if not exists public.events (
  id              uuid primary key default uuid_generate_v4(),
  church_id       text not null references public.churches (id) on delete cascade,

  title           text not null,
  date_string     text not null,          -- YYYY-MM-DD
  time_string     text not null default '00:00', -- HH:mm
  description     text,
  notes           text,
  visibility      text not null default 'private', -- 'public' | 'private'
  groups          text[] not null default '{}',
  member_ids      text[] not null default '{}',

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create or replace trigger events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

create index if not exists events_church_id_idx on public.events (church_id);
create index if not exists events_date_idx      on public.events (church_id, date_string);

-- ============================================================
-- SERVICE PLANS
-- ============================================================

create table if not exists public.service_plans (
  id              uuid primary key default uuid_generate_v4(),
  church_id       text not null references public.churches (id) on delete cascade,

  title           text not null,
  date_string     text not null,   -- YYYY-MM-DD
  time_string     text not null,   -- HH:MM (24h)
  notes           text not null default '',
  is_public       boolean not null default true,
  groups          text[] not null default '{}',

  -- Sections: [{ id, title, personId, songIds, notes, color }]
  sections        jsonb not null default '[]',

  created_by      uuid references public.users (id) on delete set null,
  created_at      bigint not null,    -- epoch ms (matches existing app pattern)
  updated_at      bigint not null
);

create index if not exists service_plans_church_id_idx  on public.service_plans (church_id);
create index if not exists service_plans_date_idx       on public.service_plans (church_id, date_string desc);

-- ============================================================
-- CONTRIBUTIONS
-- ============================================================

create table if not exists public.contributions (
  id                  uuid primary key default uuid_generate_v4(),
  church_id           text not null references public.churches (id) on delete cascade,

  member_id           uuid references public.members (id) on delete set null,
  member_name         text not null,
  amount              numeric(12, 2) not null,
  category            contribution_category not null,
  contribution_type   contribution_type not null,
  date                text not null,   -- YYYY-MM-DD
  notes               text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create or replace trigger contributions_updated_at
  before update on public.contributions
  for each row execute function public.set_updated_at();

create index if not exists contributions_church_id_idx on public.contributions (church_id);
create index if not exists contributions_date_idx      on public.contributions (church_id, date desc);

-- ============================================================
-- SONGS
-- ============================================================

create table if not exists public.songs (
  id          uuid primary key default uuid_generate_v4(),
  church_id   text not null references public.churches (id) on delete cascade,

  title       text not null,
  artist      text,
  key         text,
  tempo       int,
  time_sig    text,
  lyrics      text,
  notes       text,
  tags        text[] not null default '{}',

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create or replace trigger songs_updated_at
  before update on public.songs
  for each row execute function public.set_updated_at();

create index if not exists songs_church_id_idx on public.songs (church_id);
create index if not exists songs_title_idx     on public.songs (church_id, title);

-- ============================================================
-- SET LISTS
-- ============================================================

create table if not exists public.setlists (
  id            uuid primary key default uuid_generate_v4(),
  church_id     text not null references public.churches (id) on delete cascade,

  title         text not null,
  date_string   text,
  time_string   text,
  notes         text,

  sections      jsonb not null default '[]',
  service_type  text,
  service_notes jsonb,

  created_by    uuid references public.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Migrate existing tables that used old column names
do $$ begin
  begin alter table public.setlists rename column date to date_string; exception when others then null; end;
  begin alter table public.setlists add column time_string text; exception when duplicate_column then null; end;
  begin alter table public.setlists add column sections jsonb not null default '[]'; exception when duplicate_column then null; end;
  begin alter table public.setlists add column service_type text; exception when duplicate_column then null; end;
  begin alter table public.setlists add column service_notes jsonb; exception when duplicate_column then null; end;
end $$;

create or replace trigger setlists_updated_at
  before update on public.setlists
  for each row execute function public.set_updated_at();

create index if not exists setlists_church_id_idx on public.setlists (church_id);

-- ============================================================
-- SECTION NAMES
-- ============================================================

create table if not exists public.section_names (
  id          uuid primary key default uuid_generate_v4(),
  church_id   text not null references public.churches (id) on delete cascade,
  title       text not null,
  created_at  timestamptz not null default now(),
  unique (church_id, title)
);

create index if not exists section_names_church_id_idx on public.section_names (church_id);

-- ============================================================
-- ATTENDANCE
-- ============================================================

create table if not exists public.attendance (
  id              uuid primary key default uuid_generate_v4(),
  church_id       text not null references public.churches (id) on delete cascade,
  date            text not null,   -- YYYY-MM-DD

  member_id       uuid references public.members (id) on delete cascade,
  member_name     text,
  visitor_id      uuid,
  visitor_name    text,
  attended        boolean not null default false,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create or replace trigger attendance_updated_at
  before update on public.attendance
  for each row execute function public.set_updated_at();

create index if not exists attendance_church_date_idx on public.attendance (church_id, date);

-- ============================================================
-- LOGS (audit trail)
-- ============================================================

create table if not exists public.logs (
  id          uuid primary key default uuid_generate_v4(),
  type        text not null,
  message     text not null,
  actor_uid   uuid references public.users (id) on delete set null,
  actor_name  text,
  target_id   text,
  target_type text,
  before      jsonb,
  after       jsonb,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists logs_type_idx     on public.logs (type);
create index if not exists logs_actor_idx    on public.logs (actor_uid);
create index if not exists logs_created_idx  on public.logs (created_at desc);

-- ============================================================
-- DISTRICTS / REGIONS
-- ============================================================

create table if not exists public.districts (
  id                  uuid primary key default uuid_generate_v4(),
  name                text not null,
  state               text,
  logo_url            text,
  region_admin_first_name text,
  region_admin_last_name  text,
  region_admin_name   text,
  region_admin_title  text,
  admin_uid           uuid references public.users (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create or replace trigger districts_updated_at
  before update on public.districts
  for each row execute function public.set_updated_at();

create table if not exists public.regions (
  id                    uuid primary key default uuid_generate_v4(),
  district_id           uuid references public.districts (id) on delete cascade,
  district_selected_id  uuid references public.districts (id) on delete set null,
  district_status       text,
  name                  text not null,
  state                 text,
  logo_url              text,
  region_admin_first_name text,
  region_admin_last_name  text,
  region_admin_name     text,
  region_admin_title    text,
  admin_uid             uuid references public.users (id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create or replace trigger regions_updated_at
  before update on public.regions
  for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.users          enable row level security;
alter table public.churches       enable row level security;
alter table public.members        enable row level security;
alter table public.events         enable row level security;
alter table public.service_plans  enable row level security;
alter table public.contributions  enable row level security;
alter table public.songs          enable row level security;
alter table public.setlists       enable row level security;
alter table public.attendance     enable row level security;
alter table public.logs           enable row level security;
alter table public.districts      enable row level security;
alter table public.regions        enable row level security;

-- ----------------------------------------------------------------
-- users: each user can read/update their own row only.
-- Service role (used by your API routes via adminDb) bypasses RLS.
-- ----------------------------------------------------------------
drop policy if exists "users: read own"   on public.users;
drop policy if exists "users: update own" on public.users;
drop policy if exists "users: insert own" on public.users;
create policy "users: read own"   on public.users for select using (auth.uid() = id);
create policy "users: update own" on public.users for update using (auth.uid() = id);
create policy "users: insert own" on public.users for insert with check (auth.uid() = id);

-- ----------------------------------------------------------------
-- churches: member of that church can read; Admin role can write.
-- ----------------------------------------------------------------
drop policy if exists "churches: read if member" on public.churches;
drop policy if exists "churches: write if admin" on public.churches;
create policy "churches: read if member" on public.churches for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and (u.church_id = churches.id
          or churches.id = any(u.managed_church_ids)
          or 'SystemAdmin' = any(u.roles)
          or 'RootAdmin'   = any(u.roles)
          or 'DistrictAdmin' = any(u.roles))
    )
  );

create policy "churches: write if admin" on public.churches for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and (
          ('Admin' = any(u.roles) and u.church_id = churches.id)
          or 'SystemAdmin' = any(u.roles)
          or 'RootAdmin'   = any(u.roles)
        )
    )
  );

-- ----------------------------------------------------------------
-- Church-scoped tables: users belonging to the church can read.
-- Write access checked in API routes via service role (adminDb).
-- ----------------------------------------------------------------

-- ----------------------------------------------------------------
-- districts: any authenticated user can read; write via service role only.
-- ----------------------------------------------------------------
drop policy if exists "districts: read if authenticated" on public.districts;
create policy "districts: read if authenticated" on public.districts for select
  using (auth.uid() is not null);

-- ----------------------------------------------------------------
-- regions: any authenticated user can read; write via service role only.
-- ----------------------------------------------------------------
drop policy if exists "regions: read if authenticated" on public.regions;
create policy "regions: read if authenticated" on public.regions for select
  using (auth.uid() is not null);

-- ----------------------------------------------------------------
drop policy if exists "members: read if church member" on public.members;
create policy "members: read if church member" on public.members for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and (
          -- Direct church member
          u.church_id = members.church_id
          -- RegionalAdmin for this church's region
          or ('RegionalAdmin' = any(u.roles)
              and exists (
                select 1 from public.churches c
                where c.id = members.church_id
                  and c.region_id = u.region_id
              ))
          -- DistrictAdmin for this church's district
          or ('DistrictAdmin' = any(u.roles)
              and exists (
                select 1 from public.churches c
                where c.id = members.church_id
                  and c.district_id = u.district_id
              ))
          -- System admins
          or 'SystemAdmin' = any(u.roles)
          or 'RootAdmin' = any(u.roles)
        )
    )
  );

drop policy if exists "events: read if church member" on public.events;
create policy "events: read if church member" on public.events for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and (
          -- Direct church member
          u.church_id = events.church_id
          -- RegionalAdmin for this church's region
          or ('RegionalAdmin' = any(u.roles)
              and exists (
                select 1 from public.churches c
                where c.id = events.church_id
                  and c.region_id = u.region_id
              ))
          -- DistrictAdmin for this church's district
          or ('DistrictAdmin' = any(u.roles)
              and exists (
                select 1 from public.churches c
                where c.id = events.church_id
                  and c.district_id = u.district_id
              ))
          -- System admins
          or 'SystemAdmin' = any(u.roles)
          or 'RootAdmin' = any(u.roles)
        )
    )
  );

drop policy if exists "service_plans: read if church member" on public.service_plans;
create policy "service_plans: read if church member" on public.service_plans for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and (
          -- Direct church member
          u.church_id = service_plans.church_id
          -- RegionalAdmin for this church's region
          or ('RegionalAdmin' = any(u.roles)
              and exists (
                select 1 from public.churches c
                where c.id = service_plans.church_id
                  and c.region_id = u.region_id
              ))
          -- DistrictAdmin for this church's district
          or ('DistrictAdmin' = any(u.roles)
              and exists (
                select 1 from public.churches c
                where c.id = service_plans.church_id
                  and c.district_id = u.district_id
              ))
          -- System admins
          or 'SystemAdmin' = any(u.roles)
          or 'RootAdmin' = any(u.roles)
        )
    )
  );

drop policy if exists "contributions: read if church member" on public.contributions;
create policy "contributions: read if church member" on public.contributions for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and (
          -- Direct church member
          u.church_id = contributions.church_id
          -- RegionalAdmin for this church's region
          or ('RegionalAdmin' = any(u.roles)
              and exists (
                select 1 from public.churches c
                where c.id = contributions.church_id
                  and c.region_id = u.region_id
              ))
          -- DistrictAdmin for this church's district
          or ('DistrictAdmin' = any(u.roles)
              and exists (
                select 1 from public.churches c
                where c.id = contributions.church_id
                  and c.district_id = u.district_id
              ))
          -- System admins
          or 'SystemAdmin' = any(u.roles)
          or 'RootAdmin' = any(u.roles)
        )
    )
  );

drop policy if exists "songs: read if church member" on public.songs;
create policy "songs: read if church member" on public.songs for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and (
          -- Direct church member
          u.church_id = songs.church_id
          -- RegionalAdmin for this church's region
          or ('RegionalAdmin' = any(u.roles)
              and exists (
                select 1 from public.churches c
                where c.id = songs.church_id
                  and c.region_id = u.region_id
              ))
          -- DistrictAdmin for this church's district
          or ('DistrictAdmin' = any(u.roles)
              and exists (
                select 1 from public.churches c
                where c.id = songs.church_id
                  and c.district_id = u.district_id
              ))
          -- System admins
          or 'SystemAdmin' = any(u.roles)
          or 'RootAdmin' = any(u.roles)
        )
    )
  );

drop policy if exists "setlists: read if church member" on public.setlists;
create policy "setlists: read if church member" on public.setlists for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and (
          -- Direct church member
          u.church_id = setlists.church_id
          -- RegionalAdmin for this church's region
          or ('RegionalAdmin' = any(u.roles)
              and exists (
                select 1 from public.churches c
                where c.id = setlists.church_id
                  and c.region_id = u.region_id
              ))
          -- DistrictAdmin for this church's district
          or ('DistrictAdmin' = any(u.roles)
              and exists (
                select 1 from public.churches c
                where c.id = setlists.church_id
                  and c.district_id = u.district_id
              ))
          -- System admins
          or 'SystemAdmin' = any(u.roles)
          or 'RootAdmin' = any(u.roles)
        )
    )
  );

drop policy if exists "attendance: read if church member" on public.attendance;
create policy "attendance: read if church member" on public.attendance for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and (
          -- Direct church member
          u.church_id = attendance.church_id
          -- RegionalAdmin for this church's region
          or ('RegionalAdmin' = any(u.roles)
              and exists (
                select 1 from public.churches c
                where c.id = attendance.church_id
                  and c.region_id = u.region_id
              ))
          -- DistrictAdmin for this church's district
          or ('DistrictAdmin' = any(u.roles)
              and exists (
                select 1 from public.churches c
                where c.id = attendance.church_id
                  and c.district_id = u.district_id
              ))
          -- System admins
          or 'SystemAdmin' = any(u.roles)
          or 'RootAdmin' = any(u.roles)
        )
    )
  );

drop policy if exists "attendance: insert if church member" on public.attendance;
create policy "attendance: insert if church member" on public.attendance for insert
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and (
          -- Direct church member
          u.church_id = attendance.church_id
          -- RegionalAdmin for this church's region
          or ('RegionalAdmin' = any(u.roles)
              and exists (
                select 1 from public.churches c
                where c.id = attendance.church_id
                  and c.region_id = u.region_id
              ))
          -- DistrictAdmin for this church's district
          or ('DistrictAdmin' = any(u.roles)
              and exists (
                select 1 from public.churches c
                where c.id = attendance.church_id
                  and c.district_id = u.district_id
              ))
          -- System admins
          or 'SystemAdmin' = any(u.roles)
          or 'RootAdmin' = any(u.roles)
        )
    )
  );

drop policy if exists "attendance: delete if church member" on public.attendance;
create policy "attendance: delete if church member" on public.attendance for delete
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and (
          -- Direct church member
          u.church_id = attendance.church_id
          -- RegionalAdmin for this church's region
          or ('RegionalAdmin' = any(u.roles)
              and exists (
                select 1 from public.churches c
                where c.id = attendance.church_id
                  and c.region_id = u.region_id
              ))
          -- DistrictAdmin for this church's district
          or ('DistrictAdmin' = any(u.roles)
              and exists (
                select 1 from public.churches c
                where c.id = attendance.church_id
                  and c.district_id = u.district_id
              ))
          -- System admins
          or 'SystemAdmin' = any(u.roles)
          or 'RootAdmin' = any(u.roles)
        )
    )
  );

-- ----------------------------------------------------------------
-- Auto-create user profile row when a new Supabase Auth user signs up.
-- ----------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------
-- Migration: add permissions column to existing deployments.
-- Safe to run multiple times (IF NOT EXISTS guard).
-- ----------------------------------------------------------------
alter table public.users add column if not exists permissions text[] not null default '{}';

-- ----------------------------------------------------------------
-- Migration: add event member targeting to existing deployments.
-- Safe to run multiple times (IF NOT EXISTS guard).
-- ----------------------------------------------------------------
alter table public.events add column if not exists member_ids text[] not null default '{}';
alter table public.events add column if not exists time_string text not null default '00:00';
