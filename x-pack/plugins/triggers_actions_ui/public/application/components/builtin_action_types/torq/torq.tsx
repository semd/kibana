/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { lazy } from 'react';
import { ActionTypeModel, GenericValidationResult } from '../../../../types';
import { TorqActionParams, TorqConfig, TorqSecrets } from '../types';
import * as i18n from './translations';

export function getActionType(): ActionTypeModel<TorqConfig, TorqSecrets, TorqActionParams> {
  return {
    id: '.torq',
    iconClass: lazy(() => import('./logo')),
    selectMessage: i18n.TORQ_SELECT_MESSAGE,
    actionTypeTitle: i18n.TORQ_ACTION_TYPE_TITLE,
    validateParams: async (
      actionParams: TorqActionParams
    ): Promise<GenericValidationResult<TorqActionParams>> => {
      const translations = await import('./translations');
      const errors = {
        body: [] as string[],
      }; // TODO: consider adding validations
      const validationResult = { errors };
      validationResult.errors = errors;
      if (!actionParams.body?.length) {
        errors.body.push(translations.BODY_REQUIRED);
      }
      return validationResult;
    },
    actionConnectorFields: lazy(() => import('./torq_connectors')),
    actionParamsFields: lazy(() => import('./torq_params')),
  };
}
