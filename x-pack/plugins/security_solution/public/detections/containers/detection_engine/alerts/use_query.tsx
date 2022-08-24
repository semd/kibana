/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { isEmpty } from 'lodash';
import { useMemo, useEffect, useState } from 'react';
import type { SetStateAction } from 'react';
import type React from 'react';
import type { fetchQueryRuleRegistryAlerts } from './api';
import { fetchQueryAlerts } from './api';
import type { AlertSearchResponse, QueryAlerts } from './types';
import { useTrackHttpRequest } from '../../../../common/lib/apm/use_track_http_request';

type Func = () => Promise<void>;

export interface ReturnQueryAlerts<Hit, Aggs> {
  loading: boolean;
  data: AlertSearchResponse<Hit, Aggs> | null;
  setQuery: React.Dispatch<SetStateAction<object>>;
  response: string;
  request: string;
  refetch: Func | null;
}

type FetchMethod = typeof fetchQueryAlerts | typeof fetchQueryRuleRegistryAlerts;
interface AlertsQueryParams {
  fetchMethod?: FetchMethod;
  query: object;
  indexName?: string | null;
  skip?: boolean;
  monitoringKey?: string;
}

/**
 * Wrapped `fetchMethod` hook that integrates
 * http-request monitoring using APM transactions.
 */
const useMonitoredFetchMethod = (fetchMethod: FetchMethod, monitoringKey?: string): FetchMethod => {
  const { startTracking } = useTrackHttpRequest();

  const monitoredFetchMethod = useMemo<FetchMethod>(() => {
    if (!monitoringKey) return fetchMethod;

    return async <Hit, Aggs>(params: QueryAlerts) => {
      const { endTrackingSuccess, endTrackingError } = startTracking({ name: monitoringKey });

      let result: AlertSearchResponse<Hit, Aggs>;
      try {
        result = await fetchMethod<Hit, Aggs>(params);
        endTrackingSuccess();
      } catch (err) {
        endTrackingError(params.signal.aborted);
        throw err;
      }
      return result;
    };
  }, [fetchMethod, monitoringKey, startTracking]);

  return monitoredFetchMethod;
};

/**
 * Hook for fetching Alerts from the Detection Engine API
 *
 * @param initialQuery query dsl object
 *
 */
export const useQueryAlerts = <Hit, Aggs>({
  fetchMethod = fetchQueryAlerts,
  query: initialQuery,
  indexName,
  skip,
  monitoringKey,
}: AlertsQueryParams): ReturnQueryAlerts<Hit, Aggs> => {
  const [query, setQuery] = useState(initialQuery);
  const [alerts, setAlerts] = useState<
    Pick<ReturnQueryAlerts<Hit, Aggs>, 'data' | 'setQuery' | 'response' | 'request' | 'refetch'>
  >({
    data: null,
    response: '',
    request: '',
    setQuery,
    refetch: null,
  });
  const [loading, setLoading] = useState(false);

  const fetchAlerts = useMonitoredFetchMethod(fetchMethod, monitoringKey);

  useEffect(() => {
    let isSubscribed = true;
    const abortCtrl = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);

        const alertResponse = await fetchAlerts<Hit, Aggs>({
          query,
          signal: abortCtrl.signal,
        });

        if (isSubscribed) {
          setAlerts({
            data: alertResponse,
            response: JSON.stringify(alertResponse, null, 2),
            request: JSON.stringify({ index: [indexName] ?? [''], body: query }, null, 2),
            setQuery,
            refetch: fetchData,
          });
        }
      } catch (error) {
        if (isSubscribed) {
          setAlerts({
            data: null,
            response: '',
            request: '',
            setQuery,
            refetch: fetchData,
          });
        }
      }
      if (isSubscribed) {
        setLoading(false);
      }
    };

    if (!isEmpty(query) && !skip) {
      fetchData();
    }
    if (skip) {
      setLoading(false);
      isSubscribed = false;
      abortCtrl.abort();
    }

    return () => {
      isSubscribed = false;
      abortCtrl.abort();
    };
  }, [query, indexName, skip, fetchAlerts]);

  return { loading, ...alerts };
};
