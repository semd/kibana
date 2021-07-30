/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import type { estypes } from '@elastic/elasticsearch';

/**
 * registering a new instance of the rule data client
 * in a new plugin will require updating the below data structure
 * to include the index name where the alerts as data will be written to.
 *
 * This doesn't work in combination with the `xpack.ruleRegistry.index`
 * setting, with which the user can change the index prefix.
 */

export const ALERTS_CONSUMERS = {
  APM: 'apm',
  LOGS: 'logs',
  INFRASTRUCTURE: 'infrastructure',
  OBSERVABILITY: 'observability',
  SIEM: 'siem',
  SYNTHETICS: 'synthetics',
} as const;
export type ALERTS_CONSUMERS = typeof ALERTS_CONSUMERS[keyof typeof ALERTS_CONSUMERS];

export const mapConsumerToIndexName: Record<ALERTS_CONSUMERS, string | string[]> = {
  apm: '.alerts-observability-apm',
  logs: '.alerts-observability.logs',
  infrastructure: '.alerts-observability.metrics',
  observability: '.alerts-observability',
  siem: ['.alerts-security.alerts', '.siem-signals'],
  synthetics: '.alerts-observability-synthetics',
};
export type ValidFeatureId = keyof typeof mapConsumerToIndexName;

export const validFeatureIds = Object.keys(mapConsumerToIndexName);
export const isValidFeatureId = (a: unknown): a is ValidFeatureId =>
  typeof a === 'string' && validFeatureIds.includes(a);

/**
 * Prevent javascript from returning Number.MAX_SAFE_INTEGER when Elasticsearch expects
 * Java's Long.MAX_VALUE. This happens when sorting fields by date which are
 * unmapped in the provided index
 *
 * Ref: https://github.com/elastic/elasticsearch/issues/28806#issuecomment-369303620
 *
 * return stringified Long.MAX_VALUE if we receive Number.MAX_SAFE_INTEGER
 * @param sortIds estypes.SearchSortResults | undefined
 * @returns SortResults
 */
export const getSafeSortIds = (sortIds: estypes.SearchSortResults | null | undefined) => {
  if (sortIds == null) {
    return sortIds;
  }
  return sortIds.map((sortId) => {
    // haven't determined when we would receive a null value for a sort id
    // but in case we do, default to sending the stringified Java max_int
    if (sortId == null || sortId === '' || sortId >= Number.MAX_SAFE_INTEGER) {
      return '9223372036854775807';
    }
    return sortId;
  });
};
