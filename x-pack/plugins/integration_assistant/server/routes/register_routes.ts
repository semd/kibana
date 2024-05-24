/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { IRouter } from '@kbn/core/server';
import { registerEcsRoutes } from './ecs_routes';
import { registerIntegrationBuilderRoutes } from './build_integration_routes';
import { registerCategorizationRoutes } from './categorization_routes';
import { registerRelatedRoutes } from './related_routes';

export function registerRoutes(router: IRouter) {
  registerEcsRoutes(router);
  registerIntegrationBuilderRoutes(router);
  registerCategorizationRoutes(router);
  registerRelatedRoutes(router);
}
