/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { FakeLLM } from '@langchain/core/utils/testing';
import { getModel } from '../../providers/bedrock';
import { handleDuplicates } from './duplicates';
import { EcsMappingState } from '../../types';
import { ecsTestState } from '../../../__jest__/fixtures/ecs_mapping';

const mockLlm = new FakeLLM({
  response: '{ "message": "ll callback later."}',
});

jest.mock('../../providers/bedrock', () => ({
  getModel: jest.fn(),
}));
const testState: EcsMappingState = ecsTestState;

describe('Testing ecs handler', () => {
  beforeEach(() => {
    (getModel as jest.Mock).mockReturnValue(mockLlm);
  });
  it('handleDuplicates()', async () => {
    const response = await handleDuplicates(testState);
    expect(response.currentMapping).toStrictEqual({ message: 'll callback later.' });
    expect(response.lastExecutedChain).toBe('duplicateFields');
  });
});
