/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { AuthzEnabled, HttpServiceSetup, Logger, RouteAuthz } from '@kbn/core/server';
import { hiddenTypes as filesSavedObjectTypes } from '@kbn/files-plugin/server/saved_objects';
import type { FeaturesPluginSetup } from '@kbn/features-plugin/server';
import type {
  ProductFeatureKeyType,
  ProductFeaturesConfigurator,
} from '@kbn/security-solution-features';
import {
  getSecurityFeature,
  getSecurityV2Feature,
  getSecurityV3Feature,
  getCasesFeature,
  getCasesV2Feature,
  getCasesV3Feature,
  getAssistantFeature,
  getAttackDiscoveryFeature,
  getTimelineFeature,
  getNotesFeature,
  getSiemMigrationsFeature,
} from '@kbn/security-solution-features/product_features';
import { API_ACTION_PREFIX } from '@kbn/security-solution-features/actions';
import type { RecursiveReadonly } from '@kbn/utility-types';
import type { ExperimentalFeatures } from '../../../common';
import { type Overrides } from './product_features';
import {
  securityDefaultSavedObjects,
  securityNotesSavedObjects,
  securityTimelineSavedObjects,
  securityV1SavedObjects,
} from './security_saved_objects';
import { casesApiTags, casesUiCapabilities } from './cases_privileges';
import type { ConfigType } from '../../config';
import { ProductFeaturesFactory } from './product_features_factory';

export class ProductFeaturesService {
  private readonly experimentalFeatures: ExperimentalFeatures;
  private readonly overrides: Overrides;
  private productFeaturesFactory: ProductFeaturesFactory;
  private enabledProductFeatureKeys?: Set<ProductFeatureKeyType>;

  constructor(private readonly logger: Logger, private readonly config: ConfigType) {
    this.experimentalFeatures = this.config.experimentalFeatures;
    this.overrides = this.config.productFeatures?.overrides ?? {};

    this.productFeaturesFactory = new ProductFeaturesFactory(this.logger, this.overrides);

    // Security features
    this.productFeaturesFactory.createProductFeature(
      'security',
      getSecurityFeature({
        savedObjects: securityV1SavedObjects,
        experimentalFeatures: this.experimentalFeatures,
      })
    );
    this.productFeaturesFactory.createProductFeature(
      'security',
      getSecurityV2Feature({
        savedObjects: securityDefaultSavedObjects,
        experimentalFeatures: this.experimentalFeatures,
      })
    );
    this.productFeaturesFactory.createProductFeature(
      'security',
      getSecurityV3Feature({
        savedObjects: securityDefaultSavedObjects,
        experimentalFeatures: this.experimentalFeatures,
      })
    );

    // Cases features
    this.productFeaturesFactory.createProductFeature(
      'cases',
      getCasesFeature({
        uiCapabilities: casesUiCapabilities,
        apiTags: casesApiTags,
        savedObjects: { files: filesSavedObjectTypes },
      })
    );
    this.productFeaturesFactory.createProductFeature(
      'cases',
      getCasesV2Feature({
        uiCapabilities: casesUiCapabilities,
        apiTags: casesApiTags,
        savedObjects: { files: filesSavedObjectTypes },
      })
    );
    this.productFeaturesFactory.createProductFeature(
      'cases',
      getCasesV3Feature({
        uiCapabilities: casesUiCapabilities,
        apiTags: casesApiTags,
        savedObjects: { files: filesSavedObjectTypes },
      })
    );

    // Assistant feature
    this.productFeaturesFactory.createProductFeature(
      'securityAssistant',
      getAssistantFeature(this.experimentalFeatures)
    );

    // Attack Discovery feature
    this.productFeaturesFactory.createProductFeature(
      'attackDiscovery',
      getAttackDiscoveryFeature()
    );

    // Timeline feature
    this.productFeaturesFactory.createProductFeature(
      'timeline',
      getTimelineFeature({
        savedObjects: securityTimelineSavedObjects,
        experimentalFeatures: {},
      })
    );

    // Notes feature
    this.productFeaturesFactory.createProductFeature(
      'notes',
      getNotesFeature({
        savedObjects: securityNotesSavedObjects,
        experimentalFeatures: {},
      })
    );

    // Siem migrations feature
    this.productFeaturesFactory.createProductFeature('siemMigrations', getSiemMigrationsFeature());
  }

  public setup(featuresSetup: FeaturesPluginSetup) {
    this.productFeaturesFactory.setup(featuresSetup);
  }

  public setProductFeaturesConfigurator(configurator: ProductFeaturesConfigurator) {
    const productFeatureKeys = this.productFeaturesFactory.applyConfigurator(configurator);
    this.enabledProductFeatureKeys = new Set<ProductFeatureKeyType>(
      Object.freeze(productFeatureKeys)
    );
  }

  public isEnabled(productFeatureKey: ProductFeatureKeyType): boolean {
    if (!this.enabledProductFeatureKeys) {
      throw new Error('ProductFeatures has not yet been configured');
    }
    return this.enabledProductFeatureKeys.has(productFeatureKey);
  }

  public isActionRegistered(action: string): boolean {
    return this.productFeaturesFactory
      .getAllProductFeatures()
      .some((productFeature) => productFeature.isActionRegistered(action));
  }

  public getApiActionName = (apiPrivilege: string) => `api:${API_ACTION_PREFIX}${apiPrivilege}`;

  /**
   * Registers API access control for the Security Solution product features.
   * This middleware checks if the API routes are enabled based on the product feature configuration
   * and ensures that the API privileges are registered.
   * If a route is not available, it responds with a 404 Not Found.
   */
  public registerApiAccessControl(http: HttpServiceSetup) {
    // The `securitySolutionProductFeature:` prefix is used for ProductFeature based control.
    // Should be used only by routes that do not need RBAC, only direct productFeature control.
    const APP_FEATURE_TAG_PREFIX = 'securitySolutionProductFeature:';

    const isAuthzEnabled = (authz?: RecursiveReadonly<RouteAuthz>): authz is AuthzEnabled => {
      return Boolean((authz as AuthzEnabled)?.requiredPrivileges);
    };

    /** Returns true only if the API privilege is a security action and is disabled */
    const isApiPrivilegeSecurityAndDisabled = (apiPrivilege: string): boolean => {
      if (apiPrivilege.startsWith(API_ACTION_PREFIX)) {
        return !this.isActionRegistered(`api:${apiPrivilege}`);
      }
      return false;
    };

    http.registerOnPostAuth((request, response, toolkit) => {
      for (const tag of request.route.options.tags ?? []) {
        let isEnabled = true;
        if (tag.startsWith(APP_FEATURE_TAG_PREFIX)) {
          isEnabled = this.isEnabled(
            tag.substring(APP_FEATURE_TAG_PREFIX.length) as ProductFeatureKeyType
          );
        }

        if (!isEnabled) {
          this.logger.warn(
            `Accessing disabled route "${request.url.pathname}${request.url.search}": responding with 404`
          );
          return response.notFound();
        }
      }

      // This control ensures the action privileges have been registered by the productFeature service,
      // preventing full access (`*`) roles, such as superuser, from bypassing productFeature controls.
      const authz = request.route.options.security?.authz;
      if (isAuthzEnabled(authz)) {
        const disabled = authz.requiredPrivileges.some((privilegeEntry) => {
          if (typeof privilegeEntry === 'object') {
            if (privilegeEntry.allRequired) {
              if (
                privilegeEntry.allRequired.some((entry) =>
                  typeof entry === 'string'
                    ? isApiPrivilegeSecurityAndDisabled(entry)
                    : entry.anyOf.every(isApiPrivilegeSecurityAndDisabled)
                )
              ) {
                return true;
              }
            }
            if (privilegeEntry.anyRequired) {
              if (
                privilegeEntry.anyRequired.every((entry) =>
                  typeof entry === 'string'
                    ? isApiPrivilegeSecurityAndDisabled(entry)
                    : entry.allOf.some(isApiPrivilegeSecurityAndDisabled)
                )
              ) {
                return true;
              }
            }
            return false;
          } else {
            return isApiPrivilegeSecurityAndDisabled(privilegeEntry);
          }
        });
        if (disabled) {
          this.logger.warn(
            `Accessing disabled route "${request.url.pathname}${request.url.search}": responding with 404`
          );
          return response.notFound();
        }
      }

      return toolkit.next();
    });
  }
}
