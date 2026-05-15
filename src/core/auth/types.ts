export type AuthHeaders = Record<string, string>;
export type AuthCredentials = Record<string, string>;

export interface AuthContext {
  credentials: AuthCredentials;
  headers?: AuthHeaders;
}

export interface TokenValue {
  token: string;
  expiresAt?: number | Date;
}

export type TokenSupplier = (context: AuthContext) => Promise<string | TokenValue>;

export interface AuthScheme {
  getHeaders(context: AuthContext): Promise<AuthHeaders>;
  clearCache?(): void;
}
