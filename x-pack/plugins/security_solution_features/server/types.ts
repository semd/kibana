/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { PluginSetupContract, PluginStartContract } from '@kbn/features-plugin/server';
import type {
  ServerlessSecurityPluginSetup,
  ServerlessSecurityPluginStart,
} from '@kbn/serverless-security/server';
import type { ExperimentalFeatures } from '@kbn/security-solution-plugin/common';

export interface SecuritySolutionFeaturesPluginSetup {
  registerKibanaFeatures: (experimentalFeatures: ExperimentalFeatures) => void;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SecuritySolutionFeaturesPluginStart {}

export interface SecuritySolutionFeaturesPluginSetupDependencies {
  serverless: ServerlessSecurityPluginSetup;
  features: PluginSetupContract;
}

export interface SecuritySolutionFeaturesPluginStartDependencies {
  security: ServerlessSecurityPluginStart;
  features: PluginStartContract;
}
