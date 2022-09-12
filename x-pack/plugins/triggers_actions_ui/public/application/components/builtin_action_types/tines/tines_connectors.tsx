/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useEffect } from 'react';
import { FormattedMessage } from '@kbn/i18n-react';

import { EuiFlexGroup, EuiFlexItem, EuiSpacer, EuiTitle } from '@elastic/eui';
import {
  UseField,
  useFormContext,
  useFormData,
} from '@kbn/es-ui-shared-plugin/static/forms/hook_form_lib';
import { Field } from '@kbn/es-ui-shared-plugin/static/forms/components';
import { fieldValidators } from '@kbn/es-ui-shared-plugin/static/forms/helpers';
import { matchPath, generatePath } from 'react-router-dom';
import { ActionConnectorFieldsProps } from '../../../../types';
import * as i18n from './translations';

const HTTP_VERBS = ['post', 'put'];

const { emptyField, urlField } = fieldValidators;

const PATH_PLACEHOLDER = 'MISSING_PATH';
const SECRET_KEY_PLACEHOLDER = 'MISSING_SECRET_KEY';
const WEBHOOK_PATH_PATTERN = '/webhook/:path?/:secretKey?';

const getWebhookUrlInfo = (url: string) => {
  try {
    const webhookUrl = new URL(url);
    const params =
      matchPath<{
        path: string;
        secretKey: string;
      }>(webhookUrl.pathname, WEBHOOK_PATH_PATTERN)?.params ?? undefined;
    return { webhookUrl, params };
  } catch {
    return {};
  }
};

const TinesActionConnectorFields: React.FunctionComponent<ActionConnectorFieldsProps> = ({
  readOnly,
}) => {
  const { setFieldValue } = useFormContext();
  const [{ config }] = useFormData();

  useEffect(() => {
    if (config?.url) {
      const { params: { path = '', secretKey = '' } = {} } = getWebhookUrlInfo(config.url);
      setFieldValue('__internal__.path', path !== PATH_PLACEHOLDER ? path : '');
      setFieldValue(
        '__internal__.secretKey',
        secretKey !== SECRET_KEY_PLACEHOLDER ? secretKey : ''
      );
    }
  }, [config?.url, setFieldValue]);

  const onPathChange = useCallback(
    ({ target: { value: path } }) => {
      const { webhookUrl, params: { secretKey } = {} } = getWebhookUrlInfo(config.url);
      if (webhookUrl) {
        webhookUrl.pathname = generatePath(WEBHOOK_PATH_PATTERN, {
          path: path || PATH_PLACEHOLDER,
          secretKey: secretKey || SECRET_KEY_PLACEHOLDER,
        });
        setFieldValue('config.url', webhookUrl.toString());
      }
    },
    [config, setFieldValue]
  );

  const onSecretKeyChange = useCallback(
    ({ target: { value: secretKey } }) => {
      const { webhookUrl, params: { path } = {} } = getWebhookUrlInfo(config.url);
      if (webhookUrl) {
        webhookUrl.pathname = generatePath(WEBHOOK_PATH_PATTERN, {
          path: path || PATH_PLACEHOLDER,
          secretKey: secretKey || SECRET_KEY_PLACEHOLDER,
        });
        setFieldValue('config.url', webhookUrl.toString());
      }
    },
    [config, setFieldValue]
  );

  return (
    <>
      <EuiFlexGroup direction="column" justifyContent="spaceBetween">
        <EuiFlexItem>
          <UseField
            path="config.url"
            config={{
              label: i18n.URL_LABEL,
              validations: [
                {
                  validator: urlField(i18n.URL_INVALID),
                },
              ],
            }}
            component={Field}
            componentProps={{
              euiFieldProps: { readOnly, 'data-test-subj': 'tinesUrlInput', fullWidth: true },
            }}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <UseField
            path="__internal__.path"
            config={{
              label: i18n.PATH_LABEL,
              validations: [
                {
                  validator: emptyField(i18n.PATH_REQUIRED),
                },
              ],
            }}
            component={Field}
            componentProps={{
              euiFieldProps: { readOnly, 'data-test-subj': 'tinesPathInput' },
              onChange: onPathChange,
            }}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiFlexGroup direction="column">
        <EuiFlexItem>
          <EuiSpacer size="m" />
          <EuiTitle size="xxs">
            <h4>
              <FormattedMessage
                id="xpack.triggersActionsUI.components.builtinActionTypes.tinesAction.authenticationLabel"
                defaultMessage="Authentication"
              />
            </h4>
          </EuiTitle>
          <EuiSpacer size="s" />
          <UseField
            path="__internal__.secretKey"
            config={{
              label: i18n.SECRET_LABEL,
              validations: [
                {
                  validator: emptyField(i18n.SECRET_KEY_REQUIRED),
                },
              ],
            }}
            component={Field}
            componentProps={{
              euiFieldProps: { readOnly, 'data-test-subj': 'tinesSecretInput', fullWidth: true },
              onChange: onSecretKeyChange,
            }}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
};

// eslint-disable-next-line import/no-default-export
export { TinesActionConnectorFields as default };
