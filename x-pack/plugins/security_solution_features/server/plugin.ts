/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { PluginInitializerContext, Plugin, CoreSetup } from '@kbn/core/server';
import { ExperimentalFeatures } from '@kbn/security-solution-plugin/common';
import { AppFeatures } from './lib';

import {
  SecuritySolutionFeaturesPluginSetup,
  SecuritySolutionFeaturesPluginStart,
  SecuritySolutionFeaturesPluginSetupDependencies,
  SecuritySolutionFeaturesPluginStartDependencies,
} from './types';

export class SecuritySolutionFeaturesPlugin
  implements
    Plugin<
      SecuritySolutionFeaturesPluginSetup,
      SecuritySolutionFeaturesPluginStart,
      SecuritySolutionFeaturesPluginSetupDependencies,
      SecuritySolutionFeaturesPluginStartDependencies
    >
{
  // private config: SecuritySolutionFeaturesConfig;

  constructor(private readonly initializerContext: PluginInitializerContext) {
    // this.config = this.initializerContext.config.get<SecuritySolutionFeaturesConfig>();
  }

  public setup(
    _coreSetup: CoreSetup,
    pluginsSetup: SecuritySolutionFeaturesPluginSetupDependencies
  ) {
    return {
      registerKibanaFeatures: (experimentalFeatures: ExperimentalFeatures) => {
        const appFeatures = new AppFeatures(experimentalFeatures);
      },
    };
  }

  public start() {
    return {};
  }

  public stop() {}
}
