/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';
import { curry } from 'lodash';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { schema, TypeOf } from '@kbn/config-schema';
import { pipe } from 'fp-ts/lib/pipeable';
import { map, getOrElse } from 'fp-ts/lib/Option';
import { Logger } from '@kbn/core/server';
import { ActionType, ActionTypeExecutorOptions } from '@kbn/actions-plugin/server';
import { AlertingConnectorFeatureId, UptimeConnectorFeatureId, SecurityConnectorFeatureId, ActionTypeExecutorResult } from '@kbn/actions-plugin/common';
import { renderMustacheString } from '@kbn/actions-plugin/server/lib/mustache_renderer';
import { request } from '@kbn/actions-plugin/server/lib/axios_utils';
import { getRetryAfterIntervalFromHeaders } from '../../lib/http_response_retry_header';
import { promiseResult, isOk, Result } from '../../lib/result_type';
import { ValidatorServices } from '@kbn/actions-plugin/server/types';



export type TorqActionType = ActionType<
  ActionTypeConfigType,
  ActionTypeSecretsType,
  ActionParamsType,
  unknown
>;
export type TorqActionTypeExecutorOptions = ActionTypeExecutorOptions<
  ActionTypeConfigType,
  ActionTypeSecretsType,
  ActionParamsType
>;

const configSchemaProps = {
  webhookIntegrationUrl: schema.string(),
};
const ConfigSchema = schema.object(configSchemaProps);
export type ActionTypeConfigType = TypeOf<typeof ConfigSchema>;

// secrets definition
export type ActionTypeSecretsType = TypeOf<typeof SecretsSchema>;
const secretSchemaProps = {
  token: schema.nullable(schema.string()),
};
const SecretsSchema = schema.object(secretSchemaProps, {
  validate: (secrets) => {
    if (!secrets.token) {
      return i18n.translate('xpack.actions.builtin.torq.secrets.tokenRequiredErrorMessage', {
        defaultMessage: 'token is required',
      });
    }
  },
});

// params definition
export type ActionParamsType = TypeOf<typeof ParamsSchema>;
const ParamsSchema = schema.object({
  payload: schema.maybe(schema.string()),
});

export const ActionTypeId = '.torq';
// action type definition
export function getActionType({
  logger,
}: {
  logger: Logger;
}): TorqActionType {
  return {
    id: ActionTypeId,
    minimumLicenseRequired: 'gold',
    name: i18n.translate('xpack.actions.builtin.torqTitle', {
      defaultMessage: 'Torq',
    }),
    supportedFeatureIds: [
      AlertingConnectorFeatureId,
      UptimeConnectorFeatureId,
      SecurityConnectorFeatureId,
    ],
    validate: {
      config: {
        schema: schema.object(configSchemaProps),
        customValidator: validateActionTypeConfig,
      },
      secrets: {
        schema: SecretsSchema
      },
      params: {
        schema: ParamsSchema
      },
    },
    renderParameterTemplates,
    executor: curry(executor)({ logger }),
  };
}

function renderParameterTemplates(
  params: ActionParamsType,
  variables: Record<string, unknown>
): ActionParamsType {
  if (!params.payload) return params;
  return {
    payload: renderMustacheString(params.payload, variables, 'json'),
  };
}

function validateActionTypeConfig(
  configObject: ActionTypeConfigType,
  validatorServices: ValidatorServices,
) {
  const configuredUrl = configObject.webhookIntegrationUrl;
  let configureUrlObj: URL;
  try {
    configureUrlObj = new URL(configuredUrl);
  } catch (err) {
    throw new Error(
      i18n.translate('xpack.actions.builtin.torq.torqConfigurationErrorNoHostname', {
        defaultMessage: 'error configuring send to Torq action: unable to parse url: {err}',
        values: {
          err,
        },
      }));
  }

  try {
    validatorServices.configurationUtilities.ensureUriAllowed(configuredUrl);
  } catch (allowListError) {
    throw new Error(i18n.translate('xpack.actions.builtin.torq.torqConfigurationError', {
      defaultMessage: 'error configuring send to Torq action: {message}',
      values: {
        message: allowListError.message,
      },
    }));
  }

  if (configureUrlObj.hostname !== 'hooks.torq.io' && configureUrlObj.hostname !== 'localhost') {
    throw new Error(i18n.translate('xpack.actions.builtin.torq.torqConfigurationErrorInvalidHostname', {
      defaultMessage:
        'error configuring send to Torq action: url must begin with https://hooks.torq.io',
    }));
  }
}

// action executor
export async function executor(
  {
    logger,
  }: { logger: Logger; },
  execOptions: TorqActionTypeExecutorOptions
): Promise<ActionTypeExecutorResult<unknown>> {
  const actionId = execOptions.actionId;
  const { webhookIntegrationUrl } = execOptions.config;
  const { payload: data } = execOptions.params;
  const configurationUtilities = execOptions.configurationUtilities;

  const secrets: ActionTypeSecretsType = execOptions.secrets;
  const token = secrets.token;

  const axiosInstance = axios.create();
  console.log("token: %s", token);
  const result: Result<AxiosResponse, AxiosError<{ message: string }>> = await promiseResult(
    request({
      axios: axiosInstance,
      url: webhookIntegrationUrl,
      method: 'post',
      headers: {
        'X-Torq-Token': token || '',
        'Content-Type': "application/json",
      },
      data: JSON.parse(data || "null"),
      configurationUtilities,
      logger,
      validateStatus: (status: number) => status >= 200 && status < 300,
    })
  );

  if (isOk(result)) {
    const {
      value: { status, statusText },
    } = result;
    logger.debug(`response from Torq action "${actionId}": [HTTP ${status}] ${statusText}`);
    return successResult(actionId, data);
  }
  const { error } = result;
  return handleExecutionError(error, logger, actionId);
}

async function handleExecutionError(error: AxiosError<{ message: string }>, logger: Logger, actionId: string): Promise<ActionTypeExecutorResult<unknown>> {
  if (error.response) {
    const {
      status,
      statusText,
      headers: responseHeaders,
      data: { message: responseMessage },
    } = error.response;
    const responseMessageAsSuffix = responseMessage ? `: ${responseMessage}` : '';
    const message = `[${status}] ${statusText}${responseMessageAsSuffix}`;
    logger.error(`error on ${actionId} Torq event: ${message}`);
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    // special handling for 5xx
    if (status >= 500) {
      return retryResult(actionId, message);
    }

    // special handling for rate limiting
    if (status === 429) {
      return pipe(
        getRetryAfterIntervalFromHeaders(responseHeaders),
        map((retry) => retryResultSeconds(actionId, message, retry)),
        getOrElse(() => retryResult(actionId, message))
      );
    }

    if (status === 405) {
      return errorResultInvalidMethod(actionId, message);
    }

    if (status === 401) {
      return errorResultUnauthorised(actionId, message);
    }

    return errorResultInvalid(actionId, message);
  } else if (error.code) {
    const message = `[${error.code}] ${error.message}`;
    logger.error(`error on ${actionId} Torq event: ${message}`);
    return errorResultRequestFailed(actionId, message);
  } else if (error.isAxiosError) {
    const message = `${error.message}`;
    logger.error(`error on ${actionId} Torq event: ${message}`);
    return errorResultRequestFailed(actionId, message);
  }
  logger.error(`error on ${actionId} Torq action: unexpected error`);
  return errorResultUnexpectedError(actionId);
}

// Action Executor Result w/ internationalisation
function successResult(actionId: string, data: unknown): ActionTypeExecutorResult<unknown> {
  return { status: 'ok', data, actionId };
}

function errorResultInvalid(
  actionId: string,
  serviceMessage: string
): ActionTypeExecutorResult<void> {
  const errMessage = i18n.translate('xpack.actions.builtin.torq.invalidResponseErrorMessage', {
    defaultMessage: 'error triggering Torq workflow, invalid response',
  });
  return {
    status: 'error',
    message: errMessage,
    actionId,
    serviceMessage,
  };
}

function errorResultRequestFailed(
  actionId: string,
  serviceMessage: string
): ActionTypeExecutorResult<unknown> {
  const errMessage = i18n.translate('xpack.actions.builtin.torq.requestFailedErrorMessage', {
    defaultMessage: 'error triggering Torq workflow, request failed',
  });
  return {
    status: 'error',
    message: errMessage,
    actionId,
    serviceMessage,
  };
}

function errorResultInvalidMethod(
  actionId: string,
  serviceMessage: string
): ActionTypeExecutorResult<unknown> {
  const errMessage = i18n.translate('xpack.actions.builtin.torq.invalidMethodErrorMessage', {
    defaultMessage: 'error triggering Torq workflow, method is not supported',
  });
  return {
    status: 'error',
    message: errMessage,
    actionId,
    serviceMessage,
  };
}

function errorResultUnauthorised(
  actionId: string,
  serviceMessage: string
): ActionTypeExecutorResult<unknown> {
  const errMessage = i18n.translate('xpack.actions.builtin.torq.invalidMethodErrorMessage', {
    defaultMessage: 'error triggering Torq workflow, unauthorised',
  });
  return {
    status: 'error',
    message: errMessage,
    actionId,
    serviceMessage,
  };
}

function errorResultUnexpectedError(actionId: string): ActionTypeExecutorResult<void> {
  const errMessage = i18n.translate('xpack.actions.builtin.torq.unreachableErrorMessage', {
    defaultMessage: 'error triggering Torq workflow, unexpected error',
  });
  return {
    status: 'error',
    message: errMessage,
    actionId,
  };
}

function retryResult(actionId: string, serviceMessage: string): ActionTypeExecutorResult<void> {
  const errMessage = i18n.translate(
    'xpack.actions.builtin.torq.invalidResponseRetryLaterErrorMessage',
    {
      defaultMessage: 'error triggering Torq workflow, retry later',
    }
  );
  return {
    status: 'error',
    message: errMessage,
    retry: true,
    actionId,
    serviceMessage,
  };
}

function retryResultSeconds(
  actionId: string,
  serviceMessage: string,

  retryAfter: number
): ActionTypeExecutorResult<void> {
  const retryEpoch = Date.now() + retryAfter * 1000;
  const retry = new Date(retryEpoch);
  const retryString = retry.toISOString();
  const errMessage = i18n.translate(
    'xpack.actions.builtin.torq.invalidResponseRetryDateErrorMessage',
    {
      defaultMessage: 'error triggering Torq workflow, retry at {retryString}',
      values: {
        retryString,
      },
    }
  );
  return {
    status: 'error',
    message: errMessage,
    retry,
    actionId,
    serviceMessage,
  };
}
