-- Omnave Phase 5.1: privacy-safe operational telemetry and health summaries.

create table if not exists public.operational_events (
  id bigint generated always as identity primary key,
  correlation_id uuid not null,
  user_id uuid references auth.users(id) on delete set null,
  material_id uuid references public.materials(id) on delete set null,
  attempt_id uuid references public.processing_attempts(id) on delete set null,
  source text not null check (source in ('api', 'job', 'ai', 'database', 'sync')),
  event_name text not null check (event_name ~ '^[a-z0-9_.-]{3,80}$'),
  severity text not null check (severity in ('info', 'warning', 'error')),
  status text check (status in ('started', 'succeeded', 'failed', 'refunded', 'conflict', 'recovered')),
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  error_code text check (error_code is null or error_code ~ '^[A-Z0-9_]{3,80}$'),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (pg_column_size(metadata) <= 8192)
);

create index if not exists operational_events_correlation_idx
  on public.operational_events (correlation_id, created_at);
create index if not exists operational_events_attempt_idx
  on public.operational_events (attempt_id, created_at) where attempt_id is not null;
create index if not exists operational_events_failures_idx
  on public.operational_events (created_at desc, event_name)
  where severity in ('warning', 'error');
create index if not exists operational_events_user_created_idx
  on public.operational_events (user_id, created_at desc) where user_id is not null;

alter table public.operational_events enable row level security;
revoke all on table public.operational_events from public, anon, authenticated;

create or replace function public.record_operational_event(
  p_correlation_id uuid,
  p_source text,
  p_event_name text,
  p_severity text,
  p_status text default null,
  p_user_id uuid default null,
  p_material_id uuid default null,
  p_attempt_id uuid default null,
  p_duration_ms integer default null,
  p_error_code text default null,
  p_metadata jsonb default '{}'::jsonb
) returns bigint
language plpgsql security definer set search_path = '' as $$
declare v_id bigint;
begin
  insert into public.operational_events (
    correlation_id, source, event_name, severity, status, user_id,
    material_id, attempt_id, duration_ms, error_code, metadata
  ) values (
    p_correlation_id, p_source, p_event_name, p_severity, p_status, p_user_id,
    p_material_id, p_attempt_id, p_duration_ms, p_error_code, coalesce(p_metadata, '{}'::jsonb)
  ) returning id into v_id;
  return v_id;
end $$;

create or replace function public.get_operational_health(p_hours integer default 24)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_since timestamptz; v_oldest_queue_minutes numeric;
begin
  p_hours := greatest(1, least(coalesce(p_hours, 24), 168));
  v_since := now() - make_interval(hours => p_hours);
  select coalesce(extract(epoch from (now() - min(created_at))) / 60, 0)
    into v_oldest_queue_minutes
    from public.processing_attempts where status in ('QUEUED', 'RUNNING');

  return jsonb_build_object(
    'windowHours', p_hours,
    'generatedAt', now(),
    'jobs', (
      select jsonb_build_object(
        'total', count(*),
        'completed', count(*) filter (where status='COMPLETED'),
        'failed', count(*) filter (where status in ('FAILED','DEAD_LETTER')),
        'active', count(*) filter (where status in ('QUEUED','RUNNING')),
        'successRate', round(100 * count(*) filter (where status='COMPLETED')::numeric / nullif(count(*) filter (where status in ('COMPLETED','FAILED','DEAD_LETTER')),0), 2),
        'oldestActiveMinutes', round(v_oldest_queue_minutes, 1)
      ) from public.processing_attempts where created_at >= v_since
    ),
    'ai', (
      select jsonb_build_object(
        'runs', count(*),
        'failures', count(*) filter (where status='FAILED'),
        'successRate', round(100 * count(*) filter (where status='SUCCEEDED')::numeric / nullif(count(*),0), 2),
        'averageLatencyMs', round(avg(duration_ms), 0),
        'estimatedCostUsd', round(coalesce(sum(estimated_cost_usd),0), 6),
        'fallbackRuns', count(*) filter (where provider <> 'gemini')
      ) from public.ai_generation_runs where created_at >= v_since
    ),
    'operations', (
      select jsonb_build_object(
        'events', count(*),
        'warnings', count(*) filter (where severity='warning'),
        'errors', count(*) filter (where severity='error'),
        'syncConflicts', count(*) filter (where status='conflict')
      ) from public.operational_events where created_at >= v_since
    ),
    'alerts', jsonb_build_array(
      case when v_oldest_queue_minutes >= 60 then jsonb_build_object('code','STUCK_JOB','severity','critical','value',round(v_oldest_queue_minutes,1),'threshold',60) end,
      case when (select count(*) from public.processing_attempts where created_at>=v_since and status in ('FAILED','DEAD_LETTER')) >= 5 then jsonb_build_object('code','JOB_FAILURE_SPIKE','severity','warning','threshold',5) end,
      case when (select count(*) from public.ai_generation_runs where created_at>=v_since and status='FAILED') >= 10 then jsonb_build_object('code','AI_FAILURE_SPIKE','severity','warning','threshold',10) end
    )
  );
end $$;

create or replace function public.purge_expired_operational_data(
  p_event_retention_days integer default 90,
  p_ai_retention_days integer default 180
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_events integer; v_ai integer;
begin
  p_event_retention_days := greatest(30, least(coalesce(p_event_retention_days,90),365));
  p_ai_retention_days := greatest(90, least(coalesce(p_ai_retention_days,180),730));
  delete from public.operational_events where created_at < now() - make_interval(days => p_event_retention_days);
  get diagnostics v_events = row_count;
  delete from public.ai_generation_runs where created_at < now() - make_interval(days => p_ai_retention_days);
  get diagnostics v_ai = row_count;
  return jsonb_build_object('operationalEventsDeleted',v_events,'aiRunsDeleted',v_ai,'completedAt',now());
end $$;

revoke all on function public.record_operational_event(uuid,text,text,text,text,uuid,uuid,uuid,integer,text,jsonb) from public,anon,authenticated;
revoke all on function public.get_operational_health(integer) from public,anon,authenticated;
revoke all on function public.purge_expired_operational_data(integer,integer) from public,anon,authenticated;
grant execute on function public.record_operational_event(uuid,text,text,text,text,uuid,uuid,uuid,integer,text,jsonb) to service_role;
grant execute on function public.get_operational_health(integer) to service_role;
grant execute on function public.purge_expired_operational_data(integer,integer) to service_role;

