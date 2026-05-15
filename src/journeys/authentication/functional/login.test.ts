import { describe, expect, it } from 'vitest';

import { invalidAuthUser, validAuthUser } from '../fixtures/auth-users.fixture';
import { authenticateUser } from '../helpers/auth-request.helper';

describe('authentication functional', () => {
  it('authenticates a valid user', async () => {
    const response = await authenticateUser(validAuthUser);

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      authenticated: true,
      accessToken: 'stub-access-token'
    });
  });

  it('rejects invalid credentials', async () => {
    const response = await authenticateUser(invalidAuthUser);

    expect(response.statusCode).toBe(401);
    expect(response.body).toMatchObject({
      authenticated: false,
      error: 'INVALID_CREDENTIALS'
    });
  });
});
