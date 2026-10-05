import { NextResponse } from 'next/server';

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    requestId?: string;
  };
}

export function apiError(
  status: number,
  code: string,
  message: string,
  requestId?: string,
) {
  return NextResponse.json<ApiErrorBody>(
    { error: { code, message, ...(requestId ? { requestId } : {}) } },
    { status, headers: requestId ? { 'x-request-id': requestId, 'Cache-Control': 'no-store' } : undefined },
  );
}
