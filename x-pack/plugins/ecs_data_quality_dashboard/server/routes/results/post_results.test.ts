/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { RESULTS_ROUTE_PATH } from '../../../common/constants';

import { serverMock } from '../../__mocks__/server';
import { requestMock } from '../../__mocks__/request';
import { requestContextMock } from '../../__mocks__/request_context';
import { postResultsRoute } from './post_results';
import { loggerMock, type MockedLogger } from '@kbn/logging-mocks';
import type { WriteResponseBase } from '@elastic/elasticsearch/lib/api/types';
import { resultBody, resultDocument } from './results.mock';

describe('postResultsRoute route', () => {
  let server: ReturnType<typeof serverMock.create>;
  let { context } = requestContextMock.createTools();
  let logger: MockedLogger;

  const req = requestMock.create({ method: 'post', path: RESULTS_ROUTE_PATH, body: resultBody });

  beforeEach(() => {
    jest.clearAllMocks();

    server = serverMock.create();
    logger = loggerMock.create();

    ({ context } = requestContextMock.createTools());

    postResultsRoute(server.router, logger);
  });

  it('indexes result', async () => {
    const mockIndex = context.core.elasticsearch.client.asInternalUser.index;
    mockIndex.mockResolvedValueOnce({ result: 'created' } as WriteResponseBase);

    const response = await server.inject(req, requestContextMock.convertContext(context));
    expect(mockIndex).toHaveBeenCalledWith({
      body: { ...resultDocument, '@timestamp': expect.any(Number) },
      index: await context.dataQualityDashboard.getResultsIndexName(),
    });

    expect(response.status).toEqual(200);
    expect(response.body).toEqual({ result: 'created' });
  });

  it('handles error', async () => {
    const errorMessage = 'Error!';
    const mockIndex = context.core.elasticsearch.client.asInternalUser.index;
    mockIndex.mockRejectedValueOnce({ message: errorMessage });

    const response = await server.inject(req, requestContextMock.convertContext(context));
    expect(response.status).toEqual(500);
    expect(response.body).toEqual({ message: errorMessage, status_code: 500 });
  });
});

describe('request validation', () => {
  let server: ReturnType<typeof serverMock.create>;
  let logger: MockedLogger;
  beforeEach(() => {
    server = serverMock.create();
    logger = loggerMock.create();
    postResultsRoute(server.router, logger);
  });

  test('disallows invalid pattern', () => {
    const req = requestMock.create({
      method: 'post',
      path: RESULTS_ROUTE_PATH,
      body: { rollup: resultBody.rollup },
    });
    const result = server.validate(req);

    expect(result.badRequest).toHaveBeenCalled();
  });
});
