/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { CoreStart } from '@kbn/core/public';
import {
  createFilterInActionFactory,
  createFilterOutActionFactory,
  createCopyToClipboardActionFactory,
} from '@kbn/cell-actions';
import { ObservabilityPublicPluginsStart } from '..';

export const OBSERVABILITY_CELL_ACTIONS_TRIGGER = 'OBSERVABILITY_CELL_ACTIONS_TRIGGER';

export const registerActions = (core: CoreStart, plugins: ObservabilityPublicPluginsStart) => {
  const { uiActions } = plugins;
  uiActions.registerTrigger({ id: OBSERVABILITY_CELL_ACTIONS_TRIGGER });

  uiActions.addTriggerAction(
    OBSERVABILITY_CELL_ACTIONS_TRIGGER,
    createFilterInAction(core, plugins)
  );
  uiActions.addTriggerAction(
    OBSERVABILITY_CELL_ACTIONS_TRIGGER,
    createFilterOutAction(core, plugins)
  );
  uiActions.addTriggerAction(
    OBSERVABILITY_CELL_ACTIONS_TRIGGER,
    createCopyToClipboardAction(core, plugins)
  );
};

const createFilterInAction = (core: CoreStart, plugins: ObservabilityPublicPluginsStart) => {
  const { filterManager } = plugins.data.query;
  const filterInActionFactory = createFilterInActionFactory({ filterManager });
  const generic = filterInActionFactory({
    id: 'genericFilterIn',
    order: 1,
    isCompatible: async ({ field }) => field.name !== 'host.os.name',
  });
  const os = filterInActionFactory({
    id: 'osFilterIn',
    order: 1,
    isCompatible: async ({ field }) => field.name === 'host.os.name',
    execute: async ({ field: { value } }) => {
      // override value
    },
  });
  return generic;
};

const createFilterOutAction = (core: CoreStart, plugins: ObservabilityPublicPluginsStart) => {
  const { filterManager } = plugins.data.query;
  const filterOutActionFactory = createFilterOutActionFactory({ filterManager });
  return filterOutActionFactory({
    id: 'genericFilterOut',
    order: 2,
    isCompatible: async ({ field }) => field.name !== 'host.os.name',
  });
};

const createCopyToClipboardAction = (core: CoreStart, plugins: ObservabilityPublicPluginsStart) => {
  const { notifications } = core;
  const CopyToClipboardActionFactory = createCopyToClipboardActionFactory({ notifications });
  return CopyToClipboardActionFactory({ id: 'genericCopyToClipboard', order: 3 });
};
