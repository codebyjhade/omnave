import { inngest } from "./client";
import { supabaseServer } from "@/utils/supabase/server-backend";
import {
  AI_PROMPT_VERSION,
  AI_SCHEMA_VERSION,
  generateAssessments,
  generateOverview,
} from "@/lib/ai-engine";
import { chunkText } from "@/utils/text-chunker";
import type { Json } from "@/types/database";
import { recordOperationalEvent } from "@/lib/observability";
import crypto from 'crypto';

function buildRepresentativeSource(source: string, segmentSize = 12_000, maxSegments = 3): string {
  const allSegments = chunkText(source, segmentSize);
  if (allSegments.length <= maxSegments) return allSegments.join('\n\n');

  const selectedIndexes = Array.from({ length: maxSegments }, (_, index) =>
    Math.round((index * (allSegments.length - 1)) / (maxSegments - 1)),
  );
  return [...new Set(selectedIndexes)]
    .map((index) => allSegments[index])
    .join('\n\n[DOCUMENT SECTION]\n\n');
}

export const processMaterial = inngest.createFunction(
  { 
    id: "process-study-material", 
    triggers: [{ event: "ai/process.material" }],
    singleton: { key: "event.data.attemptId", mode: "skip" },
    cancelOn: [
      {
        event: "ai/process.cancel",
        match: "data.materialId"
      }
    ],
    retries: 2,
    onFailure: async ({ event, error }) => {
      const original = event.data.event.data as { attemptId?: string; materialId?: string; userId?: string; correlationId?: string };
      if (!original.attemptId) return;
      await supabaseServer.rpc("set_processing_attempt_state", {
        p_attempt_id: original.attemptId,
        p_status: "DEAD_LETTER",
        p_failure_code: "PROCESSING_RETRIES_EXHAUSTED",
        p_failure_message: error.message,
        p_retryable: false,
        p_event_id: event.data.run_id,
      });
      await recordOperationalEvent({
        correlationId: original.correlationId || crypto.randomUUID(), source: 'job',
        eventName: 'material.processing', severity: 'error', status: 'failed',
        userId: original.userId, materialId: original.materialId, attemptId: original.attemptId,
        errorCode: 'PROCESSING_RETRIES_EXHAUSTED',
      });
    },
  },
  async ({ event, step, runId }) => {
    const { materialId, attemptId, text, planType = "free", userId, correlationId = crypto.randomUUID() } = event.data;
    const normalizedPlan = planType === "pro" || planType === "paid" ? "pro" : "free";
    const sourceBudget = normalizedPlan === "pro" ? 300_000 : 100_000;
    const source = String(text ?? "").slice(0, sourceBudget);
    const jobStartedAt = performance.now();

    try {
      await recordOperationalEvent({ correlationId, source: 'job', eventName: 'material.processing', status: 'started', userId, materialId, attemptId, metadata: { runId } });
      await step.run("mark-attempt-running", async () => {
        if (!attemptId) throw new Error("Missing durable processing attempt ID");
        if (!userId) throw new Error("Missing job owner ID");
        const { error } = await supabaseServer.rpc("set_processing_attempt_state", {
          p_attempt_id: attemptId,
          p_status: "RUNNING",
          p_event_id: runId,
        });
        if (error) throw new Error(`Attempt start failed: ${error.message}`);
      });

      // Granular Status 1: PARSING_DOCUMENT (10% progress)
      await step.run("status-parsing-document", async () => {
        const { error } = await supabaseServer
          .from("materials")
          .update({ status: "PARSING_DOCUMENT" })
          .eq("id", materialId);
        if (error) throw new Error(`Parsing update failed: ${error.message}`);
        await supabaseServer
          .from("processing_attempts")
          .update({ heartbeat_at: new Date().toISOString() })
          .eq("id", attemptId);
      });

      // Granular Status 2: GENERATING_SUMMARY (40% progress)
      const overview = await step.run("generate-overview", async () => {
        const { error } = await supabaseServer
          .from("materials")
          .update({ status: "GENERATING_SUMMARY" })
          .eq("id", materialId);
        if (error) throw new Error(`Summary status update failed: ${error.message}`);
        await supabaseServer
          .from("processing_attempts")
          .update({ heartbeat_at: new Date().toISOString() })
          .eq("id", attemptId);

        return generateOverview(
          { userId, materialId, attemptId, planType: normalizedPlan, correlationId },
          source.slice(0, 60_000),
        );
      });

      // Granular Status 3: BUILDING_ASSESSMENTS (75% progress)
      const assessments = await step.run("generate-assessments", async () => {
        const { error } = await supabaseServer
          .from("materials")
          .update({ status: "BUILDING_ASSESSMENTS" })
          .eq("id", materialId);
        if (error) throw new Error(`Assessments status update failed: ${error.message}`);
        await supabaseServer
          .from("processing_attempts")
          .update({ heartbeat_at: new Date().toISOString() })
          .eq("id", attemptId);

        const isPro = normalizedPlan === "pro";
        const maxChunks = 8;
        const chunks = isPro
          ? chunkText(source, 12_000).slice(0, maxChunks)
          : [buildRepresentativeSource(source)];
        const numChunks = Math.max(1, chunks.length);

        const targetCardsTotal = isPro ? 80 : 25;
        const targetQuizTotal = isPro ? 80 : 25;
        const cardsPerChunk = Math.ceil(targetCardsTotal / numChunks);
        const quizPerChunk = Math.ceil(targetQuizTotal / numChunks);
        const settled = await Promise.allSettled(chunks.map((chunkContent) =>
          generateAssessments(
            { userId, materialId, attemptId, planType: normalizedPlan, correlationId },
            chunkContent,
            cardsPerChunk,
            quizPerChunk,
          ),
        ));
        const completed = settled
          .filter((result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof generateAssessments>>> => result.status === "fulfilled")
          .map((result) => result.value);
        if (completed.length / numChunks < 0.75) throw new Error("QUALITY_INSUFFICIENT_SOURCE_COVERAGE");

        const uniqueCards = new Map<string, { front: string; back: string }>();
        const uniqueQuizzes = new Map<string, { question: string; options: string[]; correctAnswer: string; explanation: string }>();
        completed.flatMap((batch) => batch.flashcards).forEach((card) => uniqueCards.set(card.front.toLowerCase(), card));
        completed.flatMap((batch) => batch.quizzes).forEach((quiz) => uniqueQuizzes.set(quiz.question.toLowerCase(), quiz));
        const flashcards = [...uniqueCards.values()].slice(0, targetCardsTotal);
        const quizzes = [...uniqueQuizzes.values()].slice(0, targetQuizTotal);
        if (flashcards.length < Math.ceil(targetCardsTotal * 0.6) || quizzes.length < Math.ceil(targetQuizTotal * 0.6)) {
          throw new Error("QUALITY_INSUFFICIENT_ASSESSMENTS");
        }

        return {
          flashcards,
          quizzes,
          completedChunks: completed.length,
          totalChunks: numChunks,
          strategy: isPro ? 'multi-section' : 'single-request-representative',
        };
      });

      await step.run("save-to-database", async () => {
        const { error } = await supabaseServer
          .from("materials")
          .update({
            title: overview.title,
            summary: overview.summary,
            flashcards: assessments.flashcards as unknown as Json[],
            quizzes: assessments.quizzes as unknown as Json[],
            generation_metadata: {
              promptVersion: AI_PROMPT_VERSION,
              schemaVersion: AI_SCHEMA_VERSION,
              sourceCharacters: source.length,
              sourceTruncated: String(text ?? "").length > source.length,
              completedChunks: assessments.completedChunks,
              totalChunks: assessments.totalChunks,
              partial: assessments.completedChunks < assessments.totalChunks,
              assessmentStrategy: assessments.strategy,
            }
          })
          .eq("id", materialId);

        if (error) {
          throw new Error(`Database final update failed: ${error.message}`);
        }
      });

      await step.run("complete-processing-attempt", async () => {
        const { error } = await supabaseServer.rpc("set_processing_attempt_state", {
          p_attempt_id: attemptId,
          p_status: "COMPLETED",
          p_event_id: runId,
        });
        if (error) throw new Error(`Attempt completion failed: ${error.message}`);
      });

      await recordOperationalEvent({ correlationId, source: 'job', eventName: 'material.processing', status: 'succeeded', userId, materialId, attemptId, durationMs: Math.round(performance.now() - jobStartedAt), metadata: { runId, plan: normalizedPlan } });

      return { success: true, materialId, attemptId, policy: normalizedPlan };
    } catch (err) {
      await recordOperationalEvent({ correlationId, source: 'job', eventName: 'material.processing', severity: 'error', status: 'failed', userId, materialId, attemptId, durationMs: Math.round(performance.now() - jobStartedAt), errorCode: err instanceof Error && /^[A-Z0-9_]+$/.test(err.message) ? err.message : 'PROCESSING_ATTEMPT_FAILED', metadata: { runId } });
      throw err;
    }
  }
);

export const monitorOperationalHealth = inngest.createFunction(
  { id: 'monitor-operational-health', triggers: [{ cron: '*/10 * * * *' }], retries: 1 },
  async () => {
    const { data, error } = await supabaseServer.rpc('get_operational_health', { p_hours: 24 });
    if (error) throw new Error(`Operational health query failed: ${error.message}`);
    const health = data as { alerts?: unknown[] } | null;
    const alerts = Array.isArray(health?.alerts) ? health.alerts.filter(Boolean) : [];
    if (alerts.length) console.error(JSON.stringify({ timestamp: new Date().toISOString(), source: 'monitor', event: 'operational.alerts', alerts }));
    return { alerts: alerts.length, health: data };
  },
);

export const purgeOperationalData = inngest.createFunction(
  { id: 'purge-operational-data', triggers: [{ cron: '0 3 * * 0' }], retries: 1 },
  async () => {
    const { data, error } = await supabaseServer.rpc('purge_expired_operational_data', { p_event_retention_days: 90, p_ai_retention_days: 180 });
    if (error) throw new Error(`Operational retention failed: ${error.message}`);
    return data;
  },
);

export const recoverStaleMaterialJobs = inngest.createFunction(
  {
    id: "recover-stale-material-jobs",
    triggers: [{ cron: "*/15 * * * *" }],
    retries: 1,
  },
  async ({ step }) => {
    const staleBefore = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const staleAttempts = await step.run("find-stale-attempts", async () => {
      const { data, error } = await supabaseServer
        .from("processing_attempts")
        .select("id")
        .in("status", ["QUEUED", "RUNNING"])
        .lt("heartbeat_at", staleBefore)
        .limit(100);
      if (error) throw new Error(`Stale job lookup failed: ${error.message}`);
      return data ?? [];
    });

    for (const attempt of staleAttempts) {
      await step.run(`dead-letter-${attempt.id}`, async () => {
        const { error } = await supabaseServer.rpc("set_processing_attempt_state", {
          p_attempt_id: attempt.id,
          p_status: "DEAD_LETTER",
          p_failure_code: "STALE_PROCESSING_JOB",
          p_failure_message: "The processing job stopped reporting progress and was closed automatically",
          p_retryable: true,
        });
        if (error) throw new Error(`Stale job recovery failed: ${error.message}`);
      });
    }

    return { recovered: staleAttempts.length };
  },
);
