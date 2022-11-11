/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { useCanSeeHostIsolationExceptionsMenu } from './hooks';
import { renderHook as _renderHook } from '@testing-library/react-hooks';
import { TestProviders } from '../../../../common/mock';
import { useEndpointPrivileges } from '../../../../common/components/user_privileges/endpoint';
import { createAppRootMockRenderer } from '../../../../common/mock/endpoint';
import { exceptionsGetSummaryHttpMock } from '../../../mocks/exceptions_list_http_mocks';

jest.mock('../../../../common/hooks/use_license');
jest.mock('../../../../common/components/user_privileges/endpoint/use_endpoint_privileges');

describe('host isolation exceptions hooks', () => {
  const useEndpointPrivilegesMock = useEndpointPrivileges as jest.Mock;
  let renderHook: typeof _renderHook;
  let mockedApis: ReturnType<typeof exceptionsGetSummaryHttpMock>;

  describe('useCanSeeHostIsolationExceptionsMenu', () => {
    beforeEach(() => {
      const mockedContext = createAppRootMockRenderer();

      mockedApis = exceptionsGetSummaryHttpMock(mockedContext.coreStart.http);
      renderHook = (callback, options = {}) => {
        return _renderHook(callback, {
          ...options,
          wrapper: mockedContext.AppWrapper,
        });
      };
    });

    afterEach(() => {
      useEndpointPrivilegesMock.mockReset();
    });

    it('should return TRUE if IS superuser AND canIsolateHost', () => {
      useEndpointPrivilegesMock.mockReturnValue({
        canIsolateHost: true,
        canAccessEndpointManagement: true,
      });
      const { result } = renderHook(() => useCanSeeHostIsolationExceptionsMenu(), {
        wrapper: TestProviders,
      });
      expect(result.current).toBe(true);
    });

    it('should return FALSE if NOT superuser AND canIsolateHost', () => {
      useEndpointPrivilegesMock.mockReturnValue({
        canIsolateHost: true,
        canAccessEndpointManagement: false,
      });
      const { result } = renderHook(() => useCanSeeHostIsolationExceptionsMenu(), {
        wrapper: TestProviders,
      });
      expect(result.current).toBe(false);
    });

    it('should return FALSE if IS superuser AND and !canIsolateHost and there are no existing host isolation items', () => {
      useEndpointPrivilegesMock.mockReturnValue({
        canIsolateHost: false,
        canAccessEndpointManagement: true,
      });
      mockedApis.responseProvider.exceptionsSummary.mockReturnValue({
        total: 0,
        linux: 0,
        macos: 0,
        windows: 0,
      });
      const { result } = renderHook(() => useCanSeeHostIsolationExceptionsMenu(), {
        wrapper: TestProviders,
      });
      expect(result.current).toBe(false);
    });

    it('should return TRUE if IS superuser AND and !canIsolateHost and there are existing host isolation items', async () => {
      useEndpointPrivilegesMock.mockReturnValue({
        canIsolateHost: false,
        canAccessEndpointManagement: true,
      });
      const { result, waitForNextUpdate } = renderHook(
        () => useCanSeeHostIsolationExceptionsMenu(),
        {
          wrapper: TestProviders,
        }
      );
      await waitForNextUpdate();
      expect(result.current).toBe(true);
    });
  });
});
