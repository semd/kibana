/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';

import { KibanaServicesProvider, type Services } from '../../common/services';
import type { GetStartedComponent } from './types';
import { GetStarted } from './get_started';

export const getSecurityGetStartedComponent = (services: Services): GetStartedComponent => {
  return () => (
    <KibanaServicesProvider services={services}>
      <GetStarted />
    </KibanaServicesProvider>
  );
};
