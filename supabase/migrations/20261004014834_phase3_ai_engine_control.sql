-- Omnave Phase 3: traceable AI provider execution and quality metadata.

alter table public.materials add column if not exists generation_metadata jsonb;

create table if not exists public.ai_generation_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid references public.materials(id) on delete cascade,
  attempt_id uuid references public.processing_attempts(id) on delete cascade,
  stage text not null check (stage in ('overview', 'assessments', 'chat')),
  prompt_version text not null,
  schema_version text not null,
  provider text not null check (provider in ('gemini', 'groq', 'openai')),
  model text not null,
  provider_attempt integer not null check (provider_attempt > 0),
  status text not null check (status in ('SUCCEEDED', 'FAILED')),
  input_characters integer not null default 0 check (input_characters >= 0),
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  duration_ms integer not null check (duration_ms >= 0),
  estimated_cost_usd numeric(12,8) check (estimated_cost_usd is null or estimated_cost_usd >= 0),
  quality jsonb,
  error_code text,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists ai_generation_runs_attempt_stage_idx
  on public.ai_generation_runs (attempt_id, stage, created_at);
create index if not exists ai_generation_runs_user_created_idx
  on public.ai_generation_runs (user_id, created_at desc);
create index if not exists ai_generation_runs_provider_status_idx
  on public.ai_generation_runs (provider, model, status, created_at desc);

alter table public.ai_generation_runs enable row level security;
revoke all on table public.ai_generation_runs from anon, authenticated;
grant select on table public.ai_generation_runs to authenticated;

drop policy if exists ai_generation_runs_select_own on public.ai_generation_runs;
create policy ai_generation_runs_select_own on public.ai_generation_runs
for select to authenticated
using ((select auth.uid()) = user_id);
