/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useEffect, useMemo } from 'react';
import { useFetch, REQUEST_NAMES } from '../../common/hooks/use_fetch';
import { useKibana } from '../../common/lib/kibana';
import { getDashboardsByTagIds } from '../../common/containers/dashboards/api';
import { useSecurityTags } from '../context/dashboard_context';

// TODO test
export const useFetchSecurityDashboards = () => {
  const { http } = useKibana().services;
  const securityTags = useSecurityTags();
  const tagIds = useMemo(() => securityTags?.map(({ id }) => id) ?? null, [securityTags]);

  const {
    fetch,
    data: dashboards,
    isLoading,
    error,
  } = useFetch(REQUEST_NAMES.SECURITY_DASHBOARDS, (loadedTagIds: string[]) =>
    getDashboardsByTagIds(http, loadedTagIds)
  );

  useEffect(() => {
    if (tagIds) {
      fetch(tagIds);
    }
  }, [fetch, tagIds]);

  return { dashboards, isLoading, error };
};
