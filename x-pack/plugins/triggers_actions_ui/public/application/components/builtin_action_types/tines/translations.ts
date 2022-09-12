/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';

export const URL_LABEL = i18n.translate(
  'xpack.triggersActionsUI.components.builtinActionTypes.tinesAction.urlTextFieldLabel',
  {
    defaultMessage: 'Webhook URL',
  }
);

export const PATH_LABEL = i18n.translate(
  'xpack.triggersActionsUI.components.builtinActionTypes.tinesAction.pathTextFieldLabel',
  {
    defaultMessage: 'Path',
  }
);

export const SECRET_LABEL = i18n.translate(
  'xpack.triggersActionsUI.components.builtinActionTypes.tinesAction.secretTextFieldLabel',
  {
    defaultMessage: 'Secret Key',
  }
);

export const URL_INVALID = i18n.translate(
  'xpack.triggersActionsUI.components.builtinActionTypes.tinesAction.error.invalidUrlTextField',
  {
    defaultMessage: 'URL is invalid.',
  }
);

// export const METHOD_REQUIRED = i18n.translate(
//   'xpack.triggersActionsUI.sections.addAction.tinesAction.error.requiredMethodText',
//   {
//     defaultMessage: 'Method is required.',
//   }
// );

export const PATH_REQUIRED = i18n.translate(
  'xpack.triggersActionsUI.sections.addAction.tinesAction.error.requiredPathText',
  {
    defaultMessage: 'Path is required.',
  }
);
export const SECRET_KEY_REQUIRED = i18n.translate(
  'xpack.triggersActionsUI.sections.addAction.tinesAction.error.requiredAuthSecretKeyText',
  {
    defaultMessage: 'Secret key is required.',
  }
);

export const BODY_REQUIRED = i18n.translate(
  'xpack.triggersActionsUI.components.builtinActionTypes.error.requiredBodyText',
  {
    defaultMessage: 'Body is required.',
  }
);

export const DEDUP_KEY_REQUIRED = i18n.translate(
  'xpack.triggersActionsUI.components.builtinActionTypes.error.requiredDedupText',
  {
    defaultMessage: 'Deduplication key is required.',
  }
);
