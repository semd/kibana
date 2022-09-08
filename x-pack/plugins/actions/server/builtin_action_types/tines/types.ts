/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { TypeOf } from '@kbn/config-schema';
import { ActionType, ActionTypeExecutorOptions } from '../../types';
import { ConfigSchema, SecretsSchema, ParamsSchema } from './schema';

export type ActionTypeConfigType = TypeOf<typeof ConfigSchema>;
export type ActionTypeSecretsType = TypeOf<typeof SecretsSchema>;
export type ActionParamsType = TypeOf<typeof ParamsSchema>;

export type TinesActionType = ActionType<
  ActionTypeConfigType,
  ActionTypeSecretsType,
  ActionParamsType,
  unknown
>;
export type TinesActionTypeExecutorOptions = ActionTypeExecutorOptions<
  ActionTypeConfigType,
  ActionTypeSecretsType,
  ActionParamsType
>;

export interface TinesPayload {
  alertActionGroupName?: string;
  signalId?: string;
  ruleName?: string;
  date?: string;
  severity: string;
  spaceId?: string;
  tags?: string;
}

export interface PostTinesOptions {
  url: string;
  data: TinesPayload;
}
