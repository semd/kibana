/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import type { ApplicationStart } from '@kbn/core/public';
import type { IEmbeddable } from '@kbn/embeddable-plugin/public';
import { LENS_EMBEDDABLE_TYPE, type Embeddable as LensEmbeddable } from '@kbn/lens-plugin/public';
import { APP_UI_ID } from '../../common/constants';
import { FIELDS_WITHOUT_CELL_ACTIONS } from '../common/lib/cell_actions/constants';

export const isInSecurityApp = async (applicationService: ApplicationStart): Promise<boolean> => {
  const currentAppId = await new Promise((resolve) => {
    applicationService.currentAppId$.subscribe(resolve).unsubscribe();
  });
  return currentAppId === APP_UI_ID;
};

export const isLensEmbeddable = (embeddable: IEmbeddable): embeddable is LensEmbeddable => {
  return embeddable.type === LENS_EMBEDDABLE_TYPE;
};

export const fieldHasCellActions = (field?: string) => {
  return field && !FIELDS_WITHOUT_CELL_ACTIONS.includes(field);
};
