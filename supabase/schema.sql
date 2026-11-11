-- Plakçı veritabanı şeması
-- Her kullanıcının (tek sahip hesabı) tüm uygulama durumu tek satırda JSON olarak tutulur.

create table if not exists public.app_state (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

-- Herkes yalnızca kendi satırını görebilir ve değiştirebilir
drop policy if exists "app_state_select_own" on public.app_state;
drop policy if exists "app_state_insert_own" on public.app_state;
drop policy if exists "app_state_update_own" on public.app_state;
drop policy if exists "app_state_delete_own" on public.app_state;

create policy "app_state_select_own" on public.app_state
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "app_state_insert_own" on public.app_state
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "app_state_update_own" on public.app_state
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "app_state_delete_own" on public.app_state
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Anonim (giriş yapmamış) istemcilerin tabloya hiçbir erişimi yok
revoke all on public.app_state from anon;
grant select, insert, update, delete on public.app_state to authenticated;

-- Oturumlar: her biri kendi beğeni / favori / sonra dinle / tür verisini tutar.
-- app_state yalnızca ortak ayarları ve önbellekleri tutar.
create table if not exists public.plakci_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null default 'Oturum',
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists plakci_sessions_user_idx on public.plakci_sessions (user_id, created_at);

alter table public.plakci_sessions enable row level security;

drop policy if exists "sessions_select_own" on public.plakci_sessions;
drop policy if exists "sessions_insert_own" on public.plakci_sessions;
drop policy if exists "sessions_update_own" on public.plakci_sessions;
drop policy if exists "sessions_delete_own" on public.plakci_sessions;

create policy "sessions_select_own" on public.plakci_sessions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "sessions_insert_own" on public.plakci_sessions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "sessions_update_own" on public.plakci_sessions
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "sessions_delete_own" on public.plakci_sessions
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.plakci_sessions from anon;
grant select, insert, update, delete on public.plakci_sessions to authenticated;
