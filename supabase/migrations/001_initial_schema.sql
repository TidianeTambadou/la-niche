-- ═══════════════════════════════════════════════════════════════════════
-- LA NICHE — Schéma initial
-- Carnet olfactif : wishlist, balades olfactives, poses sur mannequin 3D.
-- À exécuter dans le SQL Editor Supabase (ou via psql).
-- Idempotent : ré-exécutable sans erreur (drop puis recreate).
-- ═══════════════════════════════════════════════════════════════════════

-- ─── Nettoyage (sans danger sur base vierge) ───────────────────────────

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists public.walk_applications;
drop table if exists public.walks;
drop table if exists public.wishlist_items;
drop table if exists public.profiles;
drop type if exists public.wishlist_status;
drop type if exists public.wishlist_priority;
drop policy if exists "photos: read own" on storage.objects;
drop policy if exists "photos: insert own" on storage.objects;
drop policy if exists "photos: delete own" on storage.objects;

-- ─── Types ──────────────────────────────────────────────────────────────

create type public.wishlist_status as enum ('to_smell', 'to_buy', 'to_compare');
create type public.wishlist_priority as enum ('low', 'medium', 'high');

-- ─── Profils ────────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: insert own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);

-- Création automatique du profil à l'inscription.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Wishlist ───────────────────────────────────────────────────────────

create table public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  house text not null default '',
  photo_path text,
  note text not null default '',
  priority public.wishlist_priority not null default 'medium',
  status public.wishlist_status not null default 'to_smell',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index wishlist_items_user_idx on public.wishlist_items (user_id, created_at desc);

alter table public.wishlist_items enable row level security;

create policy "wishlist: read own" on public.wishlist_items
  for select using (auth.uid() = user_id);
create policy "wishlist: insert own" on public.wishlist_items
  for insert with check (auth.uid() = user_id);
create policy "wishlist: update own" on public.wishlist_items
  for update using (auth.uid() = user_id);
create policy "wishlist: delete own" on public.wishlist_items
  for delete using (auth.uid() = user_id);

-- ─── Balades olfactives ────────────────────────────────────────────────

create table public.walks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '',
  location text not null default '',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create index walks_user_idx on public.walks (user_id, started_at desc);

alter table public.walks enable row level security;

create policy "walks: read own" on public.walks
  for select using (auth.uid() = user_id);
create policy "walks: insert own" on public.walks
  for insert with check (auth.uid() = user_id);
create policy "walks: update own" on public.walks
  for update using (auth.uid() = user_id);
create policy "walks: delete own" on public.walks
  for delete using (auth.uid() = user_id);

-- ─── Poses (applications de parfum pendant une balade) ─────────────────

create table public.walk_applications (
  id uuid primary key default gen_random_uuid(),
  walk_id uuid not null references public.walks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Lien optionnel vers la wishlist (le parfum peut être hors wishlist).
  wishlist_item_id uuid references public.wishlist_items (id) on delete set null,
  perfume_name text not null,
  perfume_house text not null default '',
  -- Zone anatomique stable (layering, stats) + position 3D exacte du clic.
  body_zone text not null check (body_zone in (
    'behind-ear-left', 'behind-ear-right',
    'neck-left', 'neck-right', 'throat', 'nape',
    'chest',
    'inner-elbow-left', 'inner-elbow-right',
    'outer-elbow-left', 'outer-elbow-right',
    'wrist-left', 'wrist-right',
    'back-of-hand-left', 'back-of-hand-right'
  )),
  position_x real,
  position_y real,
  position_z real,
  -- Photo du flacon = marqueur visuel de la pose.
  photo_path text,
  note text not null default '',
  applied_at timestamptz not null default now()
);

create index walk_applications_walk_idx on public.walk_applications (walk_id, applied_at);
create index walk_applications_user_idx on public.walk_applications (user_id, applied_at desc);

alter table public.walk_applications enable row level security;

create policy "applications: read own" on public.walk_applications
  for select using (auth.uid() = user_id);
create policy "applications: insert own" on public.walk_applications
  for insert with check (auth.uid() = user_id);
create policy "applications: update own" on public.walk_applications
  for update using (auth.uid() = user_id);
create policy "applications: delete own" on public.walk_applications
  for delete using (auth.uid() = user_id);

-- ─── Storage : photos de flacons ───────────────────────────────────────
-- Convention de chemin : {user_id}/{uuid}.jpg — la policy vérifie que le
-- premier dossier du chemin est l'uid de l'utilisateur.

insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

create policy "photos: read own" on storage.objects
  for select using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "photos: insert own" on storage.objects
  for insert with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "photos: delete own" on storage.objects
  for delete using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
