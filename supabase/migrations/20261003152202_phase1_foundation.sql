-- Omnave Phase 1: source-controlled data, authorization, and job-state contract.
-- This migration is intentionally compatible with the tables already used by
-- the application while also being able to create a fresh project.

create extension if not exists pgcrypto;
create schema if not exists private;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'material_status') then
    create type public.material_status as enum (
      'UPLOADED',
      'QUEUED',
      'PARSING_DOCUMENT',
      'GENERATING_SUMMARY',
      'BUILDING_ASSESSMENTS',
      'COMPLETED',
      'FAILED',
      'CANCELLED'
    );
  end if;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  plan_type text not null default 'free' check (plan_type in ('free', 'pro')),
  total_xp integer not null default 0 check (total_xp >= 0),
  current_streak integer not null default 0 check (current_streak >= 0),
  last_active_date date,
  generation_count integer not null default 0 check (generation_count >= 0),
  agent_message_count integer not null default 0 check (agent_message_count >= 0),
  last_message_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists plan_type text not null default 'free';
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists total_xp integer not null default 0;
alter table public.profiles add column if not exists current_streak integer not null default 0;
alter table public.profiles add column if not exists last_active_date date;
alter table public.profiles add column if not exists generation_count integer not null default 0;
alter table public.profiles add column if not exists agent_message_count integer not null default 0;
alter table public.profiles add column if not exists last_message_date timestamptz;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  material_type text not null default 'pdf',
  content_url text,
  status public.material_status not null default 'UPLOADED',
  is_processed boolean not null default false,
  summary text,
  flashcards jsonb,
  quizzes jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.materials add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.materials add column if not exists title text;
alter table public.materials add column if not exists material_type text not null default 'pdf';
alter table public.materials add column if not exists content_url text;
alter table public.materials add column if not exists is_processed boolean not null default false;
alter table public.materials add column if not exists summary text;
alter table public.materials add column if not exists flashcards jsonb;
alter table public.materials add column if not exists quizzes jsonb;
alter table public.materials add column if not exists created_at timestamptz not null default now();
alter table public.materials add column if not exists updated_at timestamptz not null default now();

do $$
declare
  status_type text;
begin
  select c.udt_name
  into status_type
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'materials'
    and c.column_name = 'status';

  if status_type is null then
    alter table public.materials
      add column status public.material_status not null default 'UPLOADED';
  elsif status_type <> 'material_status' then
    alter table public.materials alter column status drop default;
    alter table public.materials
      alter column status type public.material_status
      using (
        case upper(coalesce(status::text, ''))
          when 'PROCESSING' then 'QUEUED'
          when 'PARSING' then 'PARSING_DOCUMENT'
          when 'GENERATING' then 'GENERATING_SUMMARY'
          when 'FINALIZING' then 'BUILDING_ASSESSMENTS'
          when 'FAILED' then 'FAILED'
          when 'CANCELLED' then 'CANCELLED'
          when 'COMPLETED' then 'COMPLETED'
          when 'PARSING_DOCUMENT' then 'PARSING_DOCUMENT'
          when 'GENERATING_SUMMARY' then 'GENERATING_SUMMARY'
          when 'BUILDING_ASSESSMENTS' then 'BUILDING_ASSESSMENTS'
          else case when is_processed then 'COMPLETED' else 'UPLOADED' end
        end::public.material_status
      );
    alter table public.materials alter column status set default 'UPLOADED';
    alter table public.materials alter column status set not null;
  end if;
end
$$;

update public.materials
set is_processed = (status = 'COMPLETED');

create table if not exists public.user_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  weekly_pages_used integer not null default 0 check (weekly_pages_used >= 0),
  page_pool_reset_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_usage add column if not exists weekly_pages_used integer not null default 0;
alter table public.user_usage add column if not exists page_pool_reset_at timestamptz not null default (now() + interval '7 days');
alter table public.user_usage add column if not exists created_at timestamptz not null default now();
alter table public.user_usage add column if not exists updated_at timestamptz not null default now();

create table if not exists public.quiz_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Kept as text during Phase 1 because the hosted database contains legacy
  -- non-UUID lesson IDs. New writes are still checked against owned materials.
  lesson_id text not null,
  score integer not null check (score >= 0),
  total_questions integer not null check (total_questions > 0),
  percentage numeric(5,2) not null check (percentage between 0 and 100),
  created_at timestamptz not null default now()
);

alter table public.quiz_scores add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.quiz_scores add column if not exists lesson_id text;
alter table public.quiz_scores add column if not exists score integer;
alter table public.quiz_scores add column if not exists total_questions integer;
alter table public.quiz_scores add column if not exists percentage numeric(5,2);
alter table public.quiz_scores add column if not exists created_at timestamptz not null default now();

create index if not exists materials_user_created_idx
  on public.materials (user_id, created_at desc);
create index if not exists materials_user_status_idx
  on public.materials (user_id, status);
create index if not exists quiz_scores_user_created_idx
  on public.quiz_scores (user_id, created_at desc);
create index if not exists quiz_scores_lesson_idx
  on public.quiz_scores (lesson_id);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.enforce_material_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = old.status then
    new.is_processed = (new.status = 'COMPLETED');
    return new;
  end if;

  if not (
    (old.status = 'UPLOADED' and new.status in ('QUEUED', 'FAILED', 'CANCELLED')) or
    (old.status = 'QUEUED' and new.status in ('PARSING_DOCUMENT', 'FAILED', 'CANCELLED')) or
    (old.status = 'PARSING_DOCUMENT' and new.status in ('GENERATING_SUMMARY', 'FAILED', 'CANCELLED')) or
    (old.status = 'GENERATING_SUMMARY' and new.status in ('BUILDING_ASSESSMENTS', 'FAILED', 'CANCELLED')) or
    (old.status = 'BUILDING_ASSESSMENTS' and new.status in ('COMPLETED', 'FAILED', 'CANCELLED')) or
    (old.status in ('COMPLETED', 'FAILED', 'CANCELLED') and new.status = 'QUEUED')
  ) then
    raise exception 'Invalid material transition: % -> %', old.status, new.status
      using errcode = '23514';
  end if;

  new.is_processed = (new.status = 'COMPLETED');
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

drop trigger if exists materials_set_updated_at on public.materials;
create trigger materials_set_updated_at
before update on public.materials
for each row execute function private.set_updated_at();

drop trigger if exists materials_validate_transition on public.materials;
create trigger materials_validate_transition
before update of status on public.materials
for each row execute function private.enforce_material_transition();

drop trigger if exists user_usage_set_updated_at on public.user_usage;
create trigger user_usage_set_updated_at
before update on public.user_usage
for each row execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do update
    set full_name = coalesce(public.profiles.full_name, excluded.full_name);

  insert into public.user_usage (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

insert into public.user_usage (user_id)
select id from auth.users
on conflict (user_id) do nothing;

alter table public.profiles enable row level security;
alter table public.materials enable row level security;
alter table public.user_usage enable row level security;
alter table public.quiz_scores enable row level security;

-- Remove legacy broad policies. Postgres combines permissive policies with OR,
-- so leaving these in place would defeat the narrower Phase 1 policies.
drop policy if exists "Users can delete their own materials." on public.materials;
drop policy if exists "Users can insert their own materials." on public.materials;
drop policy if exists "Users can manage their own materials" on public.materials;
drop policy if exists "Users can update their own materials" on public.materials;
drop policy if exists "Users can view their own materials." on public.materials;
drop policy if exists "Users can insert their own profile." on public.profiles;
drop policy if exists "Users can manage their own profile" on public.profiles;
drop policy if exists "Users can update their own profile." on public.profiles;
drop policy if exists "Users can view their own profile." on public.profiles;
drop policy if exists "Users can insert their own quiz scores." on public.quiz_scores;
drop policy if exists "Users can manage their own quiz scores" on public.quiz_scores;
drop policy if exists "Users can view their own quiz scores." on public.quiz_scores;
drop policy if exists "Users can manage their own usage tracking" on public.user_usage;
drop policy if exists "Users can read their own usage" on public.user_usage;
drop policy if exists "Users can view own usage" on public.user_usage;
drop policy if exists "Users can delete their own materials" on storage.objects;
drop policy if exists "Users can upload their own materials" on storage.objects;
drop policy if exists "Users can view their own materials" on storage.objects;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.materials from anon, authenticated;
revoke all on table public.user_usage from anon, authenticated;
revoke all on table public.quiz_scores from anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (total_xp, current_streak, last_active_date) on table public.profiles to authenticated;
grant select, insert on table public.materials to authenticated;
grant select on table public.user_usage to authenticated;
grant select, insert on table public.quiz_scores to authenticated;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select to authenticated
using ((select auth.uid()) = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists materials_select_own on public.materials;
create policy materials_select_own on public.materials
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists materials_insert_own on public.materials;
create policy materials_insert_own on public.materials
for insert to authenticated
with check ((select auth.uid()) = user_id and status = 'UPLOADED');

drop policy if exists materials_delete_own on public.materials;

drop policy if exists user_usage_select_own on public.user_usage;
create policy user_usage_select_own on public.user_usage
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists quiz_scores_select_own on public.quiz_scores;
create policy quiz_scores_select_own on public.quiz_scores
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists quiz_scores_insert_own on public.quiz_scores;
create policy quiz_scores_insert_own on public.quiz_scores
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.materials m
    where m.id::text = lesson_id
      and m.user_id = (select auth.uid())
  )
);

insert into storage.buckets (id, name, public)
values ('study_materials', 'study_materials', false)
on conflict (id) do update set public = false;

drop policy if exists study_materials_select_own on storage.objects;
create policy study_materials_select_own on storage.objects
for select to authenticated
using (
  bucket_id = 'study_materials'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists study_materials_insert_own on storage.objects;
create policy study_materials_insert_own on storage.objects
for insert to authenticated
with check (
  bucket_id = 'study_materials'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and lower(storage.extension(name)) = 'pdf'
);

drop policy if exists study_materials_delete_own on storage.objects;
create policy study_materials_delete_own on storage.objects
for delete to authenticated
using (
  bucket_id = 'study_materials'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'materials'
  ) then
    alter publication supabase_realtime add table public.materials;
  end if;
end
$$;
