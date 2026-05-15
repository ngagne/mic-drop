import { describe, expect, it } from 'vitest';

const createProfile = (input: { email: string; acceptedTerms: boolean }): { statusCode: number; profileId?: string } => {
  if (!input.acceptedTerms) {
    return { statusCode: 422 };
  }

  return {
    statusCode: 201,
    profileId: `profile:${input.email}`
  };
};

describe('customer-onboarding functional', () => {
  it('creates a profile when terms are accepted', () => {
    const response = createProfile({ email: 'new.customer@example.com', acceptedTerms: true });

    expect(response).toEqual({
      statusCode: 201,
      profileId: 'profile:new.customer@example.com'
    });
  });
});
