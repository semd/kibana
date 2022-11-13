/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { SavedObjectsClient, ElasticsearchClient } from '@kbn/core/server';

import { packagePolicyService } from '../services';
import { getAgentStatusForAgentPolicy } from '../services/agents';
import { listFleetServerHosts } from '../services/fleet_server_host';

const DEFAULT_USAGE = {
  total_all_statuses: 0,
  total_enrolled: 0,
  healthy: 0,
  unhealthy: 0,
  offline: 0,
  updating: 0,
  num_host_urls: 0,
};

export interface FleetServerUsage {
  total_enrolled: number;
  healthy: number;
  unhealthy: number;
  offline: number;
  updating: number;
  total_all_statuses: number;
  num_host_urls: number;
}

export const getFleetServerUsage = async (
  soClient?: SavedObjectsClient,
  esClient?: ElasticsearchClient
): Promise<any> => {
  if (!soClient || !esClient) {
    return DEFAULT_USAGE;
  }

  const fleetServerHosts = await listFleetServerHosts(soClient);
  const numHostsUrls = fleetServerHosts.items.flatMap((host) => host.host_urls).length;

  // Find all policies with Fleet server than query agent status
  let hasMore = true;
  const policyIds = new Set<string>();
  let page = 1;
  while (hasMore) {
    const res = await packagePolicyService.list(soClient, {
      page: page++,
      perPage: 20,
      kuery: 'ingest-package-policies.package.name:fleet_server',
    });

    for (const item of res.items) {
      policyIds.add(item.policy_id);
    }

    if (res.items.length === 0) {
      hasMore = false;
    }
  }

  if (policyIds.size === 0) {
    return DEFAULT_USAGE;
  }

  const { total, inactive, online, error, updating, offline } = await getAgentStatusForAgentPolicy(
    esClient,
    undefined,
    Array.from(policyIds)
      .map((policyId) => `(policy_id:"${policyId}")`)
      .join(' or ')
  );

  return {
    total_enrolled: total,
    healthy: online,
    unhealthy: error,
    offline,
    updating,
    total_all_statuses: total + inactive,
    num_host_urls: numHostsUrls,
  };
};
