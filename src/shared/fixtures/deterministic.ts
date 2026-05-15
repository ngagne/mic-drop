import { ALPHANUMERIC_CHARS, DEFAULT_ID_LENGTH, DEFAULT_TEST_DOMAIN } from '../constants';

const hashSeed = (seed: string): number => {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

const createRandom = (seed: string): (() => number) => {
  let state = hashSeed(seed);

  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
};

export interface DeterministicDataFactory {
  id(prefix?: string, length?: number): string;
  email(label?: string, domain?: string): string;
  string(length?: number, alphabet?: string): string;
  integer(min: number, max: number): number;
  pick<T>(values: readonly T[]): T;
}

export const createDeterministicDataFactory = (seed: string): DeterministicDataFactory => {
  const random = createRandom(seed);

  const string = (length = DEFAULT_ID_LENGTH, alphabet = ALPHANUMERIC_CHARS): string => {
    let result = '';
    for (let index = 0; index < length; index += 1) {
      result += alphabet[Math.floor(random() * alphabet.length)] ?? 'x';
    }

    return result;
  };

  return {
    id: (prefix = 'id', length = DEFAULT_ID_LENGTH) => `${prefix}_${string(length)}`,
    email: (label = 'user', domain = DEFAULT_TEST_DOMAIN) => `${label}.${string(8)}@${domain}`,
    string,
    integer: (min, max) => {
      if (max < min) {
        throw new Error('max must be greater than or equal to min');
      }

      return Math.floor(random() * (max - min + 1)) + min;
    },
    pick: <T>(values: readonly T[]): T => {
      if (values.length === 0) {
        throw new Error('Cannot pick from an empty list');
      }

      return values[Math.floor(random() * values.length)];
    }
  };
};
