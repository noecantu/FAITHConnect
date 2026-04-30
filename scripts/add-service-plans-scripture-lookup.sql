alter table public.service_plans
  add column if not exists scripture_text text,
  add column if not exists scripture_translation text;

create table if not exists public.scripture_cache (
  cache_key text primary key,
  reference text not null,
  translation text not null,
  verse_text text not null,
  updated_at timestamptz not null default now()
);

alter table public.scripture_cache
  alter column reference set not null,
  alter column translation set not null,
  alter column verse_text set not null,
  alter column updated_at set not null;

do $$ begin
  alter table public.scripture_cache
    add constraint scripture_cache_reference_len_chk
      check (char_length(reference) between 1 and 140);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.scripture_cache
    add constraint scripture_cache_translation_len_chk
      check (char_length(translation) between 1 and 20);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.scripture_cache
    add constraint scripture_cache_verse_text_len_chk
      check (char_length(verse_text) between 1 and 12000);
exception when duplicate_object then null;
end $$;

create index if not exists scripture_cache_updated_at_idx
  on public.scripture_cache (updated_at desc);

-- Secure by default: only server-side service role should touch this table.
alter table public.scripture_cache enable row level security;

revoke all on table public.scripture_cache from anon;
revoke all on table public.scripture_cache from authenticated;

-- Keep policies explicit: no client-side access.
drop policy if exists "scripture_cache_no_client_select" on public.scripture_cache;
create policy "scripture_cache_no_client_select" on public.scripture_cache
  for select to authenticated, anon
  using (false);

drop policy if exists "scripture_cache_no_client_insert" on public.scripture_cache;
create policy "scripture_cache_no_client_insert" on public.scripture_cache
  for insert to authenticated, anon
  with check (false);

drop policy if exists "scripture_cache_no_client_update" on public.scripture_cache;
create policy "scripture_cache_no_client_update" on public.scripture_cache
  for update to authenticated, anon
  using (false)
  with check (false);

drop policy if exists "scripture_cache_no_client_delete" on public.scripture_cache;
create policy "scripture_cache_no_client_delete" on public.scripture_cache
  for delete to authenticated, anon
  using (false);
