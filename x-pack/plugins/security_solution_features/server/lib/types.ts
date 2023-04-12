/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { KibanaFeatureConfig, SubFeaturePrivilegeConfig } from '@kbn/features-plugin/common';
import type { AppFeatureKey, AppFeatureSecurityKey, AppFeatureCasesKey } from '../../common/types';

export type SubFeaturesPrivileges = RecursivePartial<SubFeaturePrivilegeConfig>;
export type AppFeatureKibanaConfig = RecursivePartial<KibanaFeatureConfig> & {
  subFeaturesPrivileges?: SubFeaturesPrivileges[];
};
export type AppFeaturesConfig = Record<AppFeatureKey, AppFeatureKibanaConfig>;
export type AppFeaturesSecurityConfig = Record<AppFeatureSecurityKey, AppFeatureKibanaConfig>;
export type AppFeaturesCasesConfig = Record<AppFeatureCasesKey, AppFeatureKibanaConfig>;

// Recursive partial object type. inspired on EUI RecursivePartial
export type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends NonAny[]
    ? T[P]
    : T[P] extends readonly NonAny[]
    ? T[P]
    : T[P] extends Array<infer U>
    ? Array<RecursivePartial<U>>
    : T[P] extends ReadonlyArray<infer U>
    ? ReadonlyArray<RecursivePartial<U>>
    : T[P] extends Set<infer V>
    ? Set<RecursivePartial<V>>
    : T[P] extends Map<infer K, infer V>
    ? Map<K, RecursivePartial<V>>
    : T[P] extends NonAny
    ? T[P]
    : RecursivePartial<T[P]>;
};
type NonAny = number | boolean | string | symbol | null;
