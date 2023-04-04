/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { KibanaFeatureConfig } from '@kbn/features-plugin/common';
import type { AppFeatureKey } from '../../../common';
import type { RecursivePartial } from '../../../common/utility_types';

export type AppFeatureKibanaConfig = RecursivePartial<KibanaFeatureConfig>;
export type AppFeaturesConfig = Partial<Record<AppFeatureKey, AppFeatureKibanaConfig>>;
