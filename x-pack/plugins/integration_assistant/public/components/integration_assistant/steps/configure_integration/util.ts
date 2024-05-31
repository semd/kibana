/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { IntegrationSettings } from '../../types';

export const isConfigureIntegrationReady = ({
  integrationSettings,
}: {
  integrationSettings: IntegrationSettings | undefined;
}) =>
  Boolean(
    integrationSettings?.title &&
      integrationSettings?.description &&
      integrationSettings?.dataStreamTitle &&
      integrationSettings?.dataStreamDescription
  );
