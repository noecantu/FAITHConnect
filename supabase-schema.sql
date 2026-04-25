-- ============================================================
-- FAITHConnect – Supabase Postgres Schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID extension (already enabled by default on Supabase)
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

create type billing_status as enum ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'paused', 'unpaid');
create type church_status   as enum ('pending', 'active', 'disabled');
create type member_status   as enum ('Active', 'Prospect', 'Archived');
create type contribution_category as enum ('Tithes', 'Offering', 'Donation', 'Other');
create type contribution_type     as enum ('Digital Transfer', 'Cash', 'Check', 'Other');

-- ============================================================
-- USERS
-- References auth.users (Supabase Auth) – one row per user.
-- ============================================================

create table public.users (
  id                      uuid primary key references auth.users (id) on delete cascade,
  email                   text not null,
  first_name              text,
  last_name               text,
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

  -- Church association
  church_id               text,
  roles_by_church         jsonb  not null default '{}',
  managed_church_ids      text[] not null default '{}',

  -- Regional / district
  region_id               text,
  region_name             text,

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

create trigger users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- ============================================================
-- CHURCHES
-- ============================================================

create table public.churches (
  id                      text primary key,   -- slug, e.g. "grace-fellowship"
  slug                    text not null unique,
  name                    text not null,
  status                  church_status not null default 'pending',
  timezone                text not null default 'America/New_York',

  logo_url                text,
  description             text,
  address                 text,
  city                    text,
  state                   text,
  zip                     text,
  country                 text,
  email                   text,
  phone                   text,
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

  created_by              uuid references public.users (id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  enabled_at              timestamptz,
  disabled_at             timestamptz
);

create trigger churches_updated_at
  before update on public.churches
  for each row execute function public.set_updated_at();

create index churches_slug_idx on public.churches (slug);

-- ============================================================
-- MEMBERS
-- ============================================================

create table public.members (
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

create trigger members_updated_at
  before update on public.members
  for each row execute function public.set_updated_at();

create index members_church_id_idx on public.members (church_id);
create index members_status_idx    on public.members (church_id, status);

-- ============================================================
-- EVENTS
-- ============================================================

create table public.events (
  id              uuid primary key default uuid_generate_v4(),
  church_id       text not null references public.churches (id) on delete cascade,

  title           text not null,
  date_string     text not null,          -- YYYY-MM-DD
  description     text,
  notes           text,
  visibility      text not null default 'private', -- 'public' | 'private'
  groups          text[] not null default '{}',

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

create index events_church_id_idx on public.events (church_id);
create index events_date_idx      on public.events (church_id, date_string);

-- ============================================================
-- SERVICE PLANS
-- ============================================================

create table public.service_plans (
  id              uuid primary key default uuid_generate_v4(),
  church_id       text not null references public.churches (id) on delete cascade,

  title           text not null,
  date_string     text not null,   -- YYYY-MM-DD
  time_string     text not null,   -- HH:MM (24h)
  notes           text not null default '',
  is_public       boolean not null default false,
  groups          text[] not null default '{}',

  -- Sections: [{ id, title, personId, songIds, notes, color }]
  sections        jsonb not null default '[]',

  created_by      uuid references public.users (id) on delete set null,
  created_at      bigint not null,    -- epoch ms (matches existing app pattern)
  updated_at      bigint not null
);

create index service_plans_church_id_idx  on public.service_plans (church_id);
create index service_plans_date_idx       on public.service_plans (church_id, date_string desc);

-- ============================================================
-- CONTRIBUTIONS
-- ============================================================

create table public.contributions (
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

create trigger contributions_updated_at
  before update on public.contributions
  for each row execute function public.set_updated_at();

create index contributions_church_id_idx on public.contributions (church_id);
create index contributions_date_idx      on public.contributions (church_id, date desc);

-- ============================================================
-- SONGS
-- ============================================================

create table public.songs (
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

create trigger songs_updated_at
  before update on public.songs
  for each row execute function public.set_updated_at();

create index songs_church_id_idx on public.songs (church_id);
create index songs_title_idx     on public.songs (church_id, title);

-- ============================================================
-- SET LISTS
-- ============================================================

create table public.setlists (
  id          uuid primary key default uuid_generate_v4(),
  church_id   text not null references public.churches (id) on delete cascade,

  title       text not null,
  date        text,
  notes       text,

  -- Items: [{ songId, key, notes }]
  items       jsonb not null default '[]',

  created_by  uuid references public.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger setlists_updated_at
  before update on public.setlists
  for each row execute function public.set_updated_at();

create index setlists_church_id_idx on public.setlists (church_id);

-- ============================================================
-- ATTENDANCE
-- ============================================================

create table public.attendance (
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

create trigger attendance_updated_at
  before update on public.attendance
  for each row execute function public.set_updated_at();

create index attendance_church_date_idx on public.attendance (church_id, date);

-- ============================================================
-- LOGS (audit trail)
-- ============================================================

create table public.logs (
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

create index logs_type_idx     on public.logs (type);
create index logs_actor_idx    on public.logs (actor_uid);
create index logs_created_idx  on public.logs (created_at desc);

-- ============================================================
-- DISTRICTS / REGIONS
-- ============================================================

create table public.districts (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  admin_uid   uuid references public.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger districts_updated_at
  before update on public.districts
  for each row execute function public.set_updated_at();

create table public.regions (
  id          uuid primary key default uuid_generate_v4(),
  district_id uuid references public.districts (id) on delete cascade,
  name        text not null,
  admin_uid   uuid references public.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger regions_updated_at
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
create policy "users: read own"   on public.users for select using (auth.uid() = id);
create policy "users: update own" on public.users for update using (auth.uid() = id);
create policy "users: insert own" on public.users for insert with check (auth.uid() = id);

-- ----------------------------------------------------------------
-- churches: member of that church can read; Admin role can write.
-- ----------------------------------------------------------------
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
create policy "members: read if church member" on public.members for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.church_id = members.church_id
    )
  );

create policy "events: read if church member" on public.events for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.church_id = events.church_id
    )
  );

create policy "service_plans: read if church member" on public.service_plans for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.church_id = service_plans.church_id
    )
  );

create policy "contributions: read if church member" on public.contributions for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.church_id = contributions.church_id
    )
  );

create policy "songs: read if church member" on public.songs for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.church_id = songs.church_id
    )
  );

create policy "setlists: read if church member" on public.setlists for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.church_id = setlists.church_id
    )
  );

create policy "attendance: read if church member" on public.attendance for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.church_id = attendance.church_id
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
