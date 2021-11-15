/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { euiDarkVars } from '@kbn/ui-shared-deps-src/theme';
import { I18nProvider } from '@kbn/i18n/react';
import React from 'react';
import { BehaviorSubject } from 'rxjs';
import { ThemeProvider } from 'styled-components';
import { SECURITY_SOLUTION_OWNER } from '../../../common';
import { CasesProvider } from '../../components/cases_context';
import {
  createKibanaContextProviderMock,
  createStartServicesMock,
} from '../lib/kibana/kibana_react.mock';
import { FieldHook } from '../shared_imports';
import { ChromeBreadcrumb } from '../../../../../../src/core/public';

interface Props {
  children: React.ReactNode;
  appId?: string;
  userCanCrud?: boolean;
  rootBreadcrumbs?: ChromeBreadcrumb[];
}

export const kibanaObservable = new BehaviorSubject(createStartServicesMock());

window.scrollTo = jest.fn();
const MockKibanaContextProvider = createKibanaContextProviderMock();

/** A utility for wrapping children in the providers required to run most tests */
const TestProvidersComponent: React.FC<Props> = ({
  children,
  appId = 'testAppId',
  userCanCrud = true,
  rootBreadcrumbs = [{ text: 'Root', href: '/root' }],
}) => (
  <I18nProvider>
    <MockKibanaContextProvider>
      <ThemeProvider theme={() => ({ eui: euiDarkVars, darkMode: true })}>
        <CasesProvider
          value={{ owner: [SECURITY_SOLUTION_OWNER], appId, userCanCrud, rootBreadcrumbs }}
        >
          {children}
        </CasesProvider>
      </ThemeProvider>
    </MockKibanaContextProvider>
  </I18nProvider>
);

export const TestProviders = React.memo(TestProvidersComponent);

export const useFormFieldMock = <T,>(options?: Partial<FieldHook<T>>): FieldHook<T> => ({
  path: 'path',
  type: 'type',
  value: 'mockedValue' as unknown as T,
  isPristine: false,
  isDirty: false,
  isModified: false,
  isValidating: false,
  isValidated: false,
  isChangingValue: false,
  errors: [],
  isValid: true,
  getErrorsMessages: jest.fn(),
  onChange: jest.fn(),
  setValue: jest.fn(),
  setErrors: jest.fn(),
  clearErrors: jest.fn(),
  validate: jest.fn(),
  reset: jest.fn(),
  __isIncludedInOutput: true,
  __serializeValue: jest.fn(),
  ...options,
});
