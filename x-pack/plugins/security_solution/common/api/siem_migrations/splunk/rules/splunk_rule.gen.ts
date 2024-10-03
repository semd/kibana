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
 *   title: Common Splunk Rules Attributes
 *   version: not applicable
 */

import { z } from '@kbn/zod';

export type SplunkRule = z.infer<typeof SplunkRule>;
export const SplunkRule = z.object({
  /**
   * The Splunk rule name.
   */
  title: z.string().min(1),
  /**
   * The Splunk rule search query.
   */
  search: z.string().min(1),
  /**
   * The Splunk rule description.
   */
  description: z.string().min(1),
  /**
   * String array containing the rule Mitre Attack technique IDs.
   */
  mitreAttackIds: z.array(z.string()).optional(),
});
