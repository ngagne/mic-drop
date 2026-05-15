import { Command } from 'commander';

import { runJourney } from '../../core/runner';
import { applyRunOptions, normalizeRunOptions, type RunCommandRawOptions } from '../parser';

export const registerRunCommand = (program: Command): void => {
  applyRunOptions(program.command('run [journey]').description('Run one journey or the full suite')).action(
    async (journey: string | undefined, rawOptions: RunCommandRawOptions) => {
      const options = normalizeRunOptions(rawOptions);
      await runJourney({ journey, options });
    }
  );
};
