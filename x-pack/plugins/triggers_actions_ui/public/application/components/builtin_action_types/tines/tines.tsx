/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { lazy } from 'react';
import { i18n } from '@kbn/i18n';
import { ActionTypeModel, GenericValidationResult } from '../../../../types';
import { TinesActionParams, TinesConfig, TinesSecrets } from '../types';

export function getActionType(): ActionTypeModel<TinesConfig, TinesSecrets, TinesActionParams> {
  return {
    id: '.tines',
    iconClass: lazy(() => import('./logo')),
    selectMessage: i18n.translate(
      'xpack.triggersActionsUI.components.builtinActionTypes.tinesAction.selectMessageText',
      {
        defaultMessage: 'Send events to a Story.',
      }
    ),
    actionTypeTitle: i18n.translate(
      'xpack.triggersActionsUI.components.builtinActionTypes.tinesAction.actionTypeTitle',
      {
        defaultMessage: 'Tines data',
      }
    ),
    validateParams: async (
      actionParams: TinesActionParams
    ): Promise<GenericValidationResult<TinesActionParams>> => {
      const translations = await import('./translations');
      const errors = {
        body: new Array<string>(),
        dedupKey: new Array<string>(),
      };
      const validationResult = { errors };
      validationResult.errors = errors;
      if (!actionParams.body?.length) {
        errors.body.push(translations.BODY_REQUIRED);
      }
      if (!actionParams.dedupKey?.length) {
        errors.body.push(translations.DEDUP_KEY_REQUIRED);
      }
      return validationResult;
    },
    actionConnectorFields: lazy(() => import('./tines_connectors')),
    actionParamsFields: lazy(() => import('./tines_params')),
  };
}
