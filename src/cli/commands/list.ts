import { Command } from 'commander';

import { listJourneys } from '../../core/catalog';

export const registerListCommand = (program: Command): void => {
  program
    .command('list')
    .description('List available journeys')
    .action(async () => {
      const journeys = await listJourneys();

      if (journeys.length === 0) {
        console.log('No journeys found.');
        return;
      }

      journeys.forEach((journey) => {
        console.log(
          `${journey.name} (functional=${journey.functionalTests}, performance=${journey.performanceTests}, total=${journey.testCount})`
        );
      });
    });
};
