/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Logger } from '@kbn/core/server';
import type {
  FeatureKibanaPrivileges,
  KibanaFeatureConfig,
  FeaturesPluginSetup,
} from '@kbn/features-plugin/server';
import type {
  ProductFeaturesConfig,
  AppSubFeaturesMap,
  BaseKibanaFeatureConfig,
} from '@kbn/security-solution-features';
import { set } from '@kbn/safer-lodash-set';
import { ProductFeaturesConfigMerger } from './product_features_config_merger';
import type { ConfigType } from '../../config';

export type Overrides = ConfigType['productFeatures']['overrides'];

export class ProductFeatures<T extends string = string, S extends string = string> {
  private featureConfigMerger: ProductFeaturesConfigMerger;
  private featuresSetup?: FeaturesPluginSetup;
  private readonly registeredActions: Set<string>;

  constructor(
    private readonly logger: Logger,
    private readonly overrides: Overrides,
    subFeaturesMap: AppSubFeaturesMap<S>,
    private readonly baseKibanaFeature: BaseKibanaFeatureConfig,
    private readonly baseKibanaSubFeatureIds: T[]
  ) {
    this.featureConfigMerger = new ProductFeaturesConfigMerger(this.logger, subFeaturesMap);
    this.registeredActions = new Set();
  }

  public init(featuresSetup: FeaturesPluginSetup) {
    this.featuresSetup = featuresSetup;
  }

  public setConfig(productFeatureConfig: ProductFeaturesConfig<S>) {
    if (this.featuresSetup == null) {
      throw new Error(
        'Cannot sync kibana features as featuresSetup is not present. Did you call init?'
      );
    }

    const completeProductFeatureConfig = this.featureConfigMerger.mergeProductFeatureConfigs(
      this.getBaseKibanaFeature(),
      this.baseKibanaSubFeatureIds,
      Array.from(productFeatureConfig.values())
    );

    this.logger.debug(() => JSON.stringify(completeProductFeatureConfig));
    this.featuresSetup.registerKibanaFeature(completeProductFeatureConfig);
    this.addRegisteredActions(completeProductFeatureConfig);
  }

  private addRegisteredActions(config: KibanaFeatureConfig) {
    const privileges: FeatureKibanaPrivileges[] = [];

    // get main privileges
    if (config.privileges?.all) {
      privileges.push(config.privileges?.all);
    }
    if (config.privileges?.read) {
      privileges.push(config.privileges?.read);
    }

    // get sub features privileges
    config.subFeatures?.forEach((subFeature) => {
      subFeature.privilegeGroups.forEach((privilegeGroup) => {
        privilegeGroup.privileges.forEach((privilege) => {
          privileges.push(privilege);
        });
      });
    });

    // add the actions from all the registered privileges
    privileges.forEach((privilege) => {
      privilege.api?.forEach((apiAction) => {
        this.registeredActions.add(`api:${apiAction}`);
      });
      privilege.ui?.forEach((uiAction) => {
        this.registeredActions.add(`ui:${uiAction}`);
      });
    });
  }

  public isActionRegistered(action: string) {
    return this.registeredActions.has(action);
  }

  /**
   * Returns the base Kibana feature with overrides applied.
   * If no overrides are defined, it returns the base Kibana feature as is.
   * If overrides are defined, it applies them using lodash set to the base feature.
   * This allows for dynamic configuration of the base Kibana feature without modifying the original object.
   * @returns BaseKibanaFeatureConfig
   */
  private getBaseKibanaFeature(): BaseKibanaFeatureConfig {
    const baseKibanaFeature = this.baseKibanaFeature;
    const baseKibanaFeatureOverrides =
      this.overrides[baseKibanaFeature.id]?.baseKibanaFeature ?? [];

    for (const override of baseKibanaFeatureOverrides) {
      const { path, value } = override;
      set(baseKibanaFeature, path, value);
    }

    if (baseKibanaFeature.id === 'siem') {
      console.log(baseKibanaFeature.privileges.all.replacedBy.minimal);
    }

    return baseKibanaFeature;
  }
}
