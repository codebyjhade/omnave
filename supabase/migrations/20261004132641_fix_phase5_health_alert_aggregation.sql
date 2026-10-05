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

revoke all on function public.get_operational_health(integer) from public,anon,authenticated;
grant execute on function public.get_operational_health(integer) to service_role;

