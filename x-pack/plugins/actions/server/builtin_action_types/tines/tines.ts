/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';
import { curry } from 'lodash';
import { Logger } from '@kbn/core/server';
import { ActionTypeExecutorResult, ValidatorServices } from '../../types';
import { ActionsConfigurationUtilities } from '../../actions_config';
import { AlertingConnectorFeatureId } from '../../../common';
import { post } from './api';
import { ConfigSchema, ParamsSchema, SecretsSchema } from './schema';
import type {
  ActionParamsType,
  ActionTypeConfigType,
  ActionTypeSecretsType,
  TinesActionType,
  TinesActionTypeExecutorOptions,
  TinesPayload,
} from './types';

export const ActionTypeId = '.tines';

export function getActionType({
  logger,
  configurationUtilities,
}: {
  logger: Logger;
  configurationUtilities: ActionsConfigurationUtilities;
}): TinesActionType {
  return {
    id: ActionTypeId,
    minimumLicenseRequired: 'gold',
    name: i18n.translate('xpack.actions.builtin.tinesTitle', {
      defaultMessage: 'Tines',
    }),
    supportedFeatureIds: [AlertingConnectorFeatureId],
    validate: {
      config: {
        schema: ConfigSchema,
        customValidator: validateActionTypeConfig,
      },
      secrets: {
        schema: SecretsSchema,
        customValidator: validateActionTypeSecrets,
      },
      params: {
        schema: ParamsSchema,
      },
      connector: validateConnector,
    },
    executor: curry(executor)({ logger, configurationUtilities }),
  };
}

function validateActionTypeConfig(
  { url }: ActionTypeConfigType,
  validatorServices: ValidatorServices
) {
  const { configurationUtilities } = validatorServices;

  if (url == null) {
    return i18n.translate('xpack.actions.builtin.tines.missingWebhookUrl', {
      defaultMessage: 'Provide valid config url',
    });
  }

  try {
    new URL(url);
  } catch (err) {
    throw new Error(
      i18n.translate('xpack.actions.builtin.tines.tinesConfigurationErrorNoHostname', {
        defaultMessage: 'Error configuring Tines action: unable to parse webhook url: {err}',
        values: {
          err,
        },
      })
    );
  }

  try {
    configurationUtilities.ensureUriAllowed(url);
  } catch (allowListError) {
    throw new Error(
      i18n.translate('xpack.actions.builtin.tines.tinesConfigurationError', {
        defaultMessage: 'Error configuring Tines action: {message}',
        values: {
          message: allowListError.message,
        },
      })
    );
  }
}

function validateConnector(
  config: ActionTypeConfigType,
  secrets: ActionTypeSecretsType
): string | null {
  // const { secretKey } = secrets;
  // const { webhookUrl, path } = config;

  // if (webhookUrl == null) {
  //   return i18n.translate('xpack.actions.builtin.tines.missingWebhookUrl', {
  //     defaultMessage: 'Provide valid config url',
  //   });
  // }
  // if (path == null) {
  //   return i18n.translate('xpack.actions.builtin.tines.missingPath', {
  //     defaultMessage: 'Provide valid config path',
  //   });
  // }
  // if (secretKey == null) {
  //   return i18n.translate('xpack.actions.builtin.tines.missingSecretKey', {
  //     defaultMessage: 'Provide valid secret key',
  //   });
  // }

  // const apiUrl = getApiUrl({ webhookUrl, path, secretKey });

  // try {
  //   if (apiUrl) {
  //     new URL(apiUrl);
  //   }
  // } catch (err) {
  //   throw new Error(
  //     i18n.translate('xpack.actions.builtin.tines.tinesConfigurationErrorNoHostname', {
  //       defaultMessage: 'Error configuring Tines action: unable to parse api url: {err}',
  //       values: {
  //         err,
  //       },
  //     })
  //   );
  // }
  return null;
}

function validateActionTypeSecrets(secretsObject: ActionTypeSecretsType) {
  // if (!secretsObject.secretKey) {
  //   throw new Error(
  //     i18n.translate('xpack.actions.builtin.tines.noSecretKeyProvided', {
  //       defaultMessage: 'Provide valid secret key to authenticate',
  //     })
  //   );
  // }
}

// action executor
export async function executor(
  {
    logger,
    configurationUtilities,
  }: { logger: Logger; configurationUtilities: ActionsConfigurationUtilities },
  execOptions: TinesActionTypeExecutorOptions
): Promise<ActionTypeExecutorResult<unknown>> {
  const actionId = execOptions.actionId;
  const { url } = execOptions.config;
  // const { secretKey }: ActionTypeSecretsType = execOptions.secrets;

  const data = getPayloadForRequest(execOptions.params);
  // const url = getApiUrl({ webhookUrl, path, secretKey });

  let result;
  try {
    if (!url) {
      throw new Error('Error: no url provided');
    }
    result = await post({ url, data }, logger, configurationUtilities);
  } catch (err) {
    const message = i18n.translate('xpack.actions.builtin.tines.postingErrorMessage', {
      defaultMessage: 'Error triggering Tines workflow',
    });
    logger.warn(`Error thrown triggering Tines workflow: ${err.message}`);
    return {
      status: 'error',
      actionId,
      message,
      serviceMessage: err.message,
    };
  }

  if (result.status >= 200 && result.status < 300) {
    const { status, statusText } = result;
    logger.debug(`Response from Tines action "${actionId}": [HTTP ${status}] ${statusText}`);

    return successResult(actionId, data);
  }

  if (result.status === 429 || result.status >= 500) {
    const message = i18n.translate('xpack.actions.builtin.tines.postingRetryErrorMessage', {
      defaultMessage: 'Error triggering Tines flow: http status {status}, retry later',
      values: {
        status: result.status,
      },
    });

    return {
      status: 'error',
      actionId,
      message,
      retry: true,
    };
  }
  const message = i18n.translate('xpack.actions.builtin.tines.unexpectedStatusErrorMessage', {
    defaultMessage: 'Error triggering Tines flow: unexpected status {status}',
    values: {
      status: result.status,
    },
  });

  return {
    status: 'error',
    actionId,
    message,
  };
}

// Action Executor Result w/ internationalization
function successResult(actionId: string, data: unknown): ActionTypeExecutorResult<unknown> {
  return { status: 'ok', data, actionId };
}

function getPayloadForRequest(params: ActionParamsType): TinesPayload {
  // Tines will assume the request is a test when the signalId and alertActionGroupName are not defined
  const data: TinesPayload = {
    alertActionGroupName: params.alertActionGroupName,
    signalId: params.signalId,
    ruleName: params.ruleName,
    date: params.date,
    severity: params.severity || 'High',
    spaceId: params.spaceId,
    tags: params.tags,
  };

  return data;
}

// function getApiUrl({
//   webhookUrl,
//   path,
//   secretKey,
// }: ActionTypeConfigType & Partial<ActionTypeSecretsType>) {
//   if (!webhookUrl || !path) {
//     return null;
//   }
//   return `${webhookUrl}/${path}${secretKey && `/${secretKey}`}`;
// }
