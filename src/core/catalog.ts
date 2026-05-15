import { discoverArtifacts, type DiscoveryOptions } from './discovery';

export interface JourneySummary {
  name: string;
  functionalTests: number;
  performanceTests: number;
  testCount: number;
}

export const getJourneyCatalog = (options?: DiscoveryOptions) => discoverArtifacts(options);

export const listJourneys = async (options?: DiscoveryOptions): Promise<JourneySummary[]> => {
  const snapshot = await getJourneyCatalog(options);

  return snapshot.journeys.map((journey) => ({
    name: journey.name,
    functionalTests: journey.functionalTests.length,
    performanceTests: journey.performanceTests.length,
    testCount: journey.tests.length
  }));
};
