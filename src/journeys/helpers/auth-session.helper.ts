import type { AuthUserFixture } from '../authentication/fixtures/auth-users.fixture';
import { authenticateUser as authenticateUserRequest } from '../authentication/helpers/auth-request.helper';

export interface AuthSession {
  jwt: string;
  authorizationHeader: string;
}

export const authenticateUser = async (credentials: AuthUserFixture): Promise<AuthSession> => {
  const response = await authenticateUserRequest(credentials);
  const jwt = response.body.accessToken;

  if (response.statusCode !== 200 || response.body.authenticated !== true || !jwt) {
    const failureReason = response.body.error ?? 'UNKNOWN_AUTH_FAILURE';
    throw new Error(`Authentication failed with status ${response.statusCode}: ${failureReason}`);
  }

  return {
    jwt,
    authorizationHeader: `Bearer ${jwt}`
  };
};
