import { describe, expect, it, vi } from 'vitest';

import type { DiscoverySnapshot } from '../discovery';
import type { PerformanceCommandResult, PerformanceExecutionDependencies } from './runner';
import { createPerformanceExecutionPlan, executePerformanceTests } from './runner';

describe('createPerformanceExecutionPlan', () => {
  it('selects only performance tests and supports journey filtering', () => {
    const plan = createPerformanceExecutionPlan({
      snapshot: createSnapshot(),
      journey: 'checkout'
    });

    expect(plan.fileFilters).toEqual([
      'src/journeys/checkout/performance/load.test.ts',
      'src/journeys/checkout/performance/spike.test.ts'
    ]);
  });
});

describe('executePerformanceTests', () => {
  it('returns no-tests and skips command execution when no matching tests exist', async () => {
    const commandRunner = {
      run: vi.fn<
        (command: string, args: string[], options: { cwd: string; env: NodeJS.ProcessEnv }) => Promise<PerformanceCommandResult>
      >()
    };

    const result = await executePerformanceTests(
      {
        snapshot: createSnapshot(),
        journey: 'missing'
      },
      {},
      createDependencies({ commandRunner })
    );

    expect(result).toMatchObject({
      status: 'no-tests',
      failedTestCount: 0,
      passedTestCount: 0
    });
    expect(commandRunner.run).not.toHaveBeenCalled();
  });

  it('executes k6 for each selected test with CI flags and propagated environment context', async () => {
    const run = vi
      .fn<(command: string, args: string[], options: { cwd: string; env: NodeJS.ProcessEnv }) => Promise<PerformanceCommandResult>>()
      .mockResolvedValueOnce({ exitCode: 0, stdout: 'ok-1', stderr: '' })
      .mockResolvedValueOnce({ exitCode: 1, stdout: '', stderr: 'failed-2' });
    const commandRunner = {
      run
    };

    const result = await executePerformanceTests(
      {
        snapshot: createSnapshot(),
        journey: 'checkout',
        environment: 'qa',
        ci: true
      },
      {},
      createDependencies({ commandRunner })
    );

    expect(commandRunner.run).toHaveBeenCalledTimes(2);
    const firstCall = run.mock.calls[0];
    expect(firstCall).toBeDefined();
    expect(firstCall?.[0]).toBe('k6');
    expect(firstCall?.[1]).toEqual(['run', '--quiet', '--no-color', 'src/journeys/checkout/performance/load.test.ts']);
    expect(firstCall?.[2].cwd).toBe('/repo');
    expect(firstCall?.[2].env.API_TEST_ENVIRONMENT).toBe('qa');
    expect(firstCall?.[2].env.API_TEST_BASE_URL).toBe('https://qa.example.com');
    expect(firstCall?.[2].env.API_TEST_AUTH_CONTEXT_B64).toEqual(expect.any(String));

    expect(result).toMatchObject({
      status: 'completed',
      failedTestCount: 1,
      passedTestCount: 1
    });
    expect(result.runs.map((run) => run.status)).toEqual(['passed', 'failed']);
    expect(result.artifacts.exportedEnvVarNames).toContain('API_TEST_AUTH_CONTEXT_B64');
  });
});

const createDependencies = (overrides: {
  commandRunner: PerformanceExecutionDependencies['commandRunner'];
}): PerformanceExecutionDependencies => ({
  loadConfig: vi.fn().mockReturnValue({
    name: 'qa',
    api: {
      baseUrl: 'https://qa.example.com',
      timeoutMs: 1000,
      retries: 1
    },
    credentials: { apiKey: 'secret-key' },
    headers: { 'X-Client-Name': 'api-test-platform' },
    features: { enablePerf: true },
    testData: { userId: 'qa-user' }
  }),
  createAuthContextFromConfig: vi.fn().mockImplementation((config: { credentials: Record<string, string>; headers: Record<string, string> }) => ({
    credentials: { ...config.credentials },
    headers: { ...config.headers }
  })),
  commandRunner: overrides.commandRunner
});

const createSnapshot = (): DiscoverySnapshot => ({
  rootPath: '/repo',
  journeys: [
    {
      name: 'account',
      journeyPath: '/repo/src/journeys/account',
      relativeJourneyPath: 'src/journeys/account',
      functionalTests: [],
      performanceTests: [
        {
          journeyName: 'account',
          testType: 'performance',
          name: 'profile',
          filePath: '/repo/src/journeys/account/performance/profile.test.ts',
          relativeFilePath: 'src/journeys/account/performance/profile.test.ts'
        }
      ],
      tests: []
    },
    {
      name: 'checkout',
      journeyPath: '/repo/src/journeys/checkout',
      relativeJourneyPath: 'src/journeys/checkout',
      functionalTests: [],
      performanceTests: [
        {
          journeyName: 'checkout',
          testType: 'performance',
          name: 'load',
          filePath: '/repo/src/journeys/checkout/performance/load.test.ts',
          relativeFilePath: 'src/journeys/checkout/performance/load.test.ts'
        },
        {
          journeyName: 'checkout',
          testType: 'performance',
          name: 'spike',
          filePath: '/repo/src/journeys/checkout/performance/spike.test.ts',
          relativeFilePath: 'src/journeys/checkout/performance/spike.test.ts'
        }
      ],
      tests: []
    }
  ]
});
