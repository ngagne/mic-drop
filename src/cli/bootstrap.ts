import { Command } from 'commander';

import { registerListCommand } from './commands/list';
import { registerPerfCommand } from './commands/perf';
import { registerRunCommand } from './commands/run';

export const createProgram = (): Command => {
  const program = new Command();

  program.name('api-test').description('API test platform CLI').version('0.1.0');

  registerRunCommand(program);
  registerListCommand(program);
  registerPerfCommand(program);

  return program;
};

export const runProgram = async (argv: string[]): Promise<void> => {
  await createProgram().parseAsync(argv);
};
