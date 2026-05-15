export type DiscoveryErrorCode = 'DISCOVERY_ROOT_NOT_FOUND' | 'DISCOVERY_IO_ERROR';

export class DiscoveryError extends Error {
  public readonly code: DiscoveryErrorCode;
  public override readonly cause?: unknown;

  public constructor(code: DiscoveryErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'DiscoveryError';
    this.code = code;
    this.cause = cause;
  }
}
