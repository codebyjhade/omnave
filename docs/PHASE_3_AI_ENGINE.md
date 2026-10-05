# Phase 3 — AI engine quality and provider control

## Active provider policy

| Plan | Primary | Fallback | Paid fallback |
|---|---|---|---|
| Free | Gemini `gemini-3.7-flash` | Groq `openai/gpt-oss-20b` | Never |
| Pro | Gemini `gemini-3.7-flash` | Groq `openai/gpt-oss-20b` | OpenAI `gpt-6-luna`, only when `AI_ALLOW_PAID_FALLBACK=true` |

The previous eight-provider waterfall and its obsolete model IDs were removed. A provider is skipped when its key is absent or `AI_DISABLE_<PROVIDER>=true`.

Set `AI_ENGINE_ENABLED=false` as the global emergency stop. Paid OpenAI fallback is disabled by default.

## Generation pipeline

1. Ingestion supplies validated text and a durable processing-attempt ID.
2. The engine applies a source budget of 100,000 characters for Free and 300,000 for Pro.
3. Overview generation produces one grounded title and Markdown summary from source text only.
4. Assessment generation uses combined flashcard and quiz batches, reducing provider requests by half compared with the previous implementation.
5. Free processing uses at most four 12,000-character assessment chunks; Pro uses at most eight.
6. Every provider output is parsed and validated. Placeholder content, duplicate cards, duplicate questions, duplicate options, invalid answer mappings, and empty assets are rejected.
7. Partial completion is accepted only when at least 75% of source chunks succeed and at least 60% of requested cards and quizzes survive deduplication.
8. The material stores prompt/schema versions, source truncation, chunk coverage, and partial-completion state.

## Traceability

`ai_generation_runs` records each provider attempt with:

- user, material, attempt, and generation stage
- prompt and schema versions
- provider and pinned model
- input size and reported token usage
- duration and estimated provider cost where known
- success/failure and structured error code
- quality result

Users can read only their own telemetry through RLS. Writes remain server-only.

## Retry and failure behavior

- Each engine call tries each configured provider at most once.
- The durable Inngest job retries twice after stage failure.
- Exhausted jobs enter the Phase 2 dead-letter state and release reserved quota.
- Schema-invalid content is treated as a provider failure; fabricated placeholder data is never inserted.

## Current official model basis

- Gemini `gemini-3.7-flash` is a stable model with structured-output support.
- Groq `openai/gpt-oss-20b` is a production model and supports strict structured outputs.
- OpenAI uses the Responses API structured-output format and is restricted to explicitly enabled paid fallback.
