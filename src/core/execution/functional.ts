import type { DiscoveredTestArtifact, DiscoverySnapshot } from '../discovery';
import { startVitest } from 'vitest/node';

type VitestStart = typeof startVitest;
type VitestCliOptions = NonNullable<Parameters<VitestStart>[2]>;

export interface FunctionalExecutionRequest {
  snapshot: DiscoverySnapshot;
  journey?: string;
  tags?: string[];
  parallel?: number;
  ci?: boolean;
}

export interface FunctionalExecutionPlan {
  selectedTests: DiscoveredTestArtifact[];
  fileFilters: string[];
  testNamePattern?: string;
  vitestOptions: VitestCliOptions;
}

export interface FunctionalExecutionArtifacts {
  selectedTests: DiscoveredTestArtifact[];
  fileFilters: string[];
  testNamePattern?: string;
}

export interface FunctionalExecutionResult {
  status: 'completed' | 'no-tests';
  failedTestCount: number;
  artifacts: FunctionalExecutionArtifacts;
}

export interface FunctionalExecutionHooks {
  onComplete?: (result: FunctionalExecutionResult) => void | Promise<void>;
}

export interface FunctionalExecutionDependencies {
  startVitest: VitestStart;
}

const defaultDependencies: FunctionalExecutionDependencies = {
  startVitest
};

export const createFunctionalExecutionPlan = (request: FunctionalExecutionRequest): FunctionalExecutionPlan => {
  const normalizedTags = normalizeTags(request.tags);
  const functionalTests = request.snapshot.journeys.flatMap((journey) => journey.functionalTests);
  const selectedTests = request.journey
    ? functionalTests.filter((test) => test.journeyName === request.journey)
    : functionalTests;

  const fileFilters = selectedTests.map((test) => test.relativeFilePath);
  const testNamePattern = normalizedTags.length > 0 ? buildTagTestNamePattern(normalizedTags) : undefined;
  const vitestOptions: VitestCliOptions = {
    run: true,
    watch: false,
    passWithNoTests: true,
    reporters: request.ci ? ['dot', 'github-actions'] : ['default'],
    maxWorkers: request.parallel,
    minWorkers: request.parallel,
    testNamePattern
  };

  return {
    selectedTests,
    fileFilters,
    testNamePattern,
    vitestOptions
  };
};

export const executeFunctionalTests = async (
  request: FunctionalExecutionRequest,
  hooks: FunctionalExecutionHooks = {},
  dependencies: FunctionalExecutionDependencies = defaultDependencies
): Promise<FunctionalExecutionResult> => {
  const plan = createFunctionalExecutionPlan(request);

  if (plan.fileFilters.length === 0) {
    const emptyResult: FunctionalExecutionResult = {
      status: 'no-tests',
      failedTestCount: 0,
      artifacts: {
        selectedTests: plan.selectedTests,
        fileFilters: plan.fileFilters,
        testNamePattern: plan.testNamePattern
      }
    };
    await hooks.onComplete?.(emptyResult);
    return emptyResult;
  }

  const vitest = await dependencies.startVitest('test', plan.fileFilters, plan.vitestOptions);
  if (!vitest) {
    throw new Error('Unable to initialize Vitest for functional execution.');
  }

  try {
    const failedTestCount = vitest.state.getCountOfFailedTests();
    const result: FunctionalExecutionResult = {
      status: 'completed',
      failedTestCount,
      artifacts: {
        selectedTests: plan.selectedTests,
        fileFilters: plan.fileFilters,
        testNamePattern: plan.testNamePattern
      }
    };
    await hooks.onComplete?.(result);
    return result;
  } finally {
    await vitest.close();
  }
};

const normalizeTags = (tags?: string[]): string[] => {
  const normalized = (tags ?? [])
    .map((tag) => tag.trim().replace(/^@/, ''))
    .filter((tag) => tag.length > 0);

  return [...new Set(normalized)];
};

const buildTagTestNamePattern = (tags: string[]): string =>
  tags.map((tag) => `@${escapeRegExp(tag)}\\b`).join('|');

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
