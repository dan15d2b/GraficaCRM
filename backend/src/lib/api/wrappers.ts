/**
 * Wrappers canônicos de API (sucesso e erro).
 */

import { randomUUID } from "node:crypto";

// -----------------------------------------------------------------------------
// Tipos públicos
// -----------------------------------------------------------------------------

export type CursorMeta = {
  cursor?: string | null;
  hasMore?: boolean;
  total?: number | null;
};

export type ApiSuccess<T> = {
  data: T;
  meta?: CursorMeta & Record<string, unknown>;
};

export type ApiError = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

type OkOptions = {
  status?: 200 | 201 | 204;
  meta?: ApiSuccess<unknown>["meta"];
  requestId?: string;
};

export function ok<T>(data: T, opts: OkOptions = {}): Response {
  const { status = 200, meta, requestId } = opts;
  const body: ApiSuccess<T> = meta ? { data, meta } : { data };

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Request-Id": requestId ?? randomUUID(),
    },
  });
}

type FailOptions = {
  details?: unknown;
  requestId?: string;
};

export function fail(
  code: string,
  message: string,
  status: number,
  opts: FailOptions = {}
): Response {
  const body: ApiError = {
    error: {
      code,
      message,
      ...(opts.details !== undefined ? { details: opts.details } : {}),
    },
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Request-Id": opts.requestId ?? randomUUID(),
    },
  });
}

// -----------------------------------------------------------------------------
// Atalhos comuns
// -----------------------------------------------------------------------------

export const noContent = (requestId?: string) => {
  return new Response(null, {
    status: 204,
    headers: { "X-Request-Id": requestId ?? randomUUID() },
  });
};