import type { AuthUserFixture } from '../fixtures/auth-users.fixture';

export interface AuthResult {
  statusCode: number;
  body: {
    authenticated: boolean;
    accessToken?: string;
    error?: string;
  };
}

const knownCredentials = {
  username: 'test.user',
  password: 'correct-password'
} satisfies AuthUserFixture;

export const authenticateUser = (credentials: AuthUserFixture): Promise<AuthResult> => {
  if (credentials.username === knownCredentials.username && credentials.password === knownCredentials.password) {
    return Promise.resolve({
      statusCode: 200,
      body: {
        authenticated: true,
        accessToken: 'stub-access-token'
      }
    });
  }

  return Promise.resolve({
    statusCode: 401,
    body: {
      authenticated: false,
      error: 'INVALID_CREDENTIALS'
    }
  });
};
