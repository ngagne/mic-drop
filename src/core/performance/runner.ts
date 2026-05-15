import { spawn } from 'node:child_process';

import { loadConfig } from '../../../config/config-loader';
import type { AppConfig } from '../../../config/schema';
import { createAuthContextFromConfig, type ConfigAuthSource } from '../auth/resolver';
import type { DiscoveredTestArtifact, DiscoverySnapshot } from '../discovery';

export interface PerformanceExecutionRequest {
  snapshot: DiscoverySnapshot;
  journey?: string;
  environment?: string;
  ci?: boolean;
}

export interface PerformanceExecutionPlan {
  selectedTests: DiscoveredTestArtifact[];
  fileFilters: string[];
}

export interface PerformanceCommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export interface PerformanceRunResult {
  test: DiscoveredTestArtifact;
  command: string;
  args: string[];
  durationMs: number;
  exitCode: number;
  stdout: string;
  stderr: string;
  status: 'passed' | 'failed';
}

export interface PerformanceExecutionArtifacts {
  selectedTests: DiscoveredTestArtifact[];
  fileFilters: string[];
  environment: string;
  exportedEnvVarNames: string[];
}

export interface PerformanceExecutionResult {
  status: 'completed' | 'no-tests';
  failedTestCount: number;
  passedTestCount: number;
  runs: PerformanceRunResult[];
  artifacts: PerformanceExecutionArtifacts;
}

export interface PerformanceExecutionHooks {
  onComplete?: (result: PerformanceExecutionResult) => void | Promise<void>;
}

export interface PerformanceCommandRunner {
  run: (command: string, args: string[], options: { cwd: string; env: NodeJS.ProcessEnv }) => Promise<PerformanceCommandResult>;
}

export interface PerformanceExecutionDependencies {
  loadConfig: (options: { environment?: string }) => AppConfig;
  createAuthContextFromConfig: (config: Pick<ConfigAuthSource, 'credentials' | 'headers'>) => {
    credentials: Record<string, string>;
    headers?: Record<string, string>;
  };
  commandRunner: PerformanceCommandRunner;
}

const defaultDependencies: PerformanceExecutionDependencies = {
  loadConfig,
  createAuthContextFromConfig,
  commandRunner: {
    run: (command, args, options) => executeCommand(command, args, options)
  }
};

export const createPerformanceExecutionPlan = (request: PerformanceExecutionRequest): PerformanceExecutionPlan => {
  const performanceTests = request.snapshot.journeys.flatMap((journey) => journey.performanceTests);
  const selectedTests = request.journey
    ? performanceTests.filter((test) => test.journeyName === request.journey)
    : performanceTests;

  return {
    selectedTests,
    fileFilters: selectedTests.map((test) => test.relativeFilePath)
  };
};

export const executePerformanceTests = async (
  request: PerformanceExecutionRequest,
  hooks: PerformanceExecutionHooks = {},
  dependencies: PerformanceExecutionDependencies = defaultDependencies
): Promise<PerformanceExecutionResult> => {
  const plan = createPerformanceExecutionPlan(request);
  const environment = request.environment ?? process.env.ENVIRONMENT ?? 'local';

  if (plan.selectedTests.length === 0) {
    const emptyResult: PerformanceExecutionResult = {
      status: 'no-tests',
      failedTestCount: 0,
      passedTestCount: 0,
      runs: [],
      artifacts: {
        selectedTests: plan.selectedTests,
        fileFilters: plan.fileFilters,
        environment,
        exportedEnvVarNames: []
      }
    };
    await hooks.onComplete?.(emptyResult);
    return emptyResult;
  }

  const runtimeEnv = createPerformanceRuntimeEnv(environment, dependencies);
  const exportedEnvVarNames = Object.keys(runtimeEnv);
  const childEnv: NodeJS.ProcessEnv = {
    ...process.env,
    ...runtimeEnv
  };

  const runs: PerformanceRunResult[] = [];
  for (const test of plan.selectedTests) {
    const args = createK6Args(test.relativeFilePath, request.ci ?? false);
    const startedAt = Date.now();
    const commandResult = await dependencies.commandRunner.run('k6', args, {
      cwd: request.snapshot.rootPath,
      env: childEnv
    });
    const durationMs = Date.now() - startedAt;

    runs.push({
      test,
      command: 'k6',
      args,
      durationMs,
      exitCode: commandResult.exitCode,
      stdout: commandResult.stdout,
      stderr: commandResult.stderr,
      status: commandResult.exitCode === 0 ? 'passed' : 'failed'
    });
  }

  const failedTestCount = runs.filter((run) => run.status === 'failed').length;
  const result: PerformanceExecutionResult = {
    status: 'completed',
    failedTestCount,
    passedTestCount: runs.length - failedTestCount,
    runs,
    artifacts: {
      selectedTests: plan.selectedTests,
      fileFilters: plan.fileFilters,
      environment,
      exportedEnvVarNames
    }
  };
  await hooks.onComplete?.(result);
  return result;
};

const createK6Args = (fileFilter: string, ci: boolean): string[] => [
  'run',
  ...(ci ? ['--quiet', '--no-color'] : []),
  fileFilter
];

const createPerformanceRuntimeEnv = (
  environment: string,
  dependencies: PerformanceExecutionDependencies
): Record<string, string> => {
  const config = dependencies.loadConfig({ environment });
  const authContext = dependencies.createAuthContextFromConfig({
    credentials: config.credentials,
    headers: config.headers
  });

  return {
    API_TEST_ENVIRONMENT: environment,
    API_TEST_BASE_URL: config.api.baseUrl,
    API_TEST_TIMEOUT_MS: String(config.api.timeoutMs),
    API_TEST_RETRIES: String(config.api.retries),
    API_TEST_AUTH_CONTEXT_B64: encodeJson(authContext),
    API_TEST_FEATURES_B64: encodeJson(config.features),
    API_TEST_TEST_DATA_B64: encodeJson(config.testData)
  };
};

const encodeJson = (value: unknown): string => Buffer.from(JSON.stringify(value), 'utf-8').toString('base64url');

const executeCommand = (
  command: string,
  args: string[],
  options: { cwd: string; env: NodeJS.ProcessEnv }
): Promise<PerformanceCommandResult> =>
  new Promise((resolve, reject) => {
    const childProcess = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    childProcess.stdout.on('data', (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });
    childProcess.stderr.on('data', (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });
    childProcess.on('error', reject);
    childProcess.on('close', (exitCode) => {
      resolve({
        exitCode: exitCode ?? 1,
        stdout,
        stderr
      });
    });
  });
