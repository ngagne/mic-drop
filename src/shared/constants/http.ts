export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const;

export type HttpMethod = (typeof HTTP_METHODS)[number];

export const RETRYABLE_STATUS_CODES = [408, 425, 429, 500, 502, 503, 504] as const;
export const DEFAULT_RETRY_OPTIONS = {
  retries: 3,
  delayMs: 100,
  backoffMultiplier: 2,
  maxDelayMs: 5_000,
  jitterMs: 0
} as const;

export const DEFAULT_POLL_OPTIONS = {
  intervalMs: 200,
  timeoutMs: 10_000
} as const;
