import { Command } from 'commander';

import { runJourney } from '../../core/runner';
import { applyRunOptions, normalizeRunOptions, type RunCommandRawOptions } from '../parser';

export const registerPerfCommand = (program: Command): void => {
  applyRunOptions(program.command('perf [journey]').description('Alias for run with --performance')).action(
    async (journey: string | undefined, rawOptions: RunCommandRawOptions) => {
      const options = normalizeRunOptions(rawOptions);
      await runJourney({
        journey,
        options: {
          ...options,
          performance: true
        }
      });
    }
  );
};
