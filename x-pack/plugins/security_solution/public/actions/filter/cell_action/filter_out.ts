/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { addFilterOut, createFilterOutActionFactory } from '@kbn/cell-actions';
import { KibanaServices } from '../../../common/lib/kibana';
import { fieldHasCellActions } from '../../utils';
import type { SecurityAppStore } from '../../../common/store';
import { timelineSelectors } from '../../../timelines/store/timeline';
import { TimelineId } from '../../../../common/types';
import { isTimelineScope } from '../../../helpers';
import type { SecurityCellAction } from '../../types';

const ID = 'security_filterOut';

export const createFilterOutAction = ({
  store,
  order,
}: {
  store: SecurityAppStore;
  order?: number;
}): SecurityCellAction => {
  const {
    data: {
      query: { filterManager },
    },
  } = KibanaServices.get();

  const getTimelineById = timelineSelectors.getTimelineByIdSelector();
  const filterOutActionFactory = createFilterOutActionFactory({ filterManager });

  return filterOutActionFactory<SecurityCellAction>({
    id: ID,
    order,
    isCompatible: async ({ field }) => fieldHasCellActions(field.name),
    execute: async (executionContext) => {
      const { field, metadata } = executionContext;

      if (metadata?.scopeId && isTimelineScope(metadata.scopeId)) {
        const timelineFilterManager = getTimelineById(
          store.getState(),
          TimelineId.active
        )?.filterManager;
        addFilterOut(field.name, field.value, timelineFilterManager);
      } else {
        addFilterOut(field.name, field.value, filterManager);
      }
    },
  });
};
