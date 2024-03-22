/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { act, renderHook } from '@testing-library/react-hooks';
import { TestProviders } from '../../../../common/mock';
import { ID, useNetworkTopNFlow } from '.';
import { useSearchStrategy } from '../../../../common/containers/use_search_strategy';
import { networkModel } from '../../store';
import { FlowTargetSourceDest } from '../../../../../common/search_strategy';

jest.mock('../../../../common/containers/use_search_strategy', () => ({
  useSearchStrategy: jest.fn(),
}));
const mockUseSearchStrategy = useSearchStrategy as jest.Mock;
const mockSearch = jest.fn();

const props = {
  endDate: '2020-07-08T08:20:18.966Z',
  flowTarget: FlowTargetSourceDest.source,
  id: ID,
  indexNames: ['auditbeat-*'],
  skip: false,
  startDate: '2020-07-07T08:20:18.966Z',
  type: networkModel.NetworkType.page,
};

describe('useNetworkTopNFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSearchStrategy.mockReturnValue({
      loading: false,
      result: {
        edges: [],
        totalCount: -1,
      },
      search: mockSearch,
      refetch: jest.fn(),
      inspect: { dsl: [], response: [] },
    });
  });

  it('runs search', () => {
    renderHook(() => useNetworkTopNFlow(props), {
      wrapper: TestProviders,
    });

    expect(mockSearch).toHaveBeenCalled();
  });

  it('does not run search when skip = true', () => {
    const localProps = {
      ...props,
      skip: true,
    };
    renderHook(() => useNetworkTopNFlow(localProps), {
      wrapper: TestProviders,
    });

    expect(mockSearch).not.toHaveBeenCalled();
  });

  it('skip = true will cancel any running request', () => {
    const localProps = {
      ...props,
    };
    const { rerender } = renderHook(() => useNetworkTopNFlow(localProps), {
      wrapper: TestProviders,
    });
    localProps.skip = true;
    act(() => rerender());

    expect(mockUseSearchStrategy).toHaveBeenCalledTimes(3);
    expect(mockUseSearchStrategy.mock.calls[2][0].abort).toEqual(true);
  });
});
