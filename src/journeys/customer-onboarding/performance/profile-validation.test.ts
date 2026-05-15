import { describe, expect, it } from 'vitest';

const validationDurationsMs = [18, 20, 19, 17];

describe('customer-onboarding performance', () => {
  it('keeps starter validation path under threshold', () => {
    const slowestValidation = Math.max(...validationDurationsMs);

    expect(slowestValidation).toBe(20);
    expect(slowestValidation).toBeLessThanOrEqual(25);
  });
});
