/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { ServerlessPluginSetup, ServerlessPluginStart } from '@kbn/serverless/public';
import {
  ObservabilityPublicSetup,
  ObservabilityPublicStart,
} from '@kbn/observability-plugin/public';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ServerlessObservabilityPluginSetup {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ServerlessObservabilityPluginStart {}

export interface ServerlessObservabilityPluginSetupDependencies {
  observability: ObservabilityPublicSetup;
  serverless: ServerlessPluginSetup;
}

export interface ServerlessObservabilityPluginStartDependencies {
  observability: ObservabilityPublicStart;
  serverless: ServerlessPluginStart;
}
