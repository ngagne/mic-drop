export type RunnerKind = 'functional' | 'performance';

export type RunnerExecutionStatus = 'completed' | 'no-tests' | 'skipped' | 'failed';

export interface RunnerReportPayload {
  runner: RunnerKind;
  journey?: string;
  environment?: string;
  status: RunnerExecutionStatus;
  failedTestCount: number;
  totalTestCount: number;
  startedAt: number;
  completedAt: number;
  metadata?: Record<string, unknown>;
}

export interface ReportSummary {
  totalRunners: number;
  totalTests: number;
  failedTests: number;
  startedAt: number;
  completedAt: number;
  durationMs: number;
}

export interface ReportModel {
  generatedAt: string;
  summary: ReportSummary;
  results: RunnerReportPayload[];
}

export interface ReportPaths {
  rootDir: string;
  latestDir: string;
  latestIndexPath: string;
  historyDir: string;
  rawResultsPath: string;
  allureResultsDir: string;
}

export interface ReportingRequest {
  results: RunnerReportPayload[];
  rootDir?: string;
  ci?: boolean;
  retention?: number;
  autoOpen?: boolean;
}
