/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useCallback, useMemo } from 'react';
import type { UseCellActions } from '@kbn/triggers-actions-ui-plugin/public/types';
import {
  useDataGridColumnsCellActions,
  type UseDataGridColumnsCellActionsProps,
} from '@kbn/cell-actions';
import { ALERT_DURATION, ALERT_REASON, TIMESTAMP } from '@kbn/rule-data-utils';
import { TimelineNonEcsData } from '@kbn/timelines-plugin/common';
import { OBSERVABILITY_CELL_ACTIONS_TRIGGER } from '../actions';

export const useAlertsCellActions: UseCellActions = ({ columns, data, dataGridRef }) => {
  const cellActionProps = useMemo<UseDataGridColumnsCellActionsProps>(
    () => ({
      triggerId: OBSERVABILITY_CELL_ACTIONS_TRIGGER,
      fields: columns.map((col) => ({
        name: col.id,
        type: getColumnType(col.id),
        values: (data as TimelineNonEcsData[][]).map(
          (row) => row.find((rowData) => rowData.field === col.id)?.value ?? []
        ),
      })),
      dataGridRef,
    }),
    [columns, data, dataGridRef]
  );

  const cellActions = useDataGridColumnsCellActions(cellActionProps);

  const getCellActions = useCallback(
    (_columnId: string, columnIndex: number) => {
      if (cellActions.length === 0) return [];
      return cellActions[columnIndex];
    },
    [cellActions]
  );

  return {
    getCellActions,
    visibleCellActions: 3,
  };
};

const getColumnType = (columnId: string): string => {
  switch (columnId) {
    case TIMESTAMP:
      return 'date';
    case ALERT_DURATION:
      return 'long';
    case ALERT_REASON:
      return 'text';
    default:
      return 'keyword';
  }
};
