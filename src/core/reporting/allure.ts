import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

import type { ReportModel, RunnerReportPayload } from './models';

interface AllureStatusDetails {
  status: 'passed' | 'failed' | 'skipped' | 'broken' | 'unknown';
  statusDetails?: {
    message?: string;
  };
}

export const writeAllureResults = async (model: ReportModel, outputDir: string): Promise<void> => {
  await mkdir(outputDir, { recursive: true });

  await Promise.all(
    model.results.map(async (result) => {
      await writeAllureResultForRunner(result, outputDir);
    })
  );
};

const writeAllureResultForRunner = async (result: RunnerReportPayload, outputDir: string): Promise<void> => {
  const uuid = randomUUID();
  const containerUuid = randomUUID();
  const startedAt = normalizeTimestamp(result.startedAt);
  const completedAt = normalizeTimestamp(result.completedAt, startedAt);
  const status = resolveAllureStatus(result);
  const attachmentSource = `${uuid}-raw.json`;
  const runnerName = `${capitalize(result.runner)} Runner`;
  const scopedName = result.journey ? `${runnerName} (${result.journey})` : runnerName;

  const testResult = {
    uuid,
    historyId: `${result.runner}:${result.journey ?? 'all'}`,
    fullName: scopedName,
    name: scopedName,
    status: status.status,
    statusDetails: status.statusDetails,
    stage: 'finished',
    start: startedAt,
    stop: completedAt,
    labels: [
      { name: 'suite', value: runnerName },
      { name: 'framework', value: 'mic-check' }
    ],
    parameters: [
      { name: 'journey', value: result.journey ?? 'all' },
      { name: 'environment', value: result.environment ?? 'default' }
    ],
    attachments: [
      {
        name: 'raw-result',
        source: attachmentSource,
        type: 'application/json'
      }
    ]
  };

  const container = {
    uuid: containerUuid,
    name: scopedName,
    children: [uuid],
    befores: [],
    afters: [],
    start: startedAt,
    stop: completedAt
  };

  await Promise.all([
    writeFile(path.join(outputDir, `${uuid}-result.json`), JSON.stringify(testResult, null, 2), 'utf8'),
    writeFile(path.join(outputDir, `${containerUuid}-container.json`), JSON.stringify(container, null, 2), 'utf8'),
    writeFile(path.join(outputDir, attachmentSource), JSON.stringify(result, null, 2), 'utf8')
  ]);
};

const resolveAllureStatus = (result: RunnerReportPayload): AllureStatusDetails => {
  if (result.status === 'no-tests' || result.status === 'skipped') {
    return {
      status: 'skipped',
      statusDetails: {
        message: result.status === 'no-tests' ? 'No tests were discovered.' : 'Runner execution was skipped.'
      }
    };
  }

  if (result.failedTestCount > 0 || result.status === 'failed') {
    return {
      status: 'failed',
      statusDetails: {
        message: `${result.failedTestCount} test${result.failedTestCount === 1 ? '' : 's'} failed.`
      }
    };
  }

  return { status: 'passed' };
};

const normalizeTimestamp = (value: number, fallback = Date.now()): number =>
  Number.isFinite(value) && value > 0 ? value : fallback;

const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);
