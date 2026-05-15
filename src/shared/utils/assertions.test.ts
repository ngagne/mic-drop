import { describe, expect, it } from 'vitest';

import { AssertionError, assertEqual, assertStatusCode, assertStringIncludes } from './assertions';

describe('assertions', () => {
  it('assertStatusCode supports list of expected values', () => {
    expect(() => assertStatusCode(201, [200, 201])).not.toThrow();
    expect(() => assertStatusCode(500, [200, 201])).toThrow(AssertionError);
  });

  it('assertEqual throws when values differ', () => {
    expect(() => assertEqual('a', 'b')).toThrow(AssertionError);
  });

  it('assertStringIncludes validates content', () => {
    expect(() => assertStringIncludes('hello world', 'world')).not.toThrow();
  });
});
