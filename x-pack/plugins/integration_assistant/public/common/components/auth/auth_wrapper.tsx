/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { EuiCallOut } from '@elastic/eui';
import React, { useMemo, type PropsWithChildren } from 'react';
import { useAuthorization, type Authorization } from '../../hooks/use_authorization';
import { AuthDescription } from './auth_description';
import * as i18n from './translations';

type AuthWrapperProps = PropsWithChildren<Partial<Authorization>>;
export const AuthWrapper = React.memo<AuthWrapperProps>(({ children, ...authRequired }) => {
  const authorization = useAuthorization();

  const isAuthorized = useMemo(
    () =>
      Object.entries(authRequired).every(
        ([key, enabled]) => !enabled || authorization[key as keyof Authorization]
      ),
    [authorization, authRequired]
  );

  if (!isAuthorized) {
    return (
      <EuiCallOut title={i18n.PRIVILEGES_MISSING_TITLE} iconType="iInCircle">
        <AuthDescription {...authRequired} />
      </EuiCallOut>
    );
  }
  return <>{children}</>;
});
AuthWrapper.displayName = 'AuthWrapper';
