import { AuthContext, AuthHeaders, AuthScheme } from './types';

export interface ConfigAuthSource {
  credentials: Record<string, string>;
  headers: Record<string, string>;
}

export interface AuthResolver {
  buildHeaders(context: AuthContext): Promise<AuthHeaders>;
  clearCache(): void;
}

export interface AuthResolverOptions {
  schemes?: AuthScheme[];
}

export const createAuthContextFromConfig = (
  config: Pick<ConfigAuthSource, 'credentials' | 'headers'>
): AuthContext => ({
  credentials: { ...config.credentials },
  headers: { ...config.headers }
});

export const createAuthResolver = (options: AuthResolverOptions = {}): AuthResolver => {
  const schemes = options.schemes ?? [];

  return {
    async buildHeaders(context: AuthContext): Promise<AuthHeaders> {
      const mergedHeaders: AuthHeaders = { ...(context.headers ?? {}) };

      for (const scheme of schemes) {
        const schemeHeaders = await scheme.getHeaders(context);
        Object.assign(mergedHeaders, schemeHeaders);
      }

      return mergedHeaders;
    },
    clearCache(): void {
      for (const scheme of schemes) {
        scheme.clearCache?.();
      }
    }
  };
};
