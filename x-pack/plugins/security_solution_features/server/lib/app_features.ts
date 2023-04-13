/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { PluginSetupContract as FeaturesPluginSetup } from '@kbn/features-plugin/server';
import type { ExperimentalFeatures } from '@kbn/security-solution-plugin/common';
import type { AppFeatureKey, AppFeatureKeys } from '../../common/types';
import type { AppFeatureKibanaConfig, AppFeaturesConfig } from './types';
import {
  getSecurityAppFeaturesConfig,
  getSecurityBaseKibanaFeature,
} from './security_kibana_features';
import {
  getCasesBaseKibanaFeature,
  getCasesAppFeaturesConfig,
} from './security_cases_kibana_features';
import { getMergedAppFeatureConfigs } from './app_features_config_merger';

type AppFeaturesMap = Map<AppFeatureKey, boolean>;

export class AppFeatures {
  private appFeatures: AppFeaturesMap;
  private experimentalFeatures: ExperimentalFeatures;
  private featuresSetup: FeaturesPluginSetup;

  constructor(featuresSetup: FeaturesPluginSetup, experimentalFeatures: ExperimentalFeatures) {
    this.featuresSetup = featuresSetup;
    this.experimentalFeatures = experimentalFeatures;
    // Set all feature keys to true by default
    this.appFeatures = new Map(
      Object.keys({
        ...getSecurityAppFeaturesConfig(this.experimentalFeatures),
        ...getCasesAppFeaturesConfig(),
      }).map((appFeatureKey) => [appFeatureKey as AppFeatureKey, true])
    );
  }

  public setFeatures(appFeatureKeys: AppFeatureKeys) {
    this.appFeatures = new Map(Object.entries(appFeatureKeys) as Array<[AppFeatureKey, boolean]>);
  }

  public isEnabled(appFeatureKey: AppFeatureKey): boolean {
    return this.appFeatures.get(appFeatureKey) ?? false;
  }

  public registerKibanaFeatures() {
    // register main security Kibana features
    const securityBaseKibanaFeature = getSecurityBaseKibanaFeature(this.experimentalFeatures);
    const enabledSecurityAppFeaturesConfigs = this.getEnabledAppFeaturesConfigs(
      getSecurityAppFeaturesConfig(this.experimentalFeatures)
    );
    this.featuresSetup.registerKibanaFeature(
      getMergedAppFeatureConfigs(securityBaseKibanaFeature, enabledSecurityAppFeaturesConfigs)
    );

    // register security cases Kibana features
    const securityCasesBaseKibanaFeature = getCasesBaseKibanaFeature();
    const enabledCasesAppFeaturesConfigs = this.getEnabledAppFeaturesConfigs(
      getCasesAppFeaturesConfig()
    );
    this.featuresSetup.registerKibanaFeature(
      getMergedAppFeatureConfigs(securityCasesBaseKibanaFeature, enabledCasesAppFeaturesConfigs)
    );
  }

  private getEnabledAppFeaturesConfigs(
    appFeaturesConfigs: Partial<AppFeaturesConfig>
  ): AppFeatureKibanaConfig[] {
    return Object.entries(appFeaturesConfigs).reduce<AppFeatureKibanaConfig[]>(
      (acc, [appFeatureKey, appFeatureConfig]) => {
        if (this.isEnabled(appFeatureKey as AppFeatureKey)) {
          acc.push(appFeatureConfig);
        }
        return acc;
      },
      []
    );
  }
}
