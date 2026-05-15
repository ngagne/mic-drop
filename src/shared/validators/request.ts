import { RETRYABLE_STATUS_CODES } from '../constants';
import { requestDefinitionSchema, type RequestDefinition } from '../schemas';

export const validateRequestDefinition = (input: unknown): RequestDefinition => requestDefinitionSchema.parse(input);

export const isRetryableStatusCode = (statusCode: number): boolean =>
  RETRYABLE_STATUS_CODES.includes(statusCode as (typeof RETRYABLE_STATUS_CODES)[number]);

export const isExpectedStatusCode = (statusCode: number, expected: number | readonly number[]): boolean =>
  Array.isArray(expected) ? expected.includes(statusCode) : statusCode === expected;
