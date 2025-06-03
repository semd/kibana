/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Logger } from '@kbn/core/server';
import type { FeaturesPluginSetup } from '@kbn/features-plugin/server';
import type {
  ProductFeatureKeyType,
  ProductFeatureParams,
  ProductFeaturesConfig,
  ProductFeaturesConfigurator,
} from '@kbn/security-solution-features';
import { ProductFeatures } from './product_features';
import type { ConfigType } from '../../config';

export type Overrides = ConfigType['productFeatures']['overrides'];

export class ProductFeaturesFactory {
  private productFeatures: Map<string, ProductFeatures>;
  private featureConfigurator: Partial<
    Record<keyof ProductFeaturesConfigurator, ProductFeatures[]>
  >;

  constructor(private readonly logger: Logger, private readonly overrides: Overrides) {
    this.productFeatures = new Map<string, ProductFeatures>();
    this.featureConfigurator = {};
  }

  public setup(featuresSetup: FeaturesPluginSetup) {
    this.productFeatures.forEach((productFeature) => {
      productFeature.init(featuresSetup);
    });
  }

  public createProductFeature<T extends string = string, S extends string = string>(
    configuratorId: keyof ProductFeaturesConfigurator,
    params: ProductFeatureParams<T, S>
  ): ProductFeatures<T, S> {
    const { baseKibanaFeature, subFeaturesMap, baseKibanaSubFeatureIds } = params;
    const id = baseKibanaFeature.id;
    if (this.productFeatures.has(id)) {
      throw new Error(`Product feature with id ${id} is already registered.`);
    }

    const productFeature = new ProductFeatures<T, S>(
      this.logger,
      this.overrides,
      subFeaturesMap,
      baseKibanaFeature,
      baseKibanaSubFeatureIds
    );

    this.productFeatures.set(id, productFeature);
    (this.featureConfigurator[configuratorId] ??= []).push(productFeature);

    return productFeature;
  }

  public getProductFeature(id: string): ProductFeatures | undefined {
    return this.productFeatures.get(id);
  }

  public getAllProductFeatures(): ProductFeatures[] {
    return Array.from(this.productFeatures.values());
  }

  public applyConfigurator(configurator: ProductFeaturesConfigurator): ProductFeatureKeyType[] {
    const productFeatureKeys: ProductFeatureKeyType[] = [];
    Object.entries(configurator).forEach(([configuratorId, configuratorFn]) => {
      const config: ProductFeaturesConfig = configuratorFn();
      productFeatureKeys.push(...config.keys());
      this.setFeaturesConfig(configuratorId as keyof ProductFeaturesConfigurator, config);
    });
    return productFeatureKeys;
  }

  private setFeaturesConfig<S extends string>(
    configuratorId: keyof ProductFeaturesConfigurator,
    productFeatureConfig: ProductFeaturesConfig<S>
  ): void {
    const features = this.featureConfigurator[configuratorId] ?? [];
    if (!features.length) {
      throw new Error(`No feature with "${configuratorId}" configurator has been created.`);
    }
    features.forEach((productFeature) => {
      productFeature.setConfig(productFeatureConfig);
    });
  }
}
