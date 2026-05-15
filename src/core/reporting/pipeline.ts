import { spawn } from 'node:child_process';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { writeAllureResults } from './allure';
import { writeHtmlReport } from './html';
import type { ReportModel, ReportPaths, ReportingRequest, RunnerReportPayload } from './models';

export interface ReportingDependencies {
  now: () => Date;
  openPath: (filePath: string) => void;
}

const defaultDependencies: ReportingDependencies = {
  now: () => new Date(),
  openPath: openPathInBrowser
};

const DEFAULT_RETENTION = 20;

export const generateReport = async (
  request: ReportingRequest,
  dependencies: ReportingDependencies = defaultDependencies
): Promise<ReportPaths> => {
  const rootDir = path.resolve(request.rootDir ?? process.cwd());
  const reportsRoot = path.join(rootDir, 'reports');
  const latestDir = path.join(reportsRoot, 'latest');
  const historyRoot = path.join(reportsRoot, 'history');
  const historyDir = path.join(historyRoot, createHistoryDirectoryName(dependencies.now()));
  const allureResultsDir = path.join(historyDir, 'allure-results');
  const rawResultsPath = path.join(historyDir, 'raw-results.json');
  const latestIndexPath = path.join(latestDir, 'index.html');

  const model = createReportModel(request.results, dependencies.now());

  await mkdir(historyDir, { recursive: true });
  await writeFile(rawResultsPath, JSON.stringify(model, null, 2), 'utf8');
  await Promise.all([
    writeAllureResults(model, allureResultsDir),
    writeHtmlReport(model, path.join(historyDir, 'index.html'))
  ]);

  await rm(latestDir, { recursive: true, force: true });
  await cp(historyDir, latestDir, { recursive: true });
  await pruneHistoryDirectories(historyRoot, request.retention ?? DEFAULT_RETENTION);

  if (shouldAutoOpenReport(request)) {
    dependencies.openPath(latestIndexPath);
  }

  return {
    rootDir: reportsRoot,
    latestDir,
    latestIndexPath,
    historyDir,
    rawResultsPath,
    allureResultsDir
  };
};

export const generateReportFromLatestRaw = async (
  request: Omit<ReportingRequest, 'results'>,
  dependencies: ReportingDependencies = defaultDependencies
): Promise<ReportPaths> => {
  const rootDir = path.resolve(request.rootDir ?? process.cwd());
  const latestRawPath = path.join(rootDir, 'reports', 'latest', 'raw-results.json');
  const payload = JSON.parse(await readFile(latestRawPath, 'utf8')) as ReportModel;

  return generateReport(
    {
      ...request,
      results: payload.results
    },
    dependencies
  );
};

export const shouldAutoOpenReport = (request: Pick<ReportingRequest, 'ci' | 'autoOpen'>): boolean => {
  if (request.ci) {
    return false;
  }

  return request.autoOpen ?? true;
};

export const createReportModel = (results: RunnerReportPayload[], now: Date): ReportModel => {
  const startedAt = results.length > 0 ? Math.min(...results.map((result) => result.startedAt)) : now.getTime();
  const completedAt = results.length > 0 ? Math.max(...results.map((result) => result.completedAt)) : now.getTime();

  return {
    generatedAt: now.toISOString(),
    summary: {
      totalRunners: results.length,
      totalTests: results.reduce((total, result) => total + result.totalTestCount, 0),
      failedTests: results.reduce((total, result) => total + result.failedTestCount, 0),
      startedAt,
      completedAt,
      durationMs: Math.max(0, completedAt - startedAt)
    },
    results
  };
};

const pruneHistoryDirectories = async (historyRoot: string, retention: number): Promise<void> => {
  await mkdir(historyRoot, { recursive: true });
  const entries = await readdir(historyRoot, { withFileTypes: true });
  const directories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => right.localeCompare(left));

  const staleDirectories = directories.slice(Math.max(0, retention));

  await Promise.all(
    staleDirectories.map(async (directory) => {
      await rm(path.join(historyRoot, directory), { recursive: true, force: true });
    })
  );
};

const createHistoryDirectoryName = (date: Date): string => {
  const iso = date.toISOString().replaceAll(':', '-').replaceAll('.', '-');
  return `run-${iso}`;
};

function openPathInBrowser(filePath: string): void {
  const platform = process.platform;

  if (platform === 'darwin') {
    spawn('open', [filePath], { detached: true, stdio: 'ignore' }).unref();
    return;
  }

  if (platform === 'win32') {
    spawn('cmd', ['/c', 'start', '', filePath], { detached: true, stdio: 'ignore' }).unref();
    return;
  }

  spawn('xdg-open', [filePath], { detached: true, stdio: 'ignore' }).unref();
}
