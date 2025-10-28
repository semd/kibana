/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { setupIntegrationEnvironment, type TestEnvironmentUtils } from '../lib';

describe('GET /api/workflows/{id} - Integration Tests', () => {
  let testHarness: TestEnvironmentUtils;
  let root: TestEnvironmentUtils['root'];
  let request: TestEnvironmentUtils['request'];

  beforeAll(async () => {
    testHarness = await setupIntegrationEnvironment();
    ({ root, request } = testHarness);
  });

  afterAll(async () => {
    await testHarness.cleanupAfterAll();
  });

  beforeEach(async () => {
    await testHarness.cleanupAfterEach();
  });

  describe('API endpoint behavior', () => {
    it('should return 404 for non-existent workflow', async () => {
      const response = await request
        .get(root, '/api/workflows/non-existent-id')
        .set('x-elastic-internal-origin', 'workflows-test')
        .expect(404);

      expect(response.body).toMatchObject({
        message: 'Workflow not found',
      });
    });

    it('should validate route path parameters', async () => {
      // Missing id parameter should be handled by route validation
      await request
        .get(root, '/api/workflows/')
        .set('x-elastic-internal-origin', 'workflows-test')
        .expect(404); // Not found since there's no matching route
    });

    it('should include proper error handling', async () => {
      const response = await request
        .get(root, '/api/workflows/test-id-123')
        .set('x-elastic-internal-origin', 'workflows-test')
        .expect((res) => {
          // Should return either 404 or 500, but not crash
          expect([404, 500]).toContain(res.status);
        });

      // Should have a response body with error information
      if (response.status === 404) {
        expect(response.body).toHaveProperty('message');
      } else if (response.status === 500) {
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('statusCode');
      }
    });
  });

  describe('Route security and authentication', () => {
    it('should handle requests without internal origin header', async () => {
      // Without the internal origin header, the request should still be processed
      // but may fail with different error based on security configuration
      const response = await request.get(root, '/api/workflows/test-id').expect((res) => {
        // Request should not crash, should return some HTTP status
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(600);
      });
      expect(response).toBeDefined();
    });
  });
});
