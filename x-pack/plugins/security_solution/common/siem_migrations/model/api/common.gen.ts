/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/*
 * NOTICE: Do not edit this file manually.
 * This file is automatically generated by the OpenAPI Generator, @kbn/openapi-generator.
 *
 * info:
 *   title: Common SIEM Migrations Attributes
 *   version: not applicable
 */

import { z } from '@kbn/zod';

/**
 * The GenAI connector id to use.
 */
export type ConnectorId = z.infer<typeof ConnectorId>;
export const ConnectorId = z.string();

/**
 * The LangSmith options object.
 */
export type LangSmithOptions = z.infer<typeof LangSmithOptions>;
export const LangSmithOptions = z.object({
  /**
   * The project name.
   */
  projectName: z.string(),
  /**
   * The apiKey to use for tracing.
   */
  apiKey: z.string(),
});
