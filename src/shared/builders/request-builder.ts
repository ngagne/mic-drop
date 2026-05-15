import type { HttpMethod } from '../constants';
import type { PrimitiveValue, QueryValue } from '../schemas';

export interface RequestBuilderInput<TBody = unknown> {
  method: HttpMethod;
  path: string;
  baseUrl?: string;
  pathParams?: Record<string, PrimitiveValue>;
  query?: Record<string, QueryValue>;
  headers?: Record<string, string>;
  body?: TBody;
  timeoutMs?: number;
}

export interface BuiltRequest<TBody = unknown> {
  method: HttpMethod;
  path: string;
  url: string;
  headers: Record<string, string>;
  query: URLSearchParams;
  body?: TBody;
  timeoutMs?: number;
}

export interface PactumRequestConfig<TBody = unknown> {
  method: HttpMethod;
  path: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string | string[]>;
  body?: TBody;
}

const toQueryParams = (query: Record<string, QueryValue> | undefined): URLSearchParams => {
  const searchParams = new URLSearchParams();
  if (!query) {
    return searchParams;
  }

  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, String(item)));
      continue;
    }

    searchParams.set(key, String(value));
  }

  return searchParams;
};

export const interpolatePath = (path: string, pathParams: Record<string, PrimitiveValue> = {}): string =>
  path.replace(/:([a-zA-Z0-9_]+)/g, (_, key: string) => {
    const value = pathParams[key];
    if (value === undefined || value === null) {
      throw new Error(`Missing path parameter: ${key}`);
    }

    return encodeURIComponent(String(value));
  });

export const createRequestBuilder = <TBody = unknown>(input: RequestBuilderInput<TBody>): BuiltRequest<TBody> => {
  const path = interpolatePath(input.path, input.pathParams);
  const query = toQueryParams(input.query);
  const baseUrl = input.baseUrl ? input.baseUrl.replace(/\/$/, '') : '';
  const queryText = query.toString();
  const url = `${baseUrl}${path}${queryText.length > 0 ? `?${queryText}` : ''}`;

  return {
    method: input.method,
    path,
    url,
    headers: { ...(input.headers ?? {}) },
    query,
    body: input.body,
    timeoutMs: input.timeoutMs
  };
};

const toStringQueryMap = (query: URLSearchParams): Record<string, string | string[]> => {
  const output: Record<string, string | string[]> = {};

  query.forEach((value, key) => {
    const existing = output[key];
    if (existing === undefined) {
      output[key] = value;
      return;
    }

    output[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
  });

  return output;
};

export const toPactumRequestConfig = <TBody = unknown>(request: BuiltRequest<TBody>): PactumRequestConfig<TBody> => ({
  method: request.method,
  path: request.path,
  headers: Object.keys(request.headers).length > 0 ? request.headers : undefined,
  queryParams: request.query.size > 0 ? toStringQueryMap(request.query) : undefined,
  body: request.body
});
