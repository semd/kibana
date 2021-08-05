/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { UpdateDocumentByQueryResponse } from 'elasticsearch';
import { useKibana } from '../../../../../src/plugins/kibana_react/public';
import { AlertStatus } from '../../../timelines/common';

export const RAC_BULK_UPDATE_STATUS_URL = '/internal/rac/alerts/bulk_update';

/**
 * Update alert status by query
 *
 * @param query of alerts to update
 * @param status to update to('open' / 'closed' / 'in-progress')
 * @param signal AbortSignal for cancelling request
 *
 * @throws An error if response is not OK
 */
export const useUpdateAlertsStatus = (): {
  updateAlertStatus: (params: {
    index: string;
    status: AlertStatus;
    ids?: string[];
    query?: string;
  }) => Promise<UpdateDocumentByQueryResponse>;
} => {
  const { http } = useKibana().services;

  return {
    updateAlertStatus: ({ index, ids, query, status }) =>
      http!.fetch(RAC_BULK_UPDATE_STATUS_URL, {
        method: 'POST',
        body: JSON.stringify({ index, status, ids, query }),
      }),
  };
};
