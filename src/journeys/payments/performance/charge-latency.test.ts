import { describe, expect, it } from 'vitest';

import { paymentProcessingDurationsMs } from '../fixtures/payment-data.fixture';

describe('payments performance', () => {
  it('keeps starter payment processing latency within target', () => {
    const maxLatency = Math.max(...paymentProcessingDurationsMs);

    expect(maxLatency).toBe(68);
    expect(maxLatency).toBeLessThan(80);
  });
});
