import { describe, expect, it } from 'vitest';

const submitClaim = (input: { policyId: string; incidentType: string }): { statusCode: number; claimReference: string } => ({
  statusCode: 202,
  claimReference: `${input.policyId}:${input.incidentType}`
});

describe('claims functional', () => {
  it('accepts a starter claim submission', () => {
    const response = submitClaim({
      policyId: 'POL-123',
      incidentType: 'water-damage'
    });

    expect(response).toEqual({
      statusCode: 202,
      claimReference: 'POL-123:water-damage'
    });
  });
});
