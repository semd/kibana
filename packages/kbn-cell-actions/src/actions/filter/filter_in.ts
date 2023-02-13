/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

/**
 * This module does not have any external plugin dependency on purpose
 * It will be moved to a package in following iterations
 */

import { i18n } from '@kbn/i18n';
import type { FilterManager } from '@kbn/data-plugin/public';
import type { CellAction } from '../../types';
import { createFilter, isEmptyFilterValue } from './create_filter';

const ID = 'filterIn';
const ICON = 'plusInCircle';
const FILTER_IN = i18n.translate('cellActions.actions.filterIn', {
  defaultMessage: 'Filter In',
});

export const createFilterInAction = ({
  filterManager,
}: {
  filterManager: FilterManager;
}): CellAction => ({
  id: ID,
  type: ID,
  getIconType: (): string => ICON,
  getDisplayName: () => FILTER_IN,
  getDisplayNameTooltip: () => FILTER_IN,
  isCompatible: async ({ field }) => !!field.name,
  execute: async ({ field }) => {
    addFilterIn({ filterManager, fieldName: field.name, value: field.value });
  },
});

export const addFilterIn = ({
  filterManager,
  fieldName,
  value,
}: {
  filterManager: FilterManager | undefined;
  fieldName: string;
  value: string[] | string | null | undefined;
}) => {
  if (filterManager != null) {
    const filter = createFilter({
      key: fieldName,
      value,
      negate: isEmptyFilterValue(value),
    });
    filterManager.addFilters(filter);
  }
};
