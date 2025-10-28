/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import pRetry from 'p-retry';
import {
  createRootWithCorePlugins,
  createTestServers,
  request,
} from '@kbn/core-test-helpers-kbn-server';

export type TestEnvironmentUtils = Awaited<ReturnType<typeof setupIntegrationEnvironment>>;

/**
 * Sets up an integration test environment with Elasticsearch and Kibana servers.
 * This creates a real Kibana instance with the workflows_management plugin loaded.
 *
 * Note: Plugins in src/platform/plugins/shared are auto-discovered when using
 * createRootWithCorePlugins with { oss: false }.
 */
export async function setupIntegrationEnvironment() {
  const testIndex = 'kibana-test-workflows';

  /**
   * Start the servers and set them up
   */
  const { startES } = createTestServers({
    adjustTimeout: jest.setTimeout,
    settings: {
      es: {
        license: 'basic',
      },
    },
  });

  const manageES = await startES();

  const root = createRootWithCorePlugins(
    {
      server: { restrictInternalApis: false },
    },
    { oss: false }
  );
  await root.preboot();
  await root.setup();

  const coreStart = await root.start();
  const esClient = coreStart.elasticsearch.client.asInternalUser;

  /**
   * Clean up methods
   */
  const cleanupAfterEach = async () => {
    // Clean up any created workflows
    await esClient.indices.delete({ index: testIndex, ignore_unavailable: true });
  };

  const cleanupAfterAll = async () => {
    await root.shutdown();
    await manageES.stop();
  };

  /**
   * Wait for endpoints to be available
   */
  await pRetry(
    () =>
      request
        .get(root, '/api/licensing/info')
        .set('x-elastic-internal-origin', 'workflows-test')
        .expect(200),
    { retries: 5 }
  );

  return {
    manageES,
    esClient,
    root,
    coreStart,
    testIndex,
    request,
    cleanupAfterEach,
    cleanupAfterAll,
  };
}
