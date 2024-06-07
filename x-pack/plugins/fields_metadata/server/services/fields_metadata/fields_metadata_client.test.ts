/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { FieldMetadata, TEcsFields } from '../../../common';
import { loggerMock } from '@kbn/logging-mocks';
import { FieldsMetadataClient } from './fields_metadata_client';
import { EcsFieldsRepository } from './repositories/ecs_fields_repository';
import { IntegrationFieldsRepository } from './repositories/integration_fields_repository';

const ecsFields = {
  '@timestamp': {
    dashed_name: 'timestamp',
    description:
      'Date/time when the event originated.\nThis is the date/time extracted from the event, typically representing when the event was generated by the source.\nIf the event source has no original timestamp, this value is typically populated by the first time the event was received by the pipeline.\nRequired field for all events.',
    example: '2016-05-23T08:05:34.853Z',
    flat_name: '@timestamp',
    level: 'core',
    name: '@timestamp',
    normalize: [],
    required: !0,
    short: 'Date/time when the event originated.',
    type: 'date',
  },
} as TEcsFields;

const integrationFields = {
  '1password.item_usages': {
    'onepassword.client.platform_version': {
      name: 'platform_version',
      type: 'keyword',
      description:
        'The version of the browser or computer where the 1Password app is installed, or the CPU of the machine where the 1Password command-line tool is installed',
      flat_name: 'onepassword.client.platform_version',
      source: 'integration',
      dashed_name: 'onepassword-client-platform_version',
      normalize: [],
      short:
        'The version of the browser or computer where the 1Password app is installed, or the CPU of the machine where the 1Password command-line tool is installed',
    },
  },
};

describe('FieldsMetadataClient class', () => {
  const logger = loggerMock.create();
  const ecsFieldsRepository = EcsFieldsRepository.create({ ecsFields });
  const integrationFieldsExtractor = jest.fn();
  integrationFieldsExtractor.mockImplementation(() => Promise.resolve(integrationFields));

  let integrationFieldsRepository: IntegrationFieldsRepository;
  let fieldsMetadataClient: FieldsMetadataClient;

  beforeEach(() => {
    integrationFieldsExtractor.mockClear();
    integrationFieldsRepository = IntegrationFieldsRepository.create({
      integrationFieldsExtractor,
    });
    fieldsMetadataClient = FieldsMetadataClient.create({
      ecsFieldsRepository,
      integrationFieldsRepository,
      logger,
    });
  });

  describe('#getByName', () => {
    it('should resolve a single ECS FieldMetadata instance by default', async () => {
      const timestampFieldInstance = await fieldsMetadataClient.getByName('@timestamp');

      expect(integrationFieldsExtractor).not.toHaveBeenCalled();

      expectToBeDefined(timestampFieldInstance);
      expect(timestampFieldInstance).toBeInstanceOf(FieldMetadata);

      const timestampField = timestampFieldInstance.toPlain();

      expect(timestampField.hasOwnProperty('dashed_name')).toBeTruthy();
      expect(timestampField.hasOwnProperty('description')).toBeTruthy();
      expect(timestampField.hasOwnProperty('example')).toBeTruthy();
      expect(timestampField.hasOwnProperty('flat_name')).toBeTruthy();
      expect(timestampField.hasOwnProperty('level')).toBeTruthy();
      expect(timestampField.hasOwnProperty('name')).toBeTruthy();
      expect(timestampField.hasOwnProperty('normalize')).toBeTruthy();
      expect(timestampField.hasOwnProperty('required')).toBeTruthy();
      expect(timestampField.hasOwnProperty('short')).toBeTruthy();
      expect(timestampField.hasOwnProperty('type')).toBeTruthy();
    });

    it('should attempt resolving the field from an integration if it does not exist in ECS  and the integration and dataset params are provided', async () => {
      const onePasswordFieldInstance = await fieldsMetadataClient.getByName(
        'onepassword.client.platform_version',
        { integration: '1password', dataset: '1password.item_usages' }
      );

      expect(integrationFieldsExtractor).toHaveBeenCalled();

      expectToBeDefined(onePasswordFieldInstance);
      expect(onePasswordFieldInstance).toBeInstanceOf(FieldMetadata);

      const onePasswordField = onePasswordFieldInstance.toPlain();

      expect(onePasswordField.hasOwnProperty('name')).toBeTruthy();
      expect(onePasswordField.hasOwnProperty('type')).toBeTruthy();
      expect(onePasswordField.hasOwnProperty('description')).toBeTruthy();
      expect(onePasswordField.hasOwnProperty('flat_name')).toBeTruthy();
      expect(onePasswordField.hasOwnProperty('source')).toBeTruthy();
      expect(onePasswordField.hasOwnProperty('dashed_name')).toBeTruthy();
      expect(onePasswordField.hasOwnProperty('normalize')).toBeTruthy();
      expect(onePasswordField.hasOwnProperty('short')).toBeTruthy();
    });

    it('should not resolve the field from an integration if the integration and dataset params are not provided', async () => {
      const onePasswordFieldInstance = await fieldsMetadataClient.getByName(
        'onepassword.client.platform_version'
      );

      expect(integrationFieldsExtractor).not.toHaveBeenCalled();
      expect(onePasswordFieldInstance).toBeUndefined();
    });
  });

  describe('#find', () => {
    it('should resolve a FieldsMetadataDictionary of matching fields', async () => {
      const fieldsDictionaryInstance = await fieldsMetadataClient.find({
        fieldNames: ['@timestamp'],
      });

      expect(integrationFieldsExtractor).not.toHaveBeenCalled();

      const fields = fieldsDictionaryInstance.toPlain();

      expect(fields.hasOwnProperty('@timestamp')).toBeTruthy();
    });

    it('should resolve a FieldsMetadataDictionary of matching fields, including integration fields when integration and dataset params are provided', async () => {
      const fieldsDictionaryInstance = await fieldsMetadataClient.find({
        fieldNames: ['@timestamp', 'onepassword.client.platform_version'],
        integration: '1password',
        dataset: '1password.item_usages',
      });

      expect(integrationFieldsExtractor).toHaveBeenCalled();

      const fields = fieldsDictionaryInstance.toPlain();

      expect(fields.hasOwnProperty('@timestamp')).toBeTruthy();
      expect(fields.hasOwnProperty('onepassword.client.platform_version')).toBeTruthy();
    });

    it('should resolve a FieldsMetadataDictionary of matching fields, skipping unmatched fields', async () => {
      const fieldsDictionaryInstance = await fieldsMetadataClient.find({
        fieldNames: ['@timestamp', 'onepassword.client.platform_version', 'not-existing-field'],
        integration: '1password',
        dataset: '1password.item_usages',
      });

      expect(integrationFieldsExtractor).toHaveBeenCalled();

      const fields = fieldsDictionaryInstance.toPlain();

      expect(fields.hasOwnProperty('@timestamp')).toBeTruthy();
      expect(fields.hasOwnProperty('onepassword.client.platform_version')).toBeTruthy();
      expect(fields.hasOwnProperty('not-existing-field')).toBeFalsy();
    });
  });
});

function expectToBeDefined<T>(value: T | undefined): asserts value is T {
  expect(value).toBeDefined();
}
