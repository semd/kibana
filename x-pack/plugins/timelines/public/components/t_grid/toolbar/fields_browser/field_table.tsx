/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  Criteria,
  Direction,
  EuiBasicTable,
  EuiBasicTableColumn,
  EuiInMemoryTable,
  EuiTableSelectionType,
  EuiTableSortingType,
  EuiText,
} from '@elastic/eui';
import { difference, noop, orderBy } from 'lodash';
import { useDispatch } from 'react-redux';
import { EuiSpacer } from '@elastic/eui/src/components/spacer';
import { BrowserFields, ColumnHeaderOptions } from '../../../../../common';
import * as i18n from './translations';
import {
  FieldItem,
  getColumnHeader,
  getFieldColumns,
  getFieldItems,
  // getCategoriesSelectedFieldIds,
} from './field_items';
import { CATEGORY_TABLE_CLASS_NAME, getFieldCount, TABLE_HEIGHT } from './helpers';
import {
  DATA_COLINDEX_ATTRIBUTE,
  DATA_ROWINDEX_ATTRIBUTE,
  onKeyDownFocusHandler,
} from '../../../../../common/utils/accessibility/helpers';
import { tGridActions } from '../../../../store/t_grid';
import { FieldTableColumns } from './types';

interface FieldTableProps {
  timelineId: string;
  columnHeaders: ColumnHeaderOptions[];
  /**
   * A map of categoryId -> metadata about the fields in that category,
   * filtered such that the name of every field in the category includes
   * the filter input (as a substring).
   */
  filteredBrowserFields: BrowserFields;
  /**
   * The category selected on the left-hand side of the field browser
   */
  selectedCategoryIds: string[];
  /** The text displayed in the search input */
  /** Invoked when a user chooses to view a new set of columns in the timeline */
  searchInput: string;
  /**
   * The field table columns to render
   */
  fieldTableColumns: FieldTableColumns;
}

const TableContainer = styled.div<{ height: number }>`
  margin-top: ${({ theme }) => theme.eui.euiSizeXS};
  border-top: ${({ theme }) => theme.eui.euiBorderThin};
  ${({ height }) => `height: ${height}px`};
  overflow: hidden;
`;
TableContainer.displayName = 'TableContainer';

const Counts = styled.span`
  font-weight: bold;
`;
Counts.displayName = 'Counts';

const FieldTableComponent: React.FC<FieldTableProps> = ({
  columnHeaders,
  filteredBrowserFields,
  fieldTableColumns,
  searchInput,
  selectedCategoryIds,
  timelineId,
}) => {
  const dispatch = useDispatch();
  const containerElement = useRef<HTMLDivElement | null>(null);

  const fieldItems = useMemo(
    () =>
      getFieldItems({
        browserFields: filteredBrowserFields,
        selectedCategoryIds,
        columnHeaders,
      }),
    [columnHeaders, filteredBrowserFields, selectedCategoryIds]
  );

  const onToggleColumn = useCallback(
    (fieldId: string) => {
      if (columnHeaders.some(({ id }) => id === fieldId)) {
        dispatch(
          tGridActions.removeColumn({
            columnId: fieldId,
            id: timelineId,
          })
        );
      } else {
        dispatch(
          tGridActions.upsertColumn({
            column: getColumnHeader(timelineId, fieldId),
            id: timelineId,
            index: 1,
          })
        );
      }
    },
    [columnHeaders, dispatch, timelineId]
  );

  const columns = useMemo(
    () => getFieldColumns({ highlight: searchInput, onToggleColumn, fieldTableColumns }),
    [onToggleColumn, searchInput, fieldTableColumns]
  );

  return (
    <>
      <EuiText data-test-subj="fields-count" size="xs">
        {i18n.FIELDS_SHOWING}
        <Counts> {fieldItems.length} </Counts>
        {i18n.FIELDS_COUNT(fieldItems.length)}
      </EuiText>

      <TableContainer
        className="euiTable--compressed"
        data-test-subj="category-table-container"
        height={TABLE_HEIGHT}
        ref={containerElement}
      >
        <EuiInMemoryTable
          className={`${CATEGORY_TABLE_CLASS_NAME} eui-yScroll`}
          items={fieldItems}
          itemId="name"
          columns={columns}
          pagination={true}
          sorting={true}
          hasActions={true}
        />
      </TableContainer>
    </>
  );
};

export const FieldTable = React.memo(FieldTableComponent);
