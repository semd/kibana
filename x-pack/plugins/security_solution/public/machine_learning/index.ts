/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { MACHINE_LEARNING_PATH } from '../../common/constants';
import type { SecuritySubPlugin } from '../app/types';
import { withSubPluginRouteSuspense } from '../common/components/with_sub_plugin_route_suspense';

const MachineLearningPageLazy = React.lazy(() =>
  import(
    /* webpackChunkName: "sub_plugin-machine_learning" */
    './routes'
  ).then(({ MachineLearningPage }) => ({ default: MachineLearningPage }))
);

export class MachineLearning {
  public setup() {}

  public start(): SecuritySubPlugin {
    return {
      routes: [
        {
          path: MACHINE_LEARNING_PATH,
          component: withSubPluginRouteSuspense(MachineLearningPageLazy),
        },
      ],
    };
  }
}
