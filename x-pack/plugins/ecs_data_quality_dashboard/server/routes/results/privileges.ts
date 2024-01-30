/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { IScopedClusterClient } from '@kbn/core-elasticsearch-server';

/**
 * Checks user has the required privileges to do a results check for the given indices.
 * In order to be allowed to do a result check user needs:
 * `read`, `view_index_metadata` and (`monitor` or `manage`) index privileges.
 */
export const checkIndicesPrivileges = async ({
  client,
  indices,
}: {
  client: IScopedClusterClient;
  indices: string[];
}) => {
  const privileges = await client.asCurrentUser.security.hasPrivileges({
    index: [{ names: indices, privileges: ['read', 'view_index_metadata', 'monitor', 'manage'] }],
  });

  const hasRequiredIndexPrivilege: Record<string, boolean> = {};
  Object.entries(privileges.index).forEach(([indexName, indexPrivileges]) => {
    if (
      indexPrivileges?.read &&
      indexPrivileges?.view_index_metadata &&
      (indexPrivileges?.monitor || indexPrivileges?.manage)
    ) {
      hasRequiredIndexPrivilege[indexName] = true;
    } else {
      hasRequiredIndexPrivilege[indexName] = false;
    }
  });

  return hasRequiredIndexPrivilege;
};
