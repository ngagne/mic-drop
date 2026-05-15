import { describe, expect, it, vi } from 'vitest';

import { retry } from './retry';

describe('retry', () => {
  it('retries until operation succeeds', async () => {
    const operation = vi
      .fn<(attempt: number) => Promise<string>>()
      .mockRejectedValueOnce(new Error('first'))
      .mockRejectedValueOnce(new Error('second'))
      .mockResolvedValue('ok');

    const result = await retry(operation, { retries: 3, delayMs: 0 });

    expect(result).toBe('ok');
    expect(operation).toHaveBeenCalledTimes(3);
    expect(operation).toHaveBeenNthCalledWith(1, 1);
    expect(operation).toHaveBeenNthCalledWith(3, 3);
  });

  it('stops when shouldRetry returns false', async () => {
    const operation = vi.fn<(attempt: number) => Promise<string>>().mockRejectedValue(new Error('fatal'));

    await expect(
      retry(operation, {
        retries: 4,
        delayMs: 0,
        shouldRetry: () => false
      })
    ).rejects.toThrow('fatal');

    expect(operation).toHaveBeenCalledTimes(1);
  });
});
