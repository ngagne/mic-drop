import { describe, expect, it } from 'vitest';

import { createRequestBuilder, interpolatePath, toPactumRequestConfig } from './request-builder';

describe('request builder', () => {
  it('interpolates path and query into URL', () => {
    const built = createRequestBuilder({
      method: 'GET',
      baseUrl: 'https://api.example.test/',
      path: '/accounts/:accountId/users/:userId',
      pathParams: {
        accountId: 'acct-1',
        userId: 99
      },
      query: {
        include: ['roles', 'settings'],
        active: true
      },
      headers: {
        'x-request-id': '123'
      }
    });

    expect(built.path).toBe('/accounts/acct-1/users/99');
    expect(built.url).toBe('https://api.example.test/accounts/acct-1/users/99?include=roles&include=settings&active=true');
    expect(built.headers['x-request-id']).toBe('123');
  });

  it('maps built request into pactum-friendly config', () => {
    const built = createRequestBuilder({
      method: 'POST',
      path: '/items/:id',
      pathParams: { id: 'abc' },
      query: { filter: ['new', 'sale'] },
      body: { name: 'item' }
    });

    const config = toPactumRequestConfig(built);

    expect(config).toEqual({
      method: 'POST',
      path: '/items/abc',
      headers: undefined,
      queryParams: { filter: ['new', 'sale'] },
      body: { name: 'item' }
    });
  });

  it('throws when required path params are missing', () => {
    expect(() => interpolatePath('/items/:id', {})).toThrow('Missing path parameter: id');
  });
});
