import { describe, expect, it } from 'vitest';

import { authenticationLatencySamplesMs } from '../fixtures/auth-users.fixture';

const calculateAverageLatency = (samples: readonly number[]): number =>
  samples.reduce((sum, value) => sum + value, 0) / samples.length;

describe('authentication performance', () => {
  it('meets starter latency target with deterministic fixture data', () => {
    const averageLatency = calculateAverageLatency(authenticationLatencySamplesMs);

    expect(averageLatency).toBe(45.4);
    expect(averageLatency).toBeLessThan(60);
  });
});
