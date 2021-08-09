/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiInMemoryTable, EuiTableSelectionType } from '@elastic/eui';
import { noop } from 'lodash/fp';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import {
  arrayIndexToAriaIndex,
  ColumnHeaderOptions,
  DATA_COLINDEX_ATTRIBUTE,
  DATA_ROWINDEX_ATTRIBUTE,
  onKeyDownFocusHandler,
} from '../../../../../common';
import type { BrowserFields, OnUpdateColumns } from '../../../../../common';

import { CategoryTitle } from './category_title';
import { getFieldColumns } from './field_items';
import type { FieldItem } from './field_items';
import { CATEGORY_TABLE_CLASS_NAME, TABLE_HEIGHT } from './helpers';

import * as i18n from './translations';
import { tGridActions } from '../../../../store/t_grid';

const TableContainer = styled.div<{ height: number; width: number }>`
  ${({ height }) => `height: ${height}px`};
  ${({ width }) => `width: ${width}px`};
  overflow: hidden;
`;

TableContainer.displayName = 'TableContainer';

/**
 * This callback, invoked via `EuiInMemoryTable`'s `rowProps, assigns
 * attributes to every `<tr>`.
 */
const getAriaRowindex = (fieldItem: FieldItem) =>
  fieldItem.ariaRowindex != null ? { 'data-rowindex': fieldItem.ariaRowindex } : {};

interface Props {
  categoryId: string;
  columnHeaders: ColumnHeaderOptions[];
  fieldItems: FieldItem[];
  filteredBrowserFields: BrowserFields;
  onCategorySelected: (categoryId: string) => void;
  onUpdateColumns: OnUpdateColumns;
  timelineId: string;
  width: number;
}

export const Category = React.memo<Props>(
  ({
    categoryId,
    columnHeaders,
    filteredBrowserFields,
    fieldItems,
    onUpdateColumns,
    timelineId,
    width,
  }) => {
    const containerElement = useRef<HTMLDivElement | null>(null);
    const onKeyDown = useCallback(
      (keyboardEvent: React.KeyboardEvent) => {
        onKeyDownFocusHandler({
          colindexAttribute: DATA_COLINDEX_ATTRIBUTE,
          containerElement: containerElement?.current,
          event: keyboardEvent,
          maxAriaColindex: 3,
          maxAriaRowindex: fieldItems.length,
          onColumnFocused: noop,
          rowindexAttribute: DATA_ROWINDEX_ATTRIBUTE,
        });
      },
      [fieldItems.length]
    );

    const fieldItemsWithRowindex = useMemo(
      () =>
        fieldItems.map((fieldItem, i) => ({
          ...fieldItem,
          ariaRowindex: arrayIndexToAriaIndex(i),
        })),
      [fieldItems]
    );

    const columns = useMemo(() => getFieldColumns(), []);

    // const dispatch = useDispatch();

    // const toggleColumn = useCallback(
    //   (column: ColumnHeaderOptions) => {
    //     console.log({ column });
    //     if (columnHeaders.some((c) => c.id === column.id)) {
    //       dispatch(
    //         tGridActions.removeColumn({
    //           columnId: column.id,
    //           id: timelineId,
    //         })
    //       );
    //     } else {
    //       dispatch(
    //         tGridActions.upsertColumn({
    //           column,
    //           id: timelineId,
    //           index: 1,
    //         })
    //       );
    //     }
    //   },
    //   [columnHeaders, dispatch, timelineId]
    // );

    const [selection, setSelection] = useState<FieldItem[]>([]);

    const selectionValue: EuiTableSelectionType<FieldItem> = {
      // selectable: (item) => ,
      // selectableMessage: () => 'selectable message',
      onSelectionChange: (items) => {
        setSelection(items);
        // toggleColumn({
        //   columnHeaderType: defaultColumnHeaderType,
        //   id: item.fieldId ?? '',
        //   initialWidth: DEFAULT_COLUMN_MIN_WIDTH,
        //   ...getAlertColumnHeader(timelineId, item.fieldId ?? ''),
        // });
      },
      initialSelected: fieldItemsWithRowindex,
    };

    return (
      <>
        <CategoryTitle
          categoryId={categoryId}
          filteredBrowserFields={filteredBrowserFields}
          onUpdateColumns={onUpdateColumns}
          timelineId={timelineId}
        />

        <TableContainer
          className="euiTable--compressed"
          data-test-subj="category-table-container"
          height={TABLE_HEIGHT}
          onKeyDown={onKeyDown}
          ref={containerElement}
          width={width}
        >
          <EuiInMemoryTable
            className={`${CATEGORY_TABLE_CLASS_NAME} eui-yScroll`}
            items={fieldItemsWithRowindex}
            itemId="fieldId"
            columns={columns}
            pagination={false}
            rowProps={getAriaRowindex}
            sorting={false}
            tableCaption={i18n.CATEGORY_FIELDS_TABLE_CAPTION(categoryId)}
            selection={selectionValue}
            isSelectable={true}
          />
        </TableContainer>
      </>
    );
  }
);

Category.displayName = 'Category';
