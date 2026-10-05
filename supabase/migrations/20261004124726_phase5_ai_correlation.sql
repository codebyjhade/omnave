alter table public.ai_generation_runs add column if not exists correlation_id uuid;
create index if not exists ai_generation_runs_correlation_idx
  on public.ai_generation_runs (correlation_id, created_at)
  where correlation_id is not null;
