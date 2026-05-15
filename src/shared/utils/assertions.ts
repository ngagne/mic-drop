import { isExpectedStatusCode } from '../validators';

export class AssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssertionError';
  }
}

export const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) {
    throw new AssertionError(message);
  }
};

export const assertEqual = <T>(actual: T, expected: T, message?: string): void => {
  if (!Object.is(actual, expected)) {
    throw new AssertionError(message ?? `Expected ${String(expected)} but received ${String(actual)}`);
  }
};

export const assertIncludes = <T>(collection: readonly T[], item: T, message?: string): void => {
  if (!collection.includes(item)) {
    throw new AssertionError(message ?? `Expected collection to include ${String(item)}`);
  }
};

export const assertStringIncludes = (value: string, expected: string, message?: string): void => {
  if (!value.includes(expected)) {
    throw new AssertionError(message ?? `Expected "${value}" to include "${expected}"`);
  }
};

export const assertStatusCode = (statusCode: number, expected: number | readonly number[]): void => {
  if (!isExpectedStatusCode(statusCode, expected)) {
    const expectedValue = Array.isArray(expected) ? expected.join(', ') : String(expected);
    throw new AssertionError(`Expected status code ${expectedValue} but received ${statusCode}`);
  }
};
