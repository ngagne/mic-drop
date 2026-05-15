import { DEFAULT_RETRY_OPTIONS } from '../constants';

export interface RetryOptions {
  retries?: number;
  delayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  jitterMs?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number, nextDelayMs: number) => void | Promise<void>;
  signal?: AbortSignal;
}

const toError = (value: unknown): Error => {
  if (value instanceof Error) {
    return value;
  }

  if (typeof value === 'string') {
    return new Error(value);
  }

  if (value === undefined || value === null) {
    return new Error('Operation aborted');
  }

  return new Error('Operation aborted');
};

export const sleep = async (delayMs: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    const abortSignal = signal;

    if (abortSignal?.aborted) {
      reject(toError(abortSignal.reason));
      return;
    }

    const timeout = setTimeout(() => {
      abortSignal?.removeEventListener('abort', onAbort);
      resolve();
    }, Math.max(0, delayMs));

    const onAbort = () => {
      clearTimeout(timeout);
      reject(toError(abortSignal?.reason));
    };

    abortSignal?.addEventListener('abort', onAbort, { once: true });
  });

const getJitter = (jitterMs: number): number => (jitterMs <= 0 ? 0 : Math.floor(Math.random() * jitterMs));

export const retry = async <T>(
  operation: (attempt: number) => Promise<T> | T,
  options: RetryOptions = {}
): Promise<T> => {
  const retries = options.retries ?? DEFAULT_RETRY_OPTIONS.retries;
  const delayMs = options.delayMs ?? DEFAULT_RETRY_OPTIONS.delayMs;
  const maxDelayMs = options.maxDelayMs ?? DEFAULT_RETRY_OPTIONS.maxDelayMs;
  const backoffMultiplier = options.backoffMultiplier ?? DEFAULT_RETRY_OPTIONS.backoffMultiplier;
  const jitterMs = options.jitterMs ?? DEFAULT_RETRY_OPTIONS.jitterMs;

  let currentDelay = delayMs;

  for (let attempt = 1; attempt <= retries + 1; attempt += 1) {
    options.signal?.throwIfAborted();

    try {
      return await operation(attempt);
    } catch (error) {
      const canRetry = attempt <= retries && (options.shouldRetry ? options.shouldRetry(error, attempt) : true);
      if (!canRetry) {
        throw error;
      }

      const nextDelay = Math.min(currentDelay + getJitter(jitterMs), maxDelayMs);
      await options.onRetry?.(error, attempt, nextDelay);
      await sleep(nextDelay, options.signal);
      currentDelay = Math.min(Math.ceil(currentDelay * backoffMultiplier), maxDelayMs);
    }
  }

  throw new Error('Retry execution failed unexpectedly');
};
