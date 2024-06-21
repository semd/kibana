/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { SubFeatureConfig } from '@kbn/features-plugin/common';
import { i18n } from '@kbn/i18n';

export const IntegrationAssistantAPIAction = 'integrationAssistant-all';
export const IntegrationAssistantUICapability = 'integrationAssistant';

export const kibanaSubFeature: SubFeatureConfig = {
  name: i18n.translate('xpack.integrationAssistant.subFeature.name', {
    defaultMessage: 'AI-driven Integration creation',
  }),
  privilegeGroups: [
    {
      groupType: 'independent',
      privileges: [
        {
          id: 'integrationAssistant',
          includeIn: 'all',
          name: 'Create integrations',
          savedObject: { all: [], read: [] },
          api: [IntegrationAssistantAPIAction],
          ui: [IntegrationAssistantUICapability],
        },
      ],
    },
  ],
};
