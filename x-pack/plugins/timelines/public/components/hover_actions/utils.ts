/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Filter } from '@kbn/es-query';

export const getAdditionalScreenReaderOnlyContext = ({
  field,
  value,
}: {
  field: string;
  value?: string[] | string | null;
}): string => {
  if (value == null) {
    return field;
  }

  return Array.isArray(value) ? `${field} ${value.join(' ')}` : `${field} ${value}`;
};

export const createFilter = (
  dataViewId: string | null,
  key: string,
  value: string[] | string | null | undefined,
  negate: boolean = false
): Filter => {
  const queryValue = value != null ? (Array.isArray(value) ? value[0] : value) : null;
  const index = dataViewId ?? undefined;
  return queryValue != null
    ? {
        meta: {
          alias: null,
          negate,
          disabled: false,
          type: 'phrase',
          key,
          value: queryValue,
          params: {
            query: queryValue,
          },
          index,
        },
        query: {
          match: {
            [key]: {
              query: queryValue,
              type: 'phrase',
            },
          },
        },
      }
    : ({
        exists: {
          field: key,
        },
        meta: {
          alias: null,
          disabled: false,
          key,
          negate: value === undefined,
          type: 'exists',
          value: 'exists',
          index,
        },
      } as Filter);
};
