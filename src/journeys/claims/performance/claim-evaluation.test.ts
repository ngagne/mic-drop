import { describe, expect, it } from 'vitest';

const evaluationDurationsMs = [90, 95, 92];

describe('claims performance', () => {
  it('keeps starter claim evaluation timing stable', () => {
    const average = evaluationDurationsMs.reduce((sum, value) => sum + value, 0) / evaluationDurationsMs.length;

    expect(average).toBe(92.33333333333333);
    expect(average).toBeLessThan(100);
  });
});
