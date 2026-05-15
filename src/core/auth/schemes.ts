import {
  AuthContext,
  AuthCredentials,
  AuthHeaders,
  AuthScheme,
  TokenSupplier,
  TokenValue
} from './types';

const DEFAULT_EXPIRY_SKEW_MS = 30_000;

interface CachedToken {
  value: string;
  expiresAt?: number;
}

const resolveCredential = (credentials: AuthCredentials, key: string): string => {
  const value = credentials[key];

  if (!value) {
    throw new Error(`Missing credential: ${key}`);
  }

  return value;
};

const toEpochMs = (value: number | Date | undefined): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  return value instanceof Date ? value.getTime() : value;
};

const normalizeToken = (value: string | TokenValue): CachedToken => {
  if (typeof value === 'string') {
    return { value };
  }

  return {
    value: value.token,
    expiresAt: toEpochMs(value.expiresAt)
  };
};

const isTokenExpired = (token: CachedToken, now: number, skewMs: number): boolean => {
  if (token.expiresAt === undefined) {
    return false;
  }

  return token.expiresAt <= now + skewMs;
};

export interface BearerAuthOptions {
  credentialKey?: string;
  tokenSupplier?: TokenSupplier;
  refreshToken?: TokenSupplier;
  cacheEnabled?: boolean;
  expirySkewMs?: number;
  now?: () => number;
  headerName?: string;
}

export const createBearerAuthScheme = (options: BearerAuthOptions = {}): AuthScheme => {
  const {
    credentialKey,
    tokenSupplier,
    refreshToken,
    cacheEnabled = true,
    expirySkewMs = DEFAULT_EXPIRY_SKEW_MS,
    now = Date.now,
    headerName = 'Authorization'
  } = options;

  if (!credentialKey && !tokenSupplier) {
    throw new Error('Bearer auth requires either credentialKey or tokenSupplier');
  }

  let cachedToken: CachedToken | undefined;

  const fetchToken = async (context: AuthContext): Promise<CachedToken> => {
    if (tokenSupplier) {
      return normalizeToken(await tokenSupplier(context));
    }

    return { value: resolveCredential(context.credentials, credentialKey as string) };
  };

  const refreshCachedToken = async (context: AuthContext): Promise<CachedToken> => {
    if (!cachedToken || !isTokenExpired(cachedToken, now(), expirySkewMs)) {
      return cachedToken as CachedToken;
    }

    if (!refreshToken) {
      throw new Error('Bearer token is expired and no refreshToken hook was provided');
    }

    const refreshed = normalizeToken(await refreshToken(context));

    if (cacheEnabled) {
      cachedToken = refreshed;
    }

    return refreshed;
  };

  return {
    async getHeaders(context: AuthContext): Promise<AuthHeaders> {
      if (cacheEnabled && cachedToken) {
        const freshToken = await refreshCachedToken(context);
        return { [headerName]: `Bearer ${freshToken.value}` };
      }

      const token = await fetchToken(context);

      if (cacheEnabled) {
        cachedToken = token;
      }

      return { [headerName]: `Bearer ${token.value}` };
    },
    clearCache(): void {
      cachedToken = undefined;
    }
  };
};

export interface ApiKeyAuthOptions {
  credentialKey: string;
  headerName?: string;
  prefix?: string;
}

export const createApiKeyAuthScheme = (options: ApiKeyAuthOptions): AuthScheme => {
  const { credentialKey, headerName = 'x-api-key', prefix } = options;

  return {
    getHeaders(context: AuthContext): Promise<AuthHeaders> {
      const apiKey = resolveCredential(context.credentials, credentialKey);
      return Promise.resolve({
        [headerName]: prefix ? `${prefix} ${apiKey}` : apiKey
      });
    }
  };
};

export interface BasicAuthOptions {
  usernameCredentialKey: string;
  passwordCredentialKey: string;
  headerName?: string;
}

export const createBasicAuthScheme = (options: BasicAuthOptions): AuthScheme => {
  const {
    usernameCredentialKey,
    passwordCredentialKey,
    headerName = 'Authorization'
  } = options;

  return {
    getHeaders(context: AuthContext): Promise<AuthHeaders> {
      const username = resolveCredential(context.credentials, usernameCredentialKey);
      const password = resolveCredential(context.credentials, passwordCredentialKey);
      const encoded = Buffer.from(`${username}:${password}`).toString('base64');

      return Promise.resolve({
        [headerName]: `Basic ${encoded}`
      });
    }
  };
};
