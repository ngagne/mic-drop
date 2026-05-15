import { describe, expect, it } from 'vitest';

import { PollingTimeoutError, poll } from './polling';

describe('poll', () => {
  it('returns when predicate condition is met', async () => {
    let current = 0;

    const result = await poll(
      () => {
        current += 1;
        return current;
      },
      {
        intervalMs: 0,
        timeoutMs: 100,
        isDone: (value) => value >= 3
      }
    );

    expect(result).toBe(3);
  });

  it('throws timeout error when condition is never met', async () => {
    await expect(
      poll(
        () => false,
        {
          intervalMs: 0,
          timeoutMs: 10,
          isDone: () => false
        }
      )
    ).rejects.toBeInstanceOf(PollingTimeoutError);
  });
});
