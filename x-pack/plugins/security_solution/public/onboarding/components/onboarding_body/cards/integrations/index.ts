/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { i18n } from '@kbn/i18n';
import type { OnboardingCardConfig } from '../../../../types';
import { checkIntegrationsCardComplete } from './integrations_check_complete';
import { OnboardingHubCardId } from '../../../../constants';

export const integrationsCardConfig: OnboardingCardConfig = {
  id: OnboardingHubCardId.integrations,
  title: i18n.translate('xpack.securitySolution.onboarding.integrationsCard.title', {
    defaultMessage: 'Add data with integrations',
  }),
  icon: 'fleetApp',
  Component: React.lazy(
    () => import('./integrations_card' /* webpackChunkName: "onboarding_integrations_card" */)
  ),
  checkComplete: checkIntegrationsCardComplete,
  capabilities: ['fleet.all', 'fleetv2.all'],
  licenseType: 'basic',
};
