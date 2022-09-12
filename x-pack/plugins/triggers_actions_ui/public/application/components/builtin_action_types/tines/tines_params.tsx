/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { i18n } from '@kbn/i18n';
import { EuiFlexGroup, EuiFlexItem, EuiFormRow } from '@elastic/eui';
import { ActionParamsProps } from '../../../../types';
import { TinesActionParams } from '../types';
import { JsonEditorWithMessageVariables } from '../../json_editor_with_message_variables';
import { TextFieldWithMessageVariables } from '../../text_field_with_message_variables';

const TinesParamsFields: React.FunctionComponent<ActionParamsProps<TinesActionParams>> = ({
  actionParams,
  editAction,
  index,
  messageVariables,
  errors,
}) => {
  const { body, dedupKey } = actionParams;

  const isDedupKeyInvalid: boolean = errors.dedupKey !== undefined && errors.dedupKey.length > 0;
  return (
    <EuiFlexGroup>
      <EuiFlexItem>
        <EuiFormRow
          fullWidth
          error={errors.dedupKey}
          isInvalid={isDedupKeyInvalid}
          label={i18n.translate(
            'xpack.triggersActionsUI.components.builtinActionTypes.tinesAction.dedupKeyTextFieldLabel',
            {
              defaultMessage: 'DedupKey (optional)',
            }
          )}
        >
          <TextFieldWithMessageVariables
            index={index}
            editAction={editAction}
            messageVariables={messageVariables}
            paramsProperty={'dedupKey'}
            inputTargetValue={dedupKey}
          />
        </EuiFormRow>
      </EuiFlexItem>
      <EuiFlexItem>
        <JsonEditorWithMessageVariables
          messageVariables={messageVariables}
          paramsProperty={'body'}
          inputTargetValue={body}
          label={i18n.translate(
            'xpack.triggersActionsUI.components.builtinActionTypes.tinesAction.bodyFieldLabel',
            {
              defaultMessage: 'Body',
            }
          )}
          aria-label={i18n.translate(
            'xpack.triggersActionsUI.components.builtinActionTypes.tinesAction.bodyCodeEditorAriaLabel',
            {
              defaultMessage: 'Code editor',
            }
          )}
          errors={errors.body as string[]}
          onDocumentsChange={(json: string) => {
            editAction('body', json, index);
          }}
          onBlur={() => {
            if (!body) {
              editAction('body', '', index);
            }
          }}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

// eslint-disable-next-line import/no-default-export
export { TinesParamsFields as default };
