/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import axios, { AxiosResponse } from 'axios';
import { Logger } from '@kbn/core/server';
import { request } from '../../lib/axios_utils';
import { ActionsConfigurationUtilities } from '../../actions_config';
import { PostTinesOptions } from './types';

// posts a webhook action to Tines
export async function post(
  { url, data }: PostTinesOptions,
  logger: Logger,
  configurationUtilities: ActionsConfigurationUtilities
): Promise<AxiosResponse> {
  const axiosInstance = axios.create();
  return await request({
    axios: axiosInstance,
    method: 'post',
    url,
    logger,
    data,
    configurationUtilities,
  });
}
