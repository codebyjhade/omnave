import 'server-only';

import crypto from 'crypto';
import { supabaseServer } from '@/utils/supabase/server-backend';

type Source = 'api' | 'job' | 'ai' | 'database' | 'sync';
type Severity = 'info' | 'warning' | 'error';
type Status = 'started' | 'succeeded' | 'failed' | 'refunded' | 'conflict' | 'recovered';

export interface OperationalEvent {
  correlationId: string;
  source: Source;
  eventName: string;
  severity?: Severity;
  status?: Status;
  userId?: string;
  materialId?: string;
  attemptId?: string;
  durationMs?: number;
  errorCode?: string;
  metadata?: Record<string, unknown>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BLOCKED_KEYS = /authorization|cookie|token|secret|password|api.?key|content|text|summary|message|email/i;

export function getCorrelationId(request?: Request) {
  const supplied = request?.headers.get('x-request-id')?.trim();
  return supplied && UUID.test(supplied) ? supplied : crypto.randomUUID();
}

function safeMetadata(value: Record<string, unknown> | undefined) {
  if (!value) return {};
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !BLOCKED_KEYS.test(key))
    .slice(0, 24)
    .map(([key, item]) => {
      if (typeof item === 'string') return [key, item.slice(0, 160)];
      if (typeof item === 'number' || typeof item === 'boolean' || item === null) return [key, item];
      return [key, '[omitted]'];
    }));
}

export async function recordOperationalEvent(event: OperationalEvent) {
  const severity = event.severity ?? 'info';
  const metadata = safeMetadata(event.metadata);
  const consoleEntry = {
    timestamp: new Date().toISOString(),
    correlationId: event.correlationId,
    source: event.source,
    event: event.eventName,
    severity,
    status: event.status,
    durationMs: event.durationMs,
    errorCode: event.errorCode,
    metadata,
  };
  (severity === 'error' ? console.error : severity === 'warning' ? console.warn : console.info)(JSON.stringify(consoleEntry));

  const { error } = await supabaseServer.rpc('record_operational_event', {
    p_correlation_id: event.correlationId,
    p_source: event.source,
    p_event_name: event.eventName,
    p_severity: severity,
    p_status: event.status,
    p_user_id: event.userId,
    p_material_id: event.materialId,
    p_attempt_id: event.attemptId,
    p_duration_ms: event.durationMs,
    p_error_code: event.errorCode,
    p_metadata: metadata,
  });
  if (error) console.error(JSON.stringify({ ...consoleEntry, event: 'telemetry.write_failed', errorCode: 'TELEMETRY_WRITE_FAILED' }));
}

export function correlationHeaders(correlationId: string) {
  return { 'x-request-id': correlationId, 'Cache-Control': 'no-store' };
}
