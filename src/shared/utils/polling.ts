import { DEFAULT_POLL_OPTIONS } from '../constants';
import { sleep } from './retry';

export class PollingTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Polling timed out after ${timeoutMs}ms`);
    this.name = 'PollingTimeoutError';
  }
}

export interface PollOptions<TValue> {
  intervalMs?: number;
  timeoutMs?: number;
  isDone?: (value: TValue) => boolean;
  signal?: AbortSignal;
  onTick?: (value: TValue, attempt: number) => void | Promise<void>;
}

export const poll = async <TValue>(
  producer: (attempt: number) => Promise<TValue> | TValue,
  options: PollOptions<TValue> = {}
): Promise<TValue> => {
  const intervalMs = options.intervalMs ?? DEFAULT_POLL_OPTIONS.intervalMs;
  const timeoutMs = options.timeoutMs ?? DEFAULT_POLL_OPTIONS.timeoutMs;
  const isDone = options.isDone ?? ((value: TValue) => Boolean(value));
  const startedAt = Date.now();

  for (let attempt = 1; ; attempt += 1) {
    options.signal?.throwIfAborted();

    const value = await producer(attempt);
    await options.onTick?.(value, attempt);

    if (isDone(value)) {
      return value;
    }

    if (Date.now() - startedAt >= timeoutMs) {
      throw new PollingTimeoutError(timeoutMs);
    }

    await sleep(intervalMs, options.signal);
  }
};
