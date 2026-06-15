-- ============================================================
--  D&D Companion — database schema
--  Run this in your Supabase project:
--    Dashboard > SQL Editor > New query > paste > Run
-- ============================================================

-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ---------- sessions (one row per campaign) -----------------
create table if not exists public.sessions (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  dm_pin     text not null,
  created_at timestamptz not null default now()
);

-- Self-service signup: the campaign join code is the player password.
alter table public.sessions add column if not exists join_code text;

-- ---------- characters --------------------------------------
create table if not exists public.characters (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references public.sessions(id) on delete cascade,
  name         text not null,
  pin          text not null,
  class        text,
  race         text,
  level        int  not null default 1,
  max_hp       int  not null default 10,
  current_hp   int  not null default 10,
  strength     int  not null default 10,
  dexterity    int  not null default 10,
  constitution int  not null default 10,
  intelligence int  not null default 10,
  wisdom       int  not null default 10,
  charisma     int  not null default 10,
  spell_slots  jsonb not null default '{}'::jsonb,
  abilities    jsonb not null default '[]'::jsonb,
  equipment    jsonb not null default '[]'::jsonb,
  backstory    text
);

-- ---------- characters: lifecycle migration ------------------
--  Adds the canonical `sheet jsonb` (full evolving character) plus
--  flat identity columns mirrored from `sheet` on every save. Safe to
--  re-run; legacy columns above stay nullable for the demo character.
alter table public.characters
  add column if not exists subrace    text,
  add column if not exists subclass   text,
  add column if not exists background  text,
  add column if not exists alignment  text,
  add column if not exists avatar_url  text,
  add column if not exists sheet       jsonb not null default '{}'::jsonb;

-- ---------- combat (one active tracker per session) ---------
create table if not exists public.combat (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references public.sessions(id) on delete cascade,
  combatants   jsonb not null default '[]'::jsonb, -- [{name, initiative, current_hp, max_hp, is_player}]
  current_turn int  not null default 0,
  is_active    boolean not null default false
);

-- ---------- dice_rolls (shared roll log) --------------------
create table if not exists public.dice_rolls (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid not null references public.sessions(id) on delete cascade,
  character_name text,
  dice_type      text,
  result         int,
  label          text,
  rolled_at      timestamptz not null default now()
);

-- ---------- notes (DM notepad + NPCs per session) -----------
create table if not exists public.notes (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  content    text default '',
  npcs       jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------- lore_entries (Campaign Codex, revealable lore) --
create table if not exists public.lore_entries (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.sessions(id) on delete cascade,
  category    text not null default 'story',  -- story | npc | location | faction
  title       text not null,
  body        text not null default '',
  revealed    boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
--  Row Level Security
--  This app uses PIN matching, not Supabase Auth, so the anon
--  key must be able to read/write. We enable RLS and add open
--  policies (fine for a private friends' campaign). Tighten
--  later if you ever expose this publicly.
-- ============================================================
alter table public.sessions   enable row level security;
alter table public.characters enable row level security;
alter table public.combat     enable row level security;
alter table public.dice_rolls enable row level security;
alter table public.notes      enable row level security;
alter table public.lore_entries enable row level security;

do $$
declare t text;
begin
  foreach t in array array['sessions','characters','combat','dice_rolls','notes','lore_entries']
  loop
    execute format(
      'drop policy if exists "anon_all_%1$s" on public.%1$s;', t);
    execute format(
      'create policy "anon_all_%1$s" on public.%1$s
         for all to anon using (true) with check (true);', t);
  end loop;
end $$;

-- ============================================================
--  Realtime — broadcast row changes for live sync.
--  Wrapped so re-running (table already in publication) can't
--  abort the whole script and roll back the table creation.
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array['characters','combat','dice_rolls','lore_entries']
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception
      when duplicate_object then null; -- already added, ignore
      when undefined_object then null; -- publication missing, ignore
    end;
  end loop;
end $$;

-- Make sure full row data is sent on updates/deletes
alter table public.characters replica identity full;
alter table public.combat     replica identity full;
alter table public.dice_rolls replica identity full;
alter table public.lore_entries replica identity full;

-- ============================================================
--  Storage — public `avatars` bucket for character portraits.
--  Anon can read/write (private friends' game). Safe to re-run.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_anon_rw" on storage.objects;
create policy "avatars_anon_rw" on storage.objects
  for all to anon
  using (bucket_id = 'avatars') with check (bucket_id = 'avatars');
