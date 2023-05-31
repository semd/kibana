/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { AppFeatureKey, AppFeatureKeys } from '@kbn/security-solution-plugin/common';

export const DEFAULT_APP_FEATURES: AppFeatureKeys = {
  [AppFeatureKey.advancedInsights]: true,
  [AppFeatureKey.endpointResponseActions]: true,
  [AppFeatureKey.endpointExceptions]: true,
  [AppFeatureKey.casesConnectors]: true,
};
