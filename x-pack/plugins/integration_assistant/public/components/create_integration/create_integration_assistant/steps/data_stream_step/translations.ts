/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';

export const INTEGRATION_NAME_TITLE = i18n.translate(
  'xpack.integrationAssistant.step.dataStream.integrationNameTitle',
  {
    defaultMessage: 'Define package name',
  }
);
export const INTEGRATION_NAME_DESCRIPTION = i18n.translate(
  'xpack.integrationAssistant.step.dataStream.integrationNameDescription',
  {
    defaultMessage:
      'Name will be used in the Elastic ingest pipeline to organize and manage your data streams efficiently',
  }
);
export const DATA_STREAM_TITLE = i18n.translate(
  'xpack.integrationAssistant.step.dataStream.dataStreamTitle',
  {
    defaultMessage: 'Define data stream and upload logs',
  }
);
export const DATA_STREAM_DESCRIPTION = i18n.translate(
  'xpack.integrationAssistant.step.dataStream.dataStreamDescription',
  {
    defaultMessage:
      'The logs will be analyzed to map ECS fields and create an ingestion pipeline in Elastic',
  }
);

export const INTEGRATION_NAME_LABEL = i18n.translate(
  'xpack.integrationAssistant.step.dataStream.integrationName.label',
  {
    defaultMessage: 'Integration package name',
  }
);
export const NO_SPACES_HELP = i18n.translate(
  'xpack.integrationAssistant.step.dataStream.noSpacesHelpText',
  {
    defaultMessage: 'It can not contain spaces, only lowercase letters, numbers and underscore (_)',
  }
);

export const DATA_STREAM_TITLE_LABEL = i18n.translate(
  'xpack.integrationAssistant.step.dataStream.dataStreamTitle.label',
  {
    defaultMessage: 'Data stream title',
  }
);

export const DATA_STREAM_DESCRIPTION_LABEL = i18n.translate(
  'xpack.integrationAssistant.step.dataStream.dataStreamDescription.label',
  {
    defaultMessage: 'Data stream description',
  }
);

export const DATA_STREAM_NAME_LABEL = i18n.translate(
  'xpack.integrationAssistant.step.dataStream.dataStreamName.label',
  {
    defaultMessage: 'Data stream name',
  }
);

export const DATA_COLLECTION_METHOD_LABEL = i18n.translate(
  'xpack.integrationAssistant.step.dataStream.dataCollectionMethod.label',
  {
    defaultMessage: 'Data collection method',
  }
);

export const LOGS_SAMPLE_LABEL = i18n.translate(
  'xpack.integrationAssistant.step.dataStream.logsSample.label',
  {
    defaultMessage: 'Logs sample upload',
  }
);

export const LOGS_SAMPLE_WARNING = i18n.translate(
  'xpack.integrationAssistant.step.dataStream.logsSample.warning',
  {
    defaultMessage:
      'Please be aware that this data will be analyzed by a third-party AI tool. Ensure that your data complies with privacy and security guidelines.',
  }
);

export const ANALYZING = i18n.translate('xpack.integrationAssistant.step.dataStream.analyzing', {
  defaultMessage: 'Analyzing',
});
export const PROGRESS_ECS_MAPPING = i18n.translate(
  'xpack.integrationAssistant.step.dataStream.progress.ecsMapping',
  {
    defaultMessage: 'Mapping ECS fields',
  }
);
export const PROGRESS_CATEGORIZATION = i18n.translate(
  'xpack.integrationAssistant.step.dataStream.progress.categorization',
  {
    defaultMessage: 'Adding categorization',
  }
);
export const PROGRESS_RELATED_GRAPH = i18n.translate(
  'xpack.integrationAssistant.step.dataStream.progress.relatedGraph',
  {
    defaultMessage: 'Generating related fields',
  }
);
