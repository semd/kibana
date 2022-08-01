/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { mountWithIntl } from '@kbn/test-jest-helpers';
import TorqActionConnectorFields from './torq_connectors';
import { ConnectorFormTestProvider, waitForComponentToUpdate } from '../test_utils';
import { act, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('TorqActionConnectorFields renders', () => {
  test('all connector fields is rendered', async () => {
    const actionConnector = {
      actionTypeId: '.torq',
      name: 'torq',
      config: {
        webhook_integration_url: 'https://hooks.torq.io/v1/webhooks/fjdkljfekdfjlsa',
      },
      secrets: {
        token: 'testtoken',
      },
      isDeprecated: false,
    };

    const wrapper = mountWithIntl(
      <ConnectorFormTestProvider connector={actionConnector}>
        <TorqActionConnectorFields
          readOnly={false}
          isEdit={false}
          registerPreSubmitValidator={() => {}}
        />
      </ConnectorFormTestProvider>
    );

    await waitForComponentToUpdate();

    expect(wrapper.find('[data-test-subj="torqUrlText"]').length > 0).toBeTruthy();
    expect(wrapper.find('[data-test-subj="torqTokenInput"]').length > 0).toBeTruthy();
  });

  describe('Validation', () => {
    const onSubmit = jest.fn();
    const actionConnector = {
      actionTypeId: '.torq',
      name: 'torq',
      config: {
        webhook_integration_url: "https://hooks.torq.io/v1/webhooks/fjdksla",
      },
      secrets: {
        token: 'testtoken',
      },
      isDeprecated: false,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    const tests: Array<[string, string]> = [
      ['torqUrlText', 'not-valid'],
      ['torqTokenInput', ''],
    ];

    it('connector validation succeeds when connector config is valid', async () => {
      const { getByTestId } = render(
        <ConnectorFormTestProvider connector={actionConnector} onSubmit={onSubmit}>
          <TorqActionConnectorFields
            readOnly={false}
            isEdit={false}
            registerPreSubmitValidator={() => {}}
          />
        </ConnectorFormTestProvider>
      );

      await act(async () => {
        userEvent.click(getByTestId('form-test-provide-submit'));
      });

      expect(onSubmit).toBeCalledWith({
        data: {
          actionTypeId: '.torq',
          name: 'torq',
          config: {
            webhook_integration_url: "https://hooks.torq.io/v1/webhooks/fjdksla",
          },
          secrets: {
            token: 'testtoken',
          },
          isDeprecated: false,
        },
        isValid: true,
      });
    });

    it('connector validation fails when there is no webhook URL', async () => {
      const connector = {
        ...actionConnector,
        config: {
          webhook_integration_url: "",
        },
      };

      const { getByTestId } = render(
        <ConnectorFormTestProvider connector={connector} onSubmit={onSubmit}>
          <TorqActionConnectorFields
            readOnly={false}
            isEdit={false}
            registerPreSubmitValidator={() => {}}
          />
        </ConnectorFormTestProvider>
      );

      await act(async () => {
        userEvent.click(getByTestId('form-test-provide-submit'));
      });

      expect(onSubmit).toBeCalledWith({
        data: {},
        isValid: false,
      });
    });

    it('connector validation fails if the URL is not of a Torq webhook', async () => {
      const connector = {
        ...actionConnector,
        config: {
          webhook_integration_url: 'https://test.com',
        },
      };

      const { getByTestId } = render(
        <ConnectorFormTestProvider connector={connector} onSubmit={onSubmit}>
          <TorqActionConnectorFields
            readOnly={false}
            isEdit={false}
            registerPreSubmitValidator={() => {}}
          />
        </ConnectorFormTestProvider>
      );

      await act(async () => {
        userEvent.click(getByTestId('form-test-provide-submit'));
      });

      expect(onSubmit).toBeCalledWith({
        data: {},
        isValid: false,
      });
    });
  });
});
