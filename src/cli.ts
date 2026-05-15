import { runProgram } from './cli/bootstrap';

export const main = async (argv: string[] = process.argv): Promise<void> => {
  await runProgram(argv);
};

if (require.main === module) {
  void main();
}
