import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { discoverArtifacts } from './engine';
import { DiscoveryError } from './errors';

const workspaceRoot = path.join(process.cwd(), 'src', 'core', 'discovery', '.test-workspace');
const createdDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    createdDirectories.splice(0).map(async (directory) => {
      await rm(directory, { recursive: true, force: true });
    })
  );
});

describe('discoverArtifacts', () => {
  it('discovers journeys and test files for functional and performance suites', async () => {
    const rootDir = await createWorkspace();

    await createFile(rootDir, 'src/journeys/checkout/functional/login.test.ts');
    await createFile(rootDir, 'src/journeys/checkout/functional/nested/refund.test.ts');
    await createFile(rootDir, 'src/journeys/checkout/functional/README.md');
    await createFile(rootDir, 'src/journeys/checkout/performance/load.test.ts');
    await createFile(rootDir, 'src/journeys/account/functional/profile.test.ts');

    const snapshot = await discoverArtifacts({ rootDir });

    expect(snapshot.journeys.map((journey) => journey.name)).toEqual(['account', 'checkout']);

    const checkoutJourney = snapshot.journeys.find((journey) => journey.name === 'checkout');
    expect(checkoutJourney).toBeDefined();
    expect(checkoutJourney?.functionalTests.map((test) => test.relativeFilePath)).toEqual([
      'src/journeys/checkout/functional/login.test.ts',
      'src/journeys/checkout/functional/nested/refund.test.ts'
    ]);
    expect(checkoutJourney?.performanceTests.map((test) => test.name)).toEqual(['load']);

    const functionalTest = checkoutJourney?.functionalTests[0];
    expect(functionalTest).toMatchObject({
      journeyName: 'checkout',
      testType: 'functional',
      name: 'login'
    });
  });

  it('returns empty journeys when journeys directory is missing', async () => {
    const rootDir = await createWorkspace();

    const snapshot = await discoverArtifacts({ rootDir });

    expect(snapshot.journeys).toEqual([]);
  });

  it('throws a typed error when journeys path is not a directory', async () => {
    const rootDir = await createWorkspace();
    await createFile(rootDir, 'journeys-file');

    await expect(discoverArtifacts({ rootDir, journeysDir: 'journeys-file' })).rejects.toMatchObject({
      name: 'DiscoveryError',
      code: 'DISCOVERY_ROOT_NOT_FOUND'
    } satisfies Partial<DiscoveryError>);
  });
});

const createWorkspace = async (): Promise<string> => {
  await mkdir(workspaceRoot, { recursive: true });
  const directory = await mkdtemp(path.join(workspaceRoot, 'case-'));
  createdDirectories.push(directory);
  return directory;
};

const createFile = async (rootDir: string, relativePath: string, content = '// test'): Promise<void> => {
  const absolutePath = path.join(rootDir, relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, content, 'utf8');
};
