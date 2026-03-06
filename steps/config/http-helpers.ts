// Helpers for HTTP request/response handling in Motia steps

const CORS_HEADERS = { 'Access-Control-Allow-Origin': '*' } as const

/** Build a JSON HTTP response with CORS headers */
export function jsonResponse(status: number, body: Record<string, unknown>) {
  return { status, headers: CORS_HEADERS, body }
}

/** Extract POST body from Motia's wrapped request object */
export function getBody<T = Record<string, unknown>>(request: unknown): T {
  const req = request as any
  return (req.request?.body ?? req.body ?? {}) as T
}

/** Extract query params from Motia's wrapped request object */
export function getQueryParams(request: unknown): Record<string, string> {
  const req = request as any
  return (req.request?.queryParams ?? req.queryParams ?? {}) as Record<string, string>
}
