import fs from 'node:fs';
import path from 'node:path';

import YAML from 'yaml';

import { AppConfig, configSchema } from './schema';

export const SUPPORTED_ENVIRONMENTS = ['local', 'dev', 'qa', 'stage', 'prod'] as const;

export type EnvironmentName = (typeof SUPPORTED_ENVIRONMENTS)[number];

const ENV_VAR_PATTERN = /\$\{([A-Z0-9_]+)\}/g;
const configCache = new Map<string, AppConfig>();

export interface LoadConfigOptions {
  environment?: string;
  configRoot?: string;
  useCache?: boolean;
}

export function resolveEnvironment(overrideEnvironment?: string): EnvironmentName {
  const candidate = overrideEnvironment ?? process.env.ENVIRONMENT ?? 'local';

  if (!SUPPORTED_ENVIRONMENTS.includes(candidate as EnvironmentName)) {
    throw new Error(
      `Unsupported environment "${candidate}". Expected one of: ${SUPPORTED_ENVIRONMENTS.join(', ')}`
    );
  }

  return candidate as EnvironmentName;
}

function interpolateString(input: string, valuePath: string): string {
  return input.replace(ENV_VAR_PATTERN, (_token, envVar: string) => {
    const envValue = process.env[envVar];
    if (envValue === undefined) {
      throw new Error(`Missing environment variable "${envVar}" referenced at "${valuePath}"`);
    }

    return envValue;
  });
}

function interpolateEnvVariables(value: unknown, valuePath = 'config'): unknown {
  if (typeof value === 'string') {
    return interpolateString(value, valuePath);
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => interpolateEnvVariables(item, `${valuePath}[${index}]`));
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        interpolateEnvVariables(nestedValue, `${valuePath}.${key}`)
      ])
    );
  }

  return value;
}

export function loadConfig(options: LoadConfigOptions = {}): AppConfig {
  const environment = resolveEnvironment(options.environment);
  const configRoot = options.configRoot ?? path.resolve(process.cwd(), 'config');
  const cacheKey = `${configRoot}:${environment}`;

  if (options.useCache !== false) {
    const cached = configCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const configPath = path.join(configRoot, 'environments', `${environment}.yml`);

  if (!fs.existsSync(configPath)) {
    throw new Error(`Configuration file not found for environment "${environment}": ${configPath}`);
  }

  const fileContents = fs.readFileSync(configPath, 'utf-8');
  const rawConfig: unknown = YAML.parse(fileContents);
  const interpolatedConfig = interpolateEnvVariables(rawConfig);
  const parsedConfig = configSchema.parse(interpolatedConfig);

  if (options.useCache !== false) {
    configCache.set(cacheKey, parsedConfig);
  }

  return parsedConfig;
}

export function getConfig(environmentOverride?: string): AppConfig {
  return loadConfig({ environment: environmentOverride });
}

export function clearConfigCache(): void {
  configCache.clear();
}
