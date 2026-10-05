-- Omnave Phase 2: durable, idempotent material ingestion.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'processing_attempt_status') then
    create type public.processing_attempt_status as enum (
      'REGISTERED',
      'QUEUED',
      'RUNNING',
      'COMPLETED',
      'FAILED',
      'CANCELLED',
      'DEAD_LETTER'
    );
  end if;
end
$$;

alter table public.materials add column if not exists file_name text;
alter table public.materials add column if not exists file_size_bytes bigint;
alter table public.materials add column if not exists mime_type text;
alter table public.materials add column if not exists page_count integer;
alter table public.materials add column if not exists failure_code text;
alter table public.materials add column if not exists failure_message text;

create table if not exists public.processing_attempts (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  idempotency_key text not null,
  status public.processing_attempt_status not null default 'REGISTERED',
  attempt_number integer not null default 1 check (attempt_number > 0),
  page_count integer not null default 0 check (page_count >= 0),
  reserved_pages integer not null default 0 check (reserved_pages >= 0),
  generation_reserved boolean not null default false,
  quota_released_at timestamptz,
  event_id text,
  failure_code text,
  failure_message text,
  retryable boolean not null default false,
  heartbeat_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, idempotency_key),
  unique (material_id, attempt_number)
);

create index if not exists processing_attempts_user_created_idx
  on public.processing_attempts (user_id, created_at desc);
create index if not exists processing_attempts_material_idx
  on public.processing_attempts (material_id, attempt_number desc);
create index if not exists processing_attempts_stale_idx
  on public.processing_attempts (heartbeat_at)
  where status in ('QUEUED', 'RUNNING');

drop trigger if exists processing_attempts_set_updated_at on public.processing_attempts;
create trigger processing_attempts_set_updated_at
before update on public.processing_attempts
for each row execute function private.set_updated_at();

alter table public.processing_attempts enable row level security;
revoke insert on table public.materials from authenticated;
drop policy if exists materials_insert_own on public.materials;
revoke all on table public.processing_attempts from anon, authenticated;
grant select on table public.processing_attempts to authenticated;

drop policy if exists processing_attempts_select_own on public.processing_attempts;
create policy processing_attempts_select_own on public.processing_attempts
for select to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.register_material_attempt(
  p_user_id uuid,
  p_idempotency_key text,
  p_title text,
  p_storage_path text,
  p_file_name text,
  p_file_size_bytes bigint,
  p_mime_type text
)
returns table(material_id uuid, attempt_id uuid, attempt_status public.processing_attempt_status)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_material_id uuid;
  v_attempt_id uuid;
  v_status public.processing_attempt_status;
begin
  if p_idempotency_key is null or length(trim(p_idempotency_key)) < 8 then
    raise exception 'INVALID_IDEMPOTENCY_KEY' using errcode = '22023';
  end if;

  select pa.material_id, pa.id, pa.status
    into v_material_id, v_attempt_id, v_status
  from public.processing_attempts pa
  where pa.user_id = p_user_id
    and pa.idempotency_key = p_idempotency_key;

  if v_attempt_id is not null then
    return query select v_material_id, v_attempt_id, v_status;
    return;
  end if;

  insert into public.materials (
    user_id, title, material_type, content_url, status, is_processed,
    file_name, file_size_bytes, mime_type
  ) values (
    p_user_id, p_title, 'pdf', p_storage_path, 'UPLOADED', false,
    p_file_name, p_file_size_bytes, p_mime_type
  ) returning id into v_material_id;

  insert into public.processing_attempts (
    material_id, user_id, idempotency_key, status, heartbeat_at
  ) values (
    v_material_id, p_user_id, p_idempotency_key, 'REGISTERED', now()
  ) returning id, status into v_attempt_id, v_status;

  return query select v_material_id, v_attempt_id, v_status;
exception
  when unique_violation then
    return query
      select pa.material_id, pa.id, pa.status
      from public.processing_attempts pa
      where pa.user_id = p_user_id
        and pa.idempotency_key = p_idempotency_key;
end;
$$;

create or replace function public.reserve_and_queue_material(
  p_user_id uuid,
  p_attempt_id uuid,
  p_page_count integer
)
returns table(material_id uuid, attempt_id uuid, plan_type text, queue_status text)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_attempt public.processing_attempts%rowtype;
  v_plan text;
  v_generation_count integer;
  v_pages_used integer;
  v_reset_at timestamptz;
begin
  select * into v_attempt
  from public.processing_attempts
  where id = p_attempt_id and user_id = p_user_id
  for update;

  if v_attempt.id is null then
    raise exception 'ATTEMPT_NOT_FOUND' using errcode = 'P0002';
  end if;

  if v_attempt.status in ('QUEUED', 'RUNNING', 'COMPLETED') then
    select coalesce(p.plan_type, 'free') into v_plan
    from public.profiles p where p.id = p_user_id;
    return query select v_attempt.material_id, v_attempt.id, v_plan, v_attempt.status::text;
    return;
  end if;

  if v_attempt.status <> 'REGISTERED' then
    raise exception 'ATTEMPT_NOT_QUEUEABLE' using errcode = '23514';
  end if;

  select coalesce(p.plan_type, 'free'), coalesce(p.generation_count, 0)
    into v_plan, v_generation_count
  from public.profiles p
  where p.id = p_user_id
  for update;

  select coalesce(u.weekly_pages_used, 0), u.page_pool_reset_at
    into v_pages_used, v_reset_at
  from public.user_usage u
  where u.user_id = p_user_id
  for update;

  if v_reset_at is null or v_reset_at <= now() then
    v_pages_used := 0;
    v_reset_at := now() + interval '7 days';
    update public.user_usage
      set weekly_pages_used = 0, page_pool_reset_at = v_reset_at
      where user_id = p_user_id;
  end if;

  if v_plan = 'free' and p_page_count > 50 then
    raise exception 'DOCUMENT_PAGE_LIMIT' using errcode = 'P0001';
  end if;

  if v_plan = 'free' and v_pages_used + p_page_count > 100 then
    raise exception 'WEEKLY_PAGE_LIMIT' using errcode = 'P0001';
  end if;

  update public.profiles
    set generation_count = v_generation_count + 1
    where id = p_user_id;

  update public.user_usage
    set weekly_pages_used = v_pages_used + greatest(p_page_count, 0)
    where user_id = p_user_id;

  update public.processing_attempts
    set status = 'QUEUED',
        page_count = greatest(p_page_count, 0),
        reserved_pages = greatest(p_page_count, 0),
        generation_reserved = true,
        heartbeat_at = now(),
        failure_code = null,
        failure_message = null
    where id = p_attempt_id;

  update public.materials
    set status = 'QUEUED',
        page_count = greatest(p_page_count, 0),
        failure_code = null,
        failure_message = null
    where id = v_attempt.material_id;

  return query select v_attempt.material_id, v_attempt.id, v_plan, 'QUEUED'::text;
end;
$$;

create or replace function public.create_material_retry_attempt(
  p_user_id uuid,
  p_material_id uuid,
  p_idempotency_key text
)
returns table(material_id uuid, attempt_id uuid, attempt_status public.processing_attempt_status)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_attempt_id uuid;
  v_status public.processing_attempt_status;
  v_attempt_number integer;
begin
  if not exists (
    select 1 from public.materials m
    where m.id = p_material_id
      and m.user_id = p_user_id
      and m.status in ('FAILED', 'CANCELLED')
  ) then
    raise exception 'MATERIAL_NOT_RETRYABLE' using errcode = '23514';
  end if;

  select pa.id, pa.status
    into v_attempt_id, v_status
  from public.processing_attempts pa
  where pa.user_id = p_user_id and pa.idempotency_key = p_idempotency_key;

  if v_attempt_id is not null then
    return query select p_material_id, v_attempt_id, v_status;
    return;
  end if;

  select coalesce(max(pa.attempt_number), 0) + 1
    into v_attempt_number
  from public.processing_attempts pa
  where pa.material_id = p_material_id;

  insert into public.processing_attempts (
    material_id, user_id, idempotency_key, attempt_number, status, heartbeat_at
  ) values (
    p_material_id, p_user_id, p_idempotency_key, v_attempt_number, 'REGISTERED', now()
  ) returning id, status into v_attempt_id, v_status;

  return query select p_material_id, v_attempt_id, v_status;
exception
  when unique_violation then
    return query
      select pa.material_id, pa.id, pa.status
      from public.processing_attempts pa
      where pa.user_id = p_user_id and pa.idempotency_key = p_idempotency_key;
end;
$$;

create or replace function public.set_processing_attempt_state(
  p_attempt_id uuid,
  p_status public.processing_attempt_status,
  p_failure_code text default null,
  p_failure_message text default null,
  p_retryable boolean default false,
  p_event_id text default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_attempt public.processing_attempts%rowtype;
  v_material_status public.material_status;
begin
  select * into v_attempt
  from public.processing_attempts
  where id = p_attempt_id
  for update;

  if v_attempt.id is null then
    raise exception 'ATTEMPT_NOT_FOUND' using errcode = 'P0002';
  end if;

  if v_attempt.status in ('COMPLETED', 'FAILED', 'CANCELLED', 'DEAD_LETTER') then
    return;
  end if;

  if p_status in ('FAILED', 'CANCELLED', 'DEAD_LETTER')
     and v_attempt.generation_reserved
     and v_attempt.quota_released_at is null then
    update public.profiles
      set generation_count = greatest(coalesce(generation_count, 0) - 1, 0)
      where id = v_attempt.user_id;
    update public.user_usage
      set weekly_pages_used = greatest(coalesce(weekly_pages_used, 0) - v_attempt.reserved_pages, 0)
      where user_id = v_attempt.user_id;
  end if;

  update public.processing_attempts
    set status = p_status,
        event_id = coalesce(p_event_id, event_id),
        heartbeat_at = now(),
        started_at = case when p_status = 'RUNNING' then coalesce(started_at, now()) else started_at end,
        finished_at = case when p_status in ('COMPLETED', 'FAILED', 'CANCELLED', 'DEAD_LETTER') then now() else finished_at end,
        failure_code = p_failure_code,
        failure_message = left(p_failure_message, 1000),
        retryable = p_retryable,
        quota_released_at = case
          when p_status in ('FAILED', 'CANCELLED', 'DEAD_LETTER') and generation_reserved
            then coalesce(quota_released_at, now())
          else quota_released_at
        end
    where id = p_attempt_id;

  v_material_status := case p_status
    when 'COMPLETED' then 'COMPLETED'::public.material_status
    when 'FAILED' then 'FAILED'::public.material_status
    when 'CANCELLED' then 'CANCELLED'::public.material_status
    when 'DEAD_LETTER' then 'FAILED'::public.material_status
    else null
  end;

  if v_material_status is not null then
    update public.materials
      set status = v_material_status,
          failure_code = p_failure_code,
          failure_message = left(p_failure_message, 1000)
      where id = v_attempt.material_id;
  end if;
end;
$$;

revoke all on function public.register_material_attempt(uuid, text, text, text, text, bigint, text) from public, anon, authenticated;
revoke all on function public.create_material_retry_attempt(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.reserve_and_queue_material(uuid, uuid, integer) from public, anon, authenticated;
revoke all on function public.set_processing_attempt_state(uuid, public.processing_attempt_status, text, text, boolean, text) from public, anon, authenticated;
grant execute on function public.register_material_attempt(uuid, text, text, text, text, bigint, text) to service_role;
grant execute on function public.create_material_retry_attempt(uuid, uuid, text) to service_role;
grant execute on function public.reserve_and_queue_material(uuid, uuid, integer) to service_role;
grant execute on function public.set_processing_attempt_state(uuid, public.processing_attempt_status, text, text, boolean, text) to service_role;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'processing_attempts'
  ) then
    alter publication supabase_realtime add table public.processing_attempts;
  end if;
end
$$;
