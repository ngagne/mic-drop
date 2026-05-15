import { describe, expect, it, vi } from 'vitest';

import type { DiscoverySnapshot } from '../discovery';
import { createFunctionalExecutionPlan, executeFunctionalTests } from './functional';

describe('createFunctionalExecutionPlan', () => {
  it('applies optional journey filtering to functional test files', () => {
    const snapshot = createSnapshot();

    const plan = createFunctionalExecutionPlan({
      snapshot,
      journey: 'checkout'
    });

    expect(plan.fileFilters).toEqual(['src/journeys/checkout/functional/login.test.ts']);
  });

  it('maps tags, ci mode, and worker parallelism into Vitest options', () => {
    const snapshot = createSnapshot();

    const plan = createFunctionalExecutionPlan({
      snapshot,
      tags: ['smoke', '@sanity'],
      parallel: 4,
      ci: true
    });

    expect(plan.testNamePattern).toBe('@smoke\\b|@sanity\\b');
    expect(plan.vitestOptions).toMatchObject({
      testNamePattern: '@smoke\\b|@sanity\\b',
      reporters: ['dot', 'github-actions'],
      maxWorkers: 4,
      minWorkers: 4,
      run: true,
      watch: false
    });
  });
});

describe('executeFunctionalTests', () => {
  it('returns no-tests without invoking Vitest when discovery yields no matching files', async () => {
    const startVitest = vi.fn();

    const result = await executeFunctionalTests(
      {
        snapshot: createSnapshot(),
        journey: 'missing-journey'
      },
      {},
      { startVitest: startVitest as never }
    );

    expect(result).toMatchObject({
      status: 'no-tests',
      failedTestCount: 0
    });
    expect(startVitest).not.toHaveBeenCalled();
  });

  it('invokes Vitest with file filters and returns failed test count', async () => {
    const close = vi.fn().mockResolvedValue(undefined);
    const startVitest = vi.fn().mockResolvedValue({
      state: {
        getCountOfFailedTests: () => 2
      },
      close
    });

    const result = await executeFunctionalTests(
      {
        snapshot: createSnapshot(),
        tags: ['smoke']
      },
      {},
      { startVitest: startVitest as never }
    );

    expect(startVitest).toHaveBeenCalledWith(
      'test',
      ['src/journeys/account/functional/profile.test.ts', 'src/journeys/checkout/functional/login.test.ts'],
      expect.objectContaining({
        testNamePattern: '@smoke\\b'
      })
    );
    expect(result).toMatchObject({
      status: 'completed',
      failedTestCount: 2
    });
    expect(close).toHaveBeenCalledTimes(1);
  });
});

const createSnapshot = (): DiscoverySnapshot => ({
  rootPath: '/repo',
  journeys: [
    {
      name: 'account',
      journeyPath: '/repo/src/journeys/account',
      relativeJourneyPath: 'src/journeys/account',
      functionalTests: [
        {
          journeyName: 'account',
          testType: 'functional',
          name: 'profile',
          filePath: '/repo/src/journeys/account/functional/profile.test.ts',
          relativeFilePath: 'src/journeys/account/functional/profile.test.ts'
        }
      ],
      performanceTests: [],
      tests: []
    },
    {
      name: 'checkout',
      journeyPath: '/repo/src/journeys/checkout',
      relativeJourneyPath: 'src/journeys/checkout',
      functionalTests: [
        {
          journeyName: 'checkout',
          testType: 'functional',
          name: 'login',
          filePath: '/repo/src/journeys/checkout/functional/login.test.ts',
          relativeFilePath: 'src/journeys/checkout/functional/login.test.ts'
        }
      ],
      performanceTests: [],
      tests: []
    }
  ]
});
