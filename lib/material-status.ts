export const MATERIAL_STATUSES = [
  'UPLOADED',
  'QUEUED',
  'PARSING_DOCUMENT',
  'GENERATING_SUMMARY',
  'BUILDING_ASSESSMENTS',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
] as const;

export type MaterialStatus = (typeof MATERIAL_STATUSES)[number];

export const TERMINAL_MATERIAL_STATUSES = [
  'COMPLETED',
  'FAILED',
  'CANCELLED',
] as const satisfies readonly MaterialStatus[];

const LEGACY_STATUS_MAP: Record<string, MaterialStatus> = {
  PROCESSING: 'QUEUED',
  PARSING: 'PARSING_DOCUMENT',
  EXTRACTING: 'PARSING_DOCUMENT',
  GENERATING: 'GENERATING_SUMMARY',
  FINALIZING: 'BUILDING_ASSESSMENTS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
};

export function normalizeMaterialStatus(value: unknown): MaterialStatus {
  const normalized = String(value ?? '').trim().toUpperCase();
  if ((MATERIAL_STATUSES as readonly string[]).includes(normalized)) {
    return normalized as MaterialStatus;
  }
  return LEGACY_STATUS_MAP[normalized] ?? 'UPLOADED';
}

export function isTerminalMaterialStatus(value: unknown): boolean {
  const status = normalizeMaterialStatus(value);
  return (TERMINAL_MATERIAL_STATUSES as readonly string[]).includes(status);
}
