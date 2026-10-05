-- Omnave Phase 4: centralized entitlements, atomic usage, and idempotent progress.

do $$ begin
  if not exists (select 1 from pg_type where typname = 'usage_resource') then
    create type public.usage_resource as enum ('generation', 'pages', 'chat_message');
  end if;
  if not exists (select 1 from pg_type where typname = 'usage_state') then
    create type public.usage_state as enum ('RESERVED', 'CONSUMED', 'REFUNDED', 'EXPIRED');
  end if;
end $$;

create table if not exists public.plan_entitlements (
  plan_type text primary key check (plan_type in ('free', 'pro')),
  max_file_bytes bigint not null check (max_file_bytes > 0),
  max_pages_per_document integer not null check (max_pages_per_document > 0),
  generation_limit integer not null check (generation_limit > 0),
  page_limit integer not null check (page_limit > 0),
  chat_message_limit integer not null check (chat_message_limit > 0),
  updated_at timestamptz not null default now()
);

insert into public.plan_entitlements (
  plan_type, max_file_bytes, max_pages_per_document,
  generation_limit, page_limit, chat_message_limit
) values
  ('free', 15728640, 50, 3, 100, 15),
  ('pro', 52428800, 250, 100, 2000, 200)
on conflict (plan_type) do update set
  max_file_bytes = excluded.max_file_bytes,
  max_pages_per_document = excluded.max_pages_per_document,
  generation_limit = excluded.generation_limit,
  page_limit = excluded.page_limit,
  chat_message_limit = excluded.chat_message_limit,
  updated_at = now();

alter table public.profiles add column if not exists timezone text not null default 'UTC';
alter table public.profiles add column if not exists highest_streak integer not null default 0;

create table if not exists public.usage_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resource public.usage_resource not null,
  state public.usage_state not null default 'RESERVED',
  units integer not null check (units > 0),
  mutation_key text not null,
  related_id uuid,
  window_started_at timestamptz not null,
  window_ends_at timestamptz not null,
  reserved_at timestamptz not null default now(),
  consumed_at timestamptz,
  refunded_at timestamptz,
  expired_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  unique (user_id, resource, mutation_key),
  check (window_ends_at > window_started_at)
);

create index if not exists usage_ledger_active_window_idx
  on public.usage_ledger (user_id, resource, window_started_at, window_ends_at)
  where state in ('RESERVED', 'CONSUMED');
create index if not exists usage_ledger_related_idx
  on public.usage_ledger (related_id) where related_id is not null;

alter table public.quiz_scores add column if not exists mutation_key text;
alter table public.quiz_scores add column if not exists xp_awarded integer not null default 0;
alter table public.quiz_scores add column if not exists learner_local_date date;
alter table public.quiz_scores add column if not exists learner_timezone text;
create unique index if not exists quiz_scores_user_mutation_idx
  on public.quiz_scores (user_id, mutation_key) where mutation_key is not null;

alter table public.plan_entitlements enable row level security;
alter table public.usage_ledger enable row level security;
revoke all on table public.plan_entitlements from public, anon, authenticated;
revoke all on table public.usage_ledger from public, anon, authenticated;
grant select on table public.plan_entitlements to authenticated;
grant select on table public.usage_ledger to authenticated;

drop policy if exists plan_entitlements_read on public.plan_entitlements;
create policy plan_entitlements_read on public.plan_entitlements
for select to authenticated using (true);
drop policy if exists usage_ledger_select_own on public.usage_ledger;
create policy usage_ledger_select_own on public.usage_ledger
for select to authenticated using ((select auth.uid()) = user_id);

create or replace function private.usage_window(
  p_resource public.usage_resource,
  p_timezone text
) returns table(window_start timestamptz, window_end timestamptz)
language plpgsql stable set search_path = '' as $$
declare v_local timestamp;
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = p_timezone) then
    p_timezone := 'UTC';
  end if;
  v_local := pg_catalog.now() at time zone p_timezone;
  if p_resource = 'chat_message' then
    window_start := pg_catalog.date_trunc('day', v_local) at time zone p_timezone;
    window_end := (pg_catalog.date_trunc('day', v_local) + interval '1 day') at time zone p_timezone;
  elsif p_resource = 'pages' then
    window_start := pg_catalog.date_trunc('week', v_local) at time zone p_timezone;
    window_end := (pg_catalog.date_trunc('week', v_local) + interval '7 days') at time zone p_timezone;
  else
    window_start := pg_catalog.date_trunc('month', v_local) at time zone p_timezone;
    window_end := (pg_catalog.date_trunc('month', v_local) + interval '1 month') at time zone p_timezone;
  end if;
  return next;
end $$;

create or replace function private.reserve_usage(
  p_user_id uuid,
  p_resource public.usage_resource,
  p_units integer,
  p_mutation_key text,
  p_related_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns public.usage_ledger
language plpgsql security definer set search_path = '' as $$
declare
  v_profile public.profiles%rowtype;
  v_entitlement public.plan_entitlements%rowtype;
  v_window record;
  v_limit integer;
  v_used integer;
  v_existing public.usage_ledger%rowtype;
  v_row public.usage_ledger%rowtype;
begin
  if p_units <= 0 or length(trim(p_mutation_key)) < 8 then
    raise exception 'INVALID_USAGE_RESERVATION' using errcode = '22023';
  end if;

  select * into v_profile from public.profiles where id = p_user_id for update;
  if v_profile.id is null then raise exception 'PROFILE_NOT_FOUND' using errcode = 'P0002'; end if;

  select * into v_existing from public.usage_ledger
   where user_id = p_user_id and resource = p_resource and mutation_key = p_mutation_key;
  if v_existing.id is not null then return v_existing; end if;

  select * into v_entitlement from public.plan_entitlements
   where plan_type = case when v_profile.plan_type = 'pro' then 'pro' else 'free' end;
  select * into v_window from private.usage_window(p_resource, v_profile.timezone);
  v_limit := case p_resource
    when 'generation' then v_entitlement.generation_limit
    when 'pages' then v_entitlement.page_limit
    else v_entitlement.chat_message_limit end;

  update public.usage_ledger set state = 'EXPIRED', expired_at = now()
   where user_id = p_user_id and resource = p_resource and state = 'RESERVED'
     and window_ends_at <= now();

  select coalesce(sum(units), 0)::integer into v_used from public.usage_ledger
   where user_id = p_user_id and resource = p_resource
     and state in ('RESERVED', 'CONSUMED')
     and window_started_at = v_window.window_start;
  if v_used + p_units > v_limit then
    raise exception 'USAGE_LIMIT_EXCEEDED:%:%:%', p_resource, v_used, v_limit using errcode = 'P0001';
  end if;

  insert into public.usage_ledger (
    user_id, resource, units, mutation_key, related_id,
    window_started_at, window_ends_at, metadata
  ) values (
    p_user_id, p_resource, p_units, p_mutation_key, p_related_id,
    v_window.window_start, v_window.window_end, coalesce(p_metadata, '{}'::jsonb)
  ) returning * into v_row;
  return v_row;
end $$;

create or replace function private.settle_usage(
  p_user_id uuid,
  p_resource public.usage_resource,
  p_mutation_key text,
  p_state public.usage_state
) returns public.usage_ledger
language plpgsql security definer set search_path = '' as $$
declare v_row public.usage_ledger%rowtype;
begin
  if p_state not in ('CONSUMED', 'REFUNDED') then
    raise exception 'INVALID_USAGE_STATE' using errcode = '22023';
  end if;
  select * into v_row from public.usage_ledger
   where user_id = p_user_id and resource = p_resource and mutation_key = p_mutation_key for update;
  if v_row.id is null then raise exception 'USAGE_RESERVATION_NOT_FOUND' using errcode = 'P0002'; end if;
  if v_row.state = p_state or v_row.state in ('CONSUMED', 'REFUNDED', 'EXPIRED') then return v_row; end if;
  update public.usage_ledger set
    state = p_state,
    consumed_at = case when p_state = 'CONSUMED' then now() else consumed_at end,
    refunded_at = case when p_state = 'REFUNDED' then now() else refunded_at end
  where id = v_row.id returning * into v_row;
  return v_row;
end $$;

create or replace function public.reserve_usage(
  p_user_id uuid, p_resource public.usage_resource, p_units integer,
  p_mutation_key text, p_related_id uuid default null, p_metadata jsonb default '{}'::jsonb
) returns public.usage_ledger
language sql security definer set search_path = '' as $$
  select private.reserve_usage(p_user_id, p_resource, p_units, p_mutation_key, p_related_id, p_metadata);
$$;

create or replace function public.settle_usage(
  p_user_id uuid, p_resource public.usage_resource, p_mutation_key text, p_state public.usage_state
) returns public.usage_ledger
language sql security definer set search_path = '' as $$
  select private.settle_usage(p_user_id, p_resource, p_mutation_key, p_state);
$$;

create or replace function public.get_usage_summary(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_profile public.profiles%rowtype; v_e public.plan_entitlements%rowtype;
  v_g record; v_p record; v_c record; v_gu int; v_gr int; v_pu int; v_pr int; v_cu int; v_cr int;
begin
  select * into v_profile from public.profiles where id = p_user_id;
  if v_profile.id is null then raise exception 'PROFILE_NOT_FOUND' using errcode = 'P0002'; end if;
  select * into v_e from public.plan_entitlements where plan_type = case when v_profile.plan_type='pro' then 'pro' else 'free' end;
  select * into v_g from private.usage_window('generation', v_profile.timezone);
  select * into v_p from private.usage_window('pages', v_profile.timezone);
  select * into v_c from private.usage_window('chat_message', v_profile.timezone);
  select coalesce(sum(units) filter (where state='CONSUMED'),0)::int,
         coalesce(sum(units) filter (where state='RESERVED'),0)::int into v_gu,v_gr
    from public.usage_ledger where user_id=p_user_id and resource='generation' and window_started_at=v_g.window_start;
  select coalesce(sum(units) filter (where state='CONSUMED'),0)::int,
         coalesce(sum(units) filter (where state='RESERVED'),0)::int into v_pu,v_pr
    from public.usage_ledger where user_id=p_user_id and resource='pages' and window_started_at=v_p.window_start;
  select coalesce(sum(units) filter (where state='CONSUMED'),0)::int,
         coalesce(sum(units) filter (where state='RESERVED'),0)::int into v_cu,v_cr
    from public.usage_ledger where user_id=p_user_id and resource='chat_message' and window_started_at=v_c.window_start;
  return jsonb_build_object(
    'planType',v_e.plan_type,'timezone',v_profile.timezone,
    'maxFileBytes',v_e.max_file_bytes,'maxPagesPerDocument',v_e.max_pages_per_document,
    'generation',jsonb_build_object('limit',v_e.generation_limit,'consumed',v_gu,'reserved',v_gr,'remaining',greatest(v_e.generation_limit-v_gu-v_gr,0),'resetsAt',v_g.window_end),
    'pages',jsonb_build_object('limit',v_e.page_limit,'consumed',v_pu,'reserved',v_pr,'remaining',greatest(v_e.page_limit-v_pu-v_pr,0),'resetsAt',v_p.window_end),
    'chatMessages',jsonb_build_object('limit',v_e.chat_message_limit,'consumed',v_cu,'reserved',v_cr,'remaining',greatest(v_e.chat_message_limit-v_cu-v_cr,0),'resetsAt',v_c.window_end)
  );
end $$;

create or replace function public.record_quiz_progress(
  p_user_id uuid, p_mutation_key text, p_lesson_id text,
  p_score integer, p_total_questions integer, p_xp_awarded integer, p_timezone text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_existing public.quiz_scores%rowtype; v_profile public.profiles%rowtype;
  v_local_date date; v_streak integer; v_percentage numeric(5,2); v_score_id uuid; v_xp_awarded integer;
begin
  if length(trim(p_mutation_key)) < 8 or p_total_questions <= 0 or p_total_questions > 100
     or p_score < 0 or p_score > p_total_questions then
    raise exception 'INVALID_PROGRESS_MUTATION' using errcode = '22023';
  end if;
  -- XP is calculated here so a browser cannot grant itself arbitrary points.
  v_xp_awarded := (p_score * 10) + case when p_score = p_total_questions then 20 else 0 end;
  if not exists (select 1 from pg_catalog.pg_timezone_names where name=p_timezone) then p_timezone := 'UTC'; end if;
  if not exists (select 1 from public.materials where id::text=p_lesson_id and user_id=p_user_id) then
    raise exception 'LESSON_NOT_FOUND' using errcode = 'P0002';
  end if;
  select * into v_existing from public.quiz_scores where user_id=p_user_id and mutation_key=p_mutation_key;
  if v_existing.id is not null then
    if v_existing.lesson_id<>p_lesson_id or v_existing.score<>p_score or v_existing.total_questions<>p_total_questions or v_existing.xp_awarded<>v_xp_awarded then
      raise exception 'PROGRESS_MUTATION_CONFLICT' using errcode = '23505';
    end if;
    select * into v_profile from public.profiles where id=p_user_id;
    return jsonb_build_object('idempotent',true,'scoreId',v_existing.id,'xp',v_profile.total_xp,'currentStreak',v_profile.current_streak,'highestStreak',v_profile.highest_streak,'lastStudyDate',v_profile.last_active_date);
  end if;
  select * into v_profile from public.profiles where id=p_user_id for update;
  if v_profile.id is null then raise exception 'PROFILE_NOT_FOUND' using errcode = 'P0002'; end if;
  v_local_date := (now() at time zone p_timezone)::date;
  v_streak := case when v_profile.last_active_date=v_local_date then v_profile.current_streak
    when v_profile.last_active_date=v_local_date-1 then v_profile.current_streak+1 else 1 end;
  v_percentage := round((p_score::numeric / p_total_questions::numeric) * 100, 2);
  insert into public.quiz_scores(user_id,lesson_id,score,total_questions,percentage,mutation_key,xp_awarded,learner_local_date,learner_timezone)
    values(p_user_id,p_lesson_id,p_score,p_total_questions,v_percentage,p_mutation_key,v_xp_awarded,v_local_date,p_timezone)
    returning id into v_score_id;
  update public.profiles set total_xp=total_xp+v_xp_awarded,current_streak=v_streak,
    highest_streak=greatest(highest_streak,v_streak),last_active_date=v_local_date,timezone=p_timezone
    where id=p_user_id returning * into v_profile;
  return jsonb_build_object('idempotent',false,'scoreId',v_score_id,'xpAwarded',v_xp_awarded,'xp',v_profile.total_xp,'currentStreak',v_profile.current_streak,'highestStreak',v_profile.highest_streak,'lastStudyDate',v_profile.last_active_date);
exception when unique_violation then
  select * into v_existing from public.quiz_scores where user_id=p_user_id and mutation_key=p_mutation_key;
  if v_existing.lesson_id=p_lesson_id and v_existing.score=p_score and v_existing.total_questions=p_total_questions and v_existing.xp_awarded=v_xp_awarded then
    select * into v_profile from public.profiles where id=p_user_id;
    return jsonb_build_object('idempotent',true,'scoreId',v_existing.id,'xp',v_profile.total_xp,'currentStreak',v_profile.current_streak,'highestStreak',v_profile.highest_streak,'lastStudyDate',v_profile.last_active_date);
  end if;
  raise exception 'PROGRESS_MUTATION_CONFLICT' using errcode = '23505';
end $$;

-- Rewire Phase 2 reservations to the ledger while retaining legacy projections.
create or replace function public.reserve_and_queue_material(p_user_id uuid,p_attempt_id uuid,p_page_count integer)
returns table(material_id uuid,attempt_id uuid,plan_type text,queue_status text)
language plpgsql security definer set search_path='' as $$
declare v_attempt public.processing_attempts%rowtype; v_profile public.profiles%rowtype; v_e public.plan_entitlements%rowtype;
begin
  select * into v_attempt from public.processing_attempts where id=p_attempt_id and user_id=p_user_id for update;
  if v_attempt.id is null then raise exception 'ATTEMPT_NOT_FOUND' using errcode='P0002'; end if;
  if v_attempt.status in ('QUEUED','RUNNING','COMPLETED') then
    select * into v_profile from public.profiles where id=p_user_id;
    return query select v_attempt.material_id,v_attempt.id,v_profile.plan_type,v_attempt.status::text; return;
  end if;
  if v_attempt.status<>'REGISTERED' then raise exception 'ATTEMPT_NOT_QUEUEABLE' using errcode='23514'; end if;
  select * into v_profile from public.profiles where id=p_user_id for update;
  select e.* into v_e from public.plan_entitlements e where e.plan_type=case when v_profile.plan_type='pro' then 'pro' else 'free' end;
  if p_page_count<=0 or p_page_count>v_e.max_pages_per_document then raise exception 'DOCUMENT_PAGE_LIMIT' using errcode='P0001'; end if;
  perform private.reserve_usage(p_user_id,'generation',1,p_attempt_id::text||':generation',p_attempt_id,jsonb_build_object('materialId',v_attempt.material_id));
  perform private.reserve_usage(p_user_id,'pages',p_page_count,p_attempt_id::text||':pages',p_attempt_id,jsonb_build_object('materialId',v_attempt.material_id));
  update public.processing_attempts set status='QUEUED',page_count=p_page_count,reserved_pages=p_page_count,generation_reserved=true,heartbeat_at=now(),failure_code=null,failure_message=null where id=p_attempt_id;
  update public.materials set status='QUEUED',page_count=p_page_count,failure_code=null,failure_message=null where id=v_attempt.material_id;
  update public.profiles set generation_count=generation_count+1 where id=p_user_id;
  update public.user_usage set weekly_pages_used=weekly_pages_used+p_page_count where user_id=p_user_id;
  return query select v_attempt.material_id,v_attempt.id,v_profile.plan_type,'QUEUED'::text;
end $$;

create or replace function public.set_processing_attempt_state(p_attempt_id uuid,p_status public.processing_attempt_status,p_failure_code text default null,p_failure_message text default null,p_retryable boolean default false,p_event_id text default null)
returns void language plpgsql security definer set search_path='' as $$
declare v_attempt public.processing_attempts%rowtype; v_material_status public.material_status; v_usage_state public.usage_state;
begin
  select * into v_attempt from public.processing_attempts where id=p_attempt_id for update;
  if v_attempt.id is null then raise exception 'ATTEMPT_NOT_FOUND' using errcode='P0002'; end if;
  if v_attempt.status in ('COMPLETED','FAILED','CANCELLED','DEAD_LETTER') then return; end if;
  if p_status='COMPLETED' then v_usage_state:='CONSUMED';
  elsif p_status in ('FAILED','CANCELLED','DEAD_LETTER') then v_usage_state:='REFUNDED'; end if;
  if v_usage_state is not null and v_attempt.generation_reserved then
    perform private.settle_usage(v_attempt.user_id,'generation',p_attempt_id::text||':generation',v_usage_state);
    perform private.settle_usage(v_attempt.user_id,'pages',p_attempt_id::text||':pages',v_usage_state);
    if v_usage_state='REFUNDED' and v_attempt.quota_released_at is null then
      update public.profiles set generation_count=greatest(generation_count-1,0) where id=v_attempt.user_id;
      update public.user_usage set weekly_pages_used=greatest(weekly_pages_used-v_attempt.reserved_pages,0) where user_id=v_attempt.user_id;
    end if;
  end if;
  update public.processing_attempts set status=p_status,event_id=coalesce(p_event_id,event_id),heartbeat_at=now(),
    started_at=case when p_status='RUNNING' then coalesce(started_at,now()) else started_at end,
    finished_at=case when p_status in ('COMPLETED','FAILED','CANCELLED','DEAD_LETTER') then now() else finished_at end,
    failure_code=p_failure_code,failure_message=left(p_failure_message,1000),retryable=p_retryable,
    quota_released_at=case when v_usage_state='REFUNDED' then coalesce(quota_released_at,now()) else quota_released_at end where id=p_attempt_id;
  v_material_status:=case p_status when 'COMPLETED' then 'COMPLETED'::public.material_status when 'FAILED' then 'FAILED'::public.material_status when 'CANCELLED' then 'CANCELLED'::public.material_status when 'DEAD_LETTER' then 'FAILED'::public.material_status else null end;
  if v_material_status is not null then update public.materials set status=v_material_status,failure_code=p_failure_code,failure_message=left(p_failure_message,1000) where id=v_attempt.material_id; end if;
end $$;

revoke update (total_xp,current_streak,last_active_date) on public.profiles from authenticated;
revoke insert on public.quiz_scores from authenticated;
drop policy if exists quiz_scores_insert_own on public.quiz_scores;
revoke all on function public.reserve_usage(uuid,public.usage_resource,integer,text,uuid,jsonb) from public,anon,authenticated;
revoke all on function public.settle_usage(uuid,public.usage_resource,text,public.usage_state) from public,anon,authenticated;
revoke all on function public.get_usage_summary(uuid) from public,anon,authenticated;
revoke all on function public.record_quiz_progress(uuid,text,text,integer,integer,integer,text) from public,anon,authenticated;
grant execute on function public.reserve_usage(uuid,public.usage_resource,integer,text,uuid,jsonb) to service_role;
grant execute on function public.settle_usage(uuid,public.usage_resource,text,public.usage_state) to service_role;
grant execute on function public.get_usage_summary(uuid) to service_role;
grant execute on function public.record_quiz_progress(uuid,text,text,integer,integer,integer,text) to service_role;
