export type DiscoveredTestType = 'functional' | 'performance';

export interface DiscoveredTestArtifact {
  journeyName: string;
  testType: DiscoveredTestType;
  name: string;
  filePath: string;
  relativeFilePath: string;
}

export interface DiscoveredJourneyArtifact {
  name: string;
  journeyPath: string;
  relativeJourneyPath: string;
  functionalTests: DiscoveredTestArtifact[];
  performanceTests: DiscoveredTestArtifact[];
  tests: DiscoveredTestArtifact[];
}

export interface DiscoverySnapshot {
  rootPath: string;
  journeys: DiscoveredJourneyArtifact[];
}
