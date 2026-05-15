import { readdir } from 'node:fs/promises';
import path from 'node:path';

import { DiscoveryError } from './errors';
import type { DiscoveredJourneyArtifact, DiscoveredTestArtifact, DiscoveredTestType, DiscoverySnapshot } from './models';

export interface DiscoveryOptions {
  rootDir?: string;
  journeysDir?: string;
}

export const discoverArtifacts = async (options: DiscoveryOptions = {}): Promise<DiscoverySnapshot> => {
  const rootPath = path.resolve(options.rootDir ?? process.cwd());
  const journeysPath = path.resolve(rootPath, options.journeysDir ?? path.join('src', 'journeys'));

  const journeyDirectories = await listJourneyDirectories(journeysPath);

  const journeys = await Promise.all(
    journeyDirectories.map(async (directory) => {
      const journeyPath = path.join(journeysPath, directory);
      const [functionalTests, performanceTests] = await Promise.all([
        discoverTestsForType(rootPath, journeyPath, directory, 'functional'),
        discoverTestsForType(rootPath, journeyPath, directory, 'performance')
      ]);

      return {
        name: directory,
        journeyPath,
        relativeJourneyPath: normalizeRelativePath(path.relative(rootPath, journeyPath)),
        functionalTests,
        performanceTests,
        tests: [...functionalTests, ...performanceTests]
      } satisfies DiscoveredJourneyArtifact;
    })
  );

  return {
    rootPath,
    journeys: journeys.sort((left, right) => left.name.localeCompare(right.name))
  };
};

const listJourneyDirectories = async (journeysPath: string): Promise<string[]> => {
  try {
    const entries = await readdir(journeysPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((left, right) => left.localeCompare(right));
  } catch (error) {
    if (isNodeErrorWithCode(error, 'ENOENT')) {
      return [];
    }

    throw new DiscoveryError('DISCOVERY_ROOT_NOT_FOUND', `Unable to read journeys directory: ${journeysPath}`, error);
  }
};

const discoverTestsForType = async (
  rootPath: string,
  journeyPath: string,
  journeyName: string,
  testType: DiscoveredTestType
): Promise<DiscoveredTestArtifact[]> => {
  const targetDirectory = path.join(journeyPath, testType);
  const files = await listTestFiles(targetDirectory);

  return files
    .map((filePath) => ({
      journeyName,
      testType,
      name: path.basename(filePath, '.test.ts'),
      filePath,
      relativeFilePath: normalizeRelativePath(path.relative(rootPath, filePath))
    }))
    .sort((left, right) => left.relativeFilePath.localeCompare(right.relativeFilePath));
};

const listTestFiles = async (directoryPath: string): Promise<string[]> => {
  const discoveredFiles: string[] = [];
  const directoriesToScan: string[] = [directoryPath];

  while (directoriesToScan.length > 0) {
    const currentDirectory = directoriesToScan.pop();
    if (!currentDirectory) {
      continue;
    }

    let entries;
    try {
      entries = await readdir(currentDirectory, { withFileTypes: true });
    } catch (error) {
      if (isNodeErrorWithCode(error, 'ENOENT')) {
        continue;
      }

      throw new DiscoveryError('DISCOVERY_IO_ERROR', `Unable to inspect test directory: ${currentDirectory}`, error);
    }

    for (const entry of entries) {
      const absolutePath = path.join(currentDirectory, entry.name);

      if (entry.isDirectory()) {
        directoriesToScan.push(absolutePath);
        continue;
      }

      if (entry.isFile() && absolutePath.endsWith('.test.ts')) {
        discoveredFiles.push(absolutePath);
      }
    }
  }

  return discoveredFiles;
};

const normalizeRelativePath = (value: string): string => value.split(path.sep).join('/');

const isNodeErrorWithCode = (error: unknown, code: string): error is NodeJS.ErrnoException =>
  typeof error === 'object' && error !== null && 'code' in error && (error as NodeJS.ErrnoException).code === code;
