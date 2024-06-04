/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiButton, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n-react';
import { useKibana } from '../../../common/hooks/use_kibana';
import type { State } from '../state';

interface IntegrationAssistantBottomBarProps {
  currentStep: number;
  setStep: (step: number) => void;
  result: State['result'];
  onGenerate: () => void;
  isNextStepEnabled?: boolean;
}

export const IntegrationAssistantBottomBar = React.memo<IntegrationAssistantBottomBarProps>(
  ({ currentStep, setStep, result, onGenerate, isNextStepEnabled = false }) => {
    const integrationsUrl = useKibana().services.application.getUrlForApp('integrations');

    if (currentStep === 5) {
      return null;
    }
    return (
      <EuiFlexGroup direction="row" justifyContent="flexEnd" gutterSize="l">
        <EuiFlexItem grow={false}>
          <EuiButton color="danger" href={integrationsUrl}>
            <FormattedMessage
              id="xpack.fleet.integrationsAssistant.cancel"
              defaultMessage="Cancel"
            />
          </EuiButton>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton
            fill
            color="primary"
            onClick={() => setStep(currentStep + 1)}
            isDisabled={!isNextStepEnabled}
          >
            <FormattedMessage id="xpack.fleet.integrationsAssistant.next" defaultMessage="Next" />
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }
);
IntegrationAssistantBottomBar.displayName = 'IntegrationAssistantBottomBar';
