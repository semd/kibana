/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { memo, useCallback } from 'react';
import { FormattedMessage } from '@kbn/i18n/react';
import { EuiFormRow, EuiLink, EuiFieldText, EuiFlexItem, EuiFlexGroup } from '@elastic/eui';
import { useKibana } from '../../../../common/lib/kibana';
import type { ActionConnectorFieldsProps } from '../../../../types';
import * as i18n from './translations';
import type { ServiceNowActionConnector } from './types';
import { isFieldInvalid } from './helpers';

interface Props {
  action: ActionConnectorFieldsProps<ServiceNowActionConnector>['action'];
  errors: ActionConnectorFieldsProps<ServiceNowActionConnector>['errors'];
  readOnly: boolean;
  isLoading: boolean;
  editActionConfig: ActionConnectorFieldsProps<ServiceNowActionConnector>['editActionConfig'];
}

const CredentialsApiUrlComponent: React.FC<Props> = ({
  action,
  errors,
  isLoading,
  readOnly,
  editActionConfig,
}) => {
  const { docLinks } = useKibana().services;
  const { apiUrl } = action.config;

  const isApiUrlInvalid = isFieldInvalid(apiUrl, errors.apiUrl);

  const onChangeApiUrlEvent = useCallback(
    (event?: React.ChangeEvent<HTMLInputElement>) =>
      editActionConfig('apiUrl', event?.target.value ?? ''),
    [editActionConfig]
  );

  return (
    <EuiFlexGroup direction="column">
      <EuiFlexItem>
        <p>
          <FormattedMessage
            id="xpack.triggersActionsUI.components.builtinActionTypes.serviceNowAction.apiUrlHelpLabel"
            defaultMessage="Please provide the full URL to the desired ServiceNow instance. If you do not have one, you can {instance}"
            values={{
              instance: (
                <EuiLink href={docLinks.links.alerting.serviceNowAction} target="_blank">
                  {i18n.SETUP_DEV_INSTANCE}
                </EuiLink>
              ),
            }}
          />
        </p>
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiFormRow
          id="apiUrl"
          fullWidth
          error={errors.apiUrl}
          isInvalid={isApiUrlInvalid}
          label={i18n.API_URL_LABEL}
          helpText={i18n.API_URL_HELPTEXT}
        >
          <EuiFieldText
            fullWidth
            isInvalid={isApiUrlInvalid}
            name="apiUrl"
            readOnly={readOnly}
            value={apiUrl || ''} // Needed to prevent uncontrolled input error when value is undefined
            data-test-subj="credentialsApiUrlFromInput"
            onChange={onChangeApiUrlEvent}
            onBlur={() => {
              if (!apiUrl) {
                onChangeApiUrlEvent();
              }
            }}
            disabled={isLoading}
          />
        </EuiFormRow>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

export const CredentialsApiUrl = memo(CredentialsApiUrlComponent);
