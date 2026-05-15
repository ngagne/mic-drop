import { Command, InvalidArgumentError } from 'commander';

export interface RunCommandRawOptions {
  performance?: boolean;
  environment?: string;
  reportOnly?: boolean;
  parallel?: number;
  verbose?: boolean;
  tags?: string[];
  ci?: boolean;
}

export interface RunCommandOptions {
  performance: boolean;
  environment?: string;
  reportOnly: boolean;
  parallel?: number;
  verbose: boolean;
  tags: string[];
  ci: boolean;
}

const parseParallelValue = (value: string): number => {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed < 1) {
    throw new InvalidArgumentError('parallel must be a positive integer');
  }

  return parsed;
};

const collectTagValues = (value: string, previous: string[] = []): string[] => {
  const nextTags = value
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

  return [...previous, ...nextTags];
};

export const applyRunOptions = (command: Command): Command =>
  command
    .option('--performance', 'enable performance run mode')
    .option('--environment <name>', 'target environment name')
    .option('--report-only', 'skip execution and report from existing data')
    .option('--parallel <n>', 'parallel worker count', parseParallelValue)
    .option('--verbose', 'enable verbose output')
    .option('--tags <csvOrRepeatable>', 'filter by tags (csv or repeated flag)', collectTagValues, [])
    .option('--ci', 'enable CI-friendly behavior');

export const normalizeRunOptions = (rawOptions: RunCommandRawOptions): RunCommandOptions => ({
  performance: rawOptions.performance ?? false,
  environment: rawOptions.environment,
  reportOnly: rawOptions.reportOnly ?? false,
  parallel: rawOptions.parallel,
  verbose: rawOptions.verbose ?? false,
  tags: rawOptions.tags ?? [],
  ci: rawOptions.ci ?? false
});
