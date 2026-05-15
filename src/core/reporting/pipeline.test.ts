import { mkdir, readdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { createReportModel, generateReport, shouldAutoOpenReport } from './pipeline';
import type { RunnerReportPayload } from './models';

const workspaceRoot = path.join(process.cwd(), 'src', 'core', 'reporting', '.test-workspace');
const createdDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    createdDirectories.splice(0).map(async (directory) => {
      await rm(directory, { recursive: true, force: true });
    })
  );
});

describe('createReportModel', () => {
  it('aggregates runner payload summaries', () => {
    const payloads = [
      createPayload({ runner: 'functional', totalTestCount: 4, failedTestCount: 1, startedAt: 1000, completedAt: 2500 }),
      createPayload({ runner: 'performance', totalTestCount: 2, failedTestCount: 0, startedAt: 1500, completedAt: 2000 })
    ];

    const model = createReportModel(payloads, new Date('2025-01-01T00:00:00.000Z'));

    expect(model.summary).toEqual({
      totalRunners: 2,
      totalTests: 6,
      failedTests: 1,
      startedAt: 1000,
      completedAt: 2500,
      durationMs: 1500
    });
  });
});

describe('generateReport', () => {
  it('writes latest report output and prunes history based on retention', async () => {
    const rootDir = await createWorkspace('retention-case');
    const payload = createPayload();
    const openPath = vi.fn();

    await generateReport(
      { rootDir, results: [payload], ci: true, retention: 2 },
      { now: () => new Date('2025-01-01T00:00:00.000Z'), openPath }
    );
    await generateReport(
      { rootDir, results: [payload], ci: true, retention: 2 },
      { now: () => new Date('2025-01-01T00:00:01.000Z'), openPath }
    );
    const third = await generateReport(
      { rootDir, results: [payload], ci: true, retention: 2 },
      { now: () => new Date('2025-01-01T00:00:02.000Z'), openPath }
    );

    const latestIndex = await readFile(path.join(rootDir, 'reports', 'latest', 'index.html'), 'utf8');
    expect(latestIndex).toContain('mic-check execution report');

    const historyEntries = await readdir(path.join(rootDir, 'reports', 'history'));
    expect(historyEntries).toHaveLength(2);
    expect(historyEntries).toContain(path.basename(third.historyDir));

    const allureFiles = await readdir(third.allureResultsDir);
    expect(allureFiles.some((file) => file.endsWith('-result.json'))).toBe(true);
    expect(openPath).not.toHaveBeenCalled();
  });

  it('auto-opens the latest report when ci mode is disabled', async () => {
    const rootDir = await createWorkspace('open-case');
    const openPath = vi.fn();

    const report = await generateReport(
      { rootDir, results: [createPayload()], ci: false },
      { now: () => new Date('2025-01-01T00:00:00.000Z'), openPath }
    );

    expect(openPath).toHaveBeenCalledWith(report.latestIndexPath);
  });
});

describe('shouldAutoOpenReport', () => {
  it('returns false when ci is enabled', () => {
    expect(shouldAutoOpenReport({ ci: true })).toBe(false);
  });
});

const createWorkspace = async (name: string): Promise<string> => {
  await mkdir(workspaceRoot, { recursive: true });
  const directory = path.join(workspaceRoot, name);
  createdDirectories.push(directory);
  await rm(directory, { recursive: true, force: true });
  await mkdir(directory, { recursive: true });
  return directory;
};

const createPayload = (overrides: Partial<RunnerReportPayload> = {}): RunnerReportPayload => ({
  runner: 'functional',
  journey: 'checkout',
  environment: 'dev',
  status: 'completed',
  failedTestCount: 0,
  totalTestCount: 1,
  startedAt: 1000,
  completedAt: 1500,
  ...overrides
});
