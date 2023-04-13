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
import {
  PluginSetup as SecuritySolutionPluginSetup,
  PluginStart as SecuritySolutionPluginStart,
} from '@kbn/security-solution-plugin/server';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SecuritySolutionFeaturesPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SecuritySolutionFeaturesPluginStart {}

export interface SecuritySolutionFeaturesPluginSetupDependencies {
  features: PluginSetupContract;
  securitySolution: SecuritySolutionPluginSetup;
  serverlessSecurity?: ServerlessSecurityPluginSetup;
}

export interface SecuritySolutionFeaturesPluginStartDependencies {
  features: PluginStartContract;
  securitySolution: SecuritySolutionPluginStart;
  serverlessSecurity?: ServerlessSecurityPluginStart;
}
