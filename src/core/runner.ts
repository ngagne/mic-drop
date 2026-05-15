import type { RunCommandOptions } from '../cli/parser';
import { discoverArtifacts } from './discovery';
import { executeFunctionalTests } from './execution';
import { executePerformanceTests } from './performance';
import { generateReport, generateReportFromLatestRaw, type RunnerReportPayload } from './reporting';

export interface RunJourneyRequest {
  journey?: string;
  options: RunCommandOptions;
}

export const runJourney = async (request: RunJourneyRequest): Promise<void> => {
  const target = request.journey ?? 'all journeys';

  if (request.options.reportOnly) {
    try {
      const reportPaths = await generateReportFromLatestRaw({
        ci: request.options.ci
      });
      console.log(`Report generated at ${reportPaths.latestIndexPath}`);
    } catch (error) {
      throw new Error(`Unable to generate report-only output: ${(error as Error).message}`);
    }
    return;
  }

  const snapshot = await discoverArtifacts();
  const reportPayloads: RunnerReportPayload[] = [];

  if (request.options.performance) {
    const startedAt = Date.now();
    const result = await executePerformanceTests({
      snapshot,
      journey: request.journey,
      environment: request.options.environment,
      ci: request.options.ci
    });
    const completedAt = Date.now();

    reportPayloads.push({
      runner: 'performance',
      journey: request.journey,
      environment: request.options.environment,
      status: result.status,
      failedTestCount: result.failedTestCount,
      totalTestCount: result.artifacts.selectedTests.length,
      startedAt,
      completedAt,
      metadata: {
        fileFilters: result.artifacts.fileFilters,
        passedTestCount: result.passedTestCount,
        exportedEnvVarNames: result.artifacts.exportedEnvVarNames
      }
    });

    if (result.status === 'no-tests') {
      console.log(`No performance tests discovered for ${target}.`);
    } else {
      console.log(
        `Performance run completed for ${target}: passed=${result.passedTestCount}, failed=${result.failedTestCount}, environment=${result.artifacts.environment}`
      );
    }

  } else {
    const startedAt = Date.now();
    const result = await executeFunctionalTests({
      snapshot,
      journey: request.journey,
      tags: request.options.tags,
      parallel: request.options.parallel,
      ci: request.options.ci
    });
    const completedAt = Date.now();

    reportPayloads.push({
      runner: 'functional',
      journey: request.journey,
      environment: request.options.environment,
      status: result.status,
      failedTestCount: result.failedTestCount,
      totalTestCount: result.artifacts.selectedTests.length,
      startedAt,
      completedAt,
      metadata: {
        fileFilters: result.artifacts.fileFilters,
        testNamePattern: result.artifacts.testNamePattern
      }
    });

    if (result.status === 'no-tests') {
      console.log(`No functional tests discovered for ${target}.`);
    }
  }

  const reportPaths = await generateReport({
    results: reportPayloads,
    ci: request.options.ci
  });
  console.log(`Report generated at ${reportPaths.latestIndexPath}`);

  const functionalResult = reportPayloads.find((payload) => payload.runner === 'functional');
  if (functionalResult && functionalResult.failedTestCount > 0) {
    throw new Error(
      `Functional execution failed (${functionalResult.failedTestCount} test${functionalResult.failedTestCount === 1 ? '' : 's'})`
    );
  }

  const performanceResult = reportPayloads.find((payload) => payload.runner === 'performance');
  if (performanceResult && performanceResult.failedTestCount > 0) {
    throw new Error(
      `Performance execution failed (${performanceResult.failedTestCount} test${performanceResult.failedTestCount === 1 ? '' : 's'})`
    );
  }
};
