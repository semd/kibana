/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useReducer, useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { v4 as uuidV4 } from 'uuid';
import { KibanaPageTemplate } from '@kbn/shared-ux-page-kibana-template';
import { TelemetryEventType } from '../../../services/telemetry/types';
import { useKibana } from '../../../common/hooks/use_kibana';
import { Header } from './header';
import { Footer } from './footer';
import { ConnectorStep, isConnectorStepReady } from './steps/connector_step';
import { IntegrationStep, isIntegrationStepReady } from './steps/integration_step';
import { DataStreamStep, isDataStreamStepReady } from './steps/data_stream_step';
import { ReviewStep, isReviewStepReady } from './steps/review_step';
import { DeployStep } from './steps/deploy_step';
import { reducer, initialState, ActionsProvider, type Actions, type State } from './state';

export const CreateIntegrationAssistant = React.memo(() => {
  const [state, dispatch] = useReducer(reducer, initialState);
  useTelemetry(state);

  const actions = useMemo<Actions>(
    () => ({
      setStep: (payload) => {
        dispatch({ type: 'SET_STEP', payload });
      },
      setConnectorId: (payload) => {
        dispatch({ type: 'SET_CONNECTOR_ID', payload });
      },
      setIntegrationSettings: (payload) => {
        dispatch({ type: 'SET_INTEGRATION_SETTINGS', payload });
      },
      setIsGenerating: (payload) => {
        dispatch({ type: 'SET_IS_GENERATING', payload });
      },
      setResult: (payload) => {
        dispatch({ type: 'SET_GENERATED_RESULT', payload });
      },
    }),
    []
  );

  const isNextStepEnabled = useMemo(() => {
    if (state.step === 1) {
      return isConnectorStepReady(state);
    } else if (state.step === 2) {
      return isIntegrationStepReady(state);
    } else if (state.step === 3) {
      return isDataStreamStepReady(state);
    } else if (state.step === 4) {
      return isReviewStepReady(state);
    }
    return false;
  }, [state]);

  const onGenerate = useCallback(() => actions.setIsGenerating(true), [actions]);

  return (
    <ActionsProvider value={actions}>
      <KibanaPageTemplate>
        <Header currentStep={state.step} isGenerating={state.isGenerating} />
        <KibanaPageTemplate.Section grow paddingSize="l">
          {state.step === 1 && <ConnectorStep connectorId={state.connectorId} />}
          {state.step === 2 && <IntegrationStep integrationSettings={state.integrationSettings} />}
          {state.step === 3 && (
            <DataStreamStep
              integrationSettings={state.integrationSettings}
              connectorId={state.connectorId}
              isGenerating={state.isGenerating}
            />
          )}
          {state.step === 4 && (
            <ReviewStep
              integrationSettings={state.integrationSettings}
              connectorId={state.connectorId}
              isGenerating={state.isGenerating}
              result={state.result}
            />
          )}
          {state.step === 5 && (
            <DeployStep
              integrationSettings={state.integrationSettings}
              result={state.result}
              connectorId={state.connectorId}
            />
          )}
        </KibanaPageTemplate.Section>
        <Footer
          currentStep={state.step}
          onGenerate={onGenerate}
          isGenerating={state.isGenerating}
          isNextStepEnabled={isNextStepEnabled}
        />
      </KibanaPageTemplate>
    </ActionsProvider>
  );
});
CreateIntegrationAssistant.displayName = 'CreateIntegrationAssistant';

const useTelemetry = (state: State) => {
  const { telemetry } = useKibana().services;
  const generation = useRef({ id: uuidV4(), startedAt: Date.now() });
  const step = useRef({ number: state.step, startedAt: Date.now() });

  useEffect(() => {
    if (state.step !== step.current.number) {
      if (state.step > step.current.number) {
        const { number: finishedStep, startedAt: finishedStepStartedAt } = step.current;

        // telemetry.reportEvent(TelemetryEventType.AssistantStepFinish, {
        //   processId: generation.current.id,
        //   stepId: finishedStep.toString(),
        //   duration: Date.now() - finishedStepStartedAt,
        //   userId: 'user-id', // TODO: get the user ID
        // });
      }
      step.current = { number: state.step, startedAt: Date.now() };
    }
  }, [state, telemetry]);
};
