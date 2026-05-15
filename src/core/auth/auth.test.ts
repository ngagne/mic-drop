import { describe, expect, it, vi } from 'vitest';

import {
  createApiKeyAuthScheme,
  createAuthContextFromConfig,
  createAuthResolver,
  createBasicAuthScheme,
  createBearerAuthScheme
} from './index';

describe('auth core', () => {
  it('uses cached bearer token across calls', async () => {
    const tokenSupplier = vi
      .fn()
      .mockResolvedValueOnce({ token: 'token-1', expiresAt: Date.now() + 100_000 })
      .mockResolvedValueOnce({ token: 'token-2', expiresAt: Date.now() + 100_000 });

    const resolver = createAuthResolver({
      schemes: [
        createBearerAuthScheme({
          tokenSupplier
        })
      ]
    });

    const context = {
      credentials: {},
      headers: {}
    };

    const first = await resolver.buildHeaders(context);
    const second = await resolver.buildHeaders(context);

    expect(first.Authorization).toBe('Bearer token-1');
    expect(second.Authorization).toBe('Bearer token-1');
    expect(tokenSupplier).toHaveBeenCalledTimes(1);
  });

  it('refreshes expired bearer token through hook', async () => {
    const now = vi.fn().mockReturnValue(2_000);
    const tokenSupplier = vi.fn().mockResolvedValue({ token: 'initial', expiresAt: 1_000 });
    const refreshToken = vi.fn().mockResolvedValue({ token: 'refreshed', expiresAt: 10_000 });

    const resolver = createAuthResolver({
      schemes: [
        createBearerAuthScheme({
          tokenSupplier,
          refreshToken,
          now,
          expirySkewMs: 0
        })
      ]
    });

    const context = {
      credentials: {},
      headers: {}
    };

    const first = await resolver.buildHeaders(context);
    const second = await resolver.buildHeaders(context);

    expect(first.Authorization).toBe('Bearer initial');
    expect(second.Authorization).toBe('Bearer refreshed');
    expect(tokenSupplier).toHaveBeenCalledTimes(1);
    expect(refreshToken).toHaveBeenCalledTimes(1);
  });

  it('builds headers for api key and basic auth schemes', async () => {
    const resolver = createAuthResolver({
      schemes: [
        createApiKeyAuthScheme({ credentialKey: 'apiKey', headerName: 'x-api-key' }),
        createBasicAuthScheme({
          usernameCredentialKey: 'username',
          passwordCredentialKey: 'password'
        })
      ]
    });

    const context = createAuthContextFromConfig({
      credentials: {
        apiKey: 'key-123',
        username: 'user',
        password: 'pass'
      },
      headers: {
        'X-Client-Name': 'api-test-platform'
      }
    });

    const headers = await resolver.buildHeaders(context);

    expect(headers['X-Client-Name']).toBe('api-test-platform');
    expect(headers['x-api-key']).toBe('key-123');
    expect(headers.Authorization).toBe('Basic dXNlcjpwYXNz');
  });
});
