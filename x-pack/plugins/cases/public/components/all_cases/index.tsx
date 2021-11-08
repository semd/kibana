/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useState, useMemo } from 'react';
import { useGetActionLicense } from '../../containers/use_get_action_license';
import { useCasesContext } from '../cases_context/use_cases_context';
import { getActionLicenseError } from '../use_push_to_service/helpers';
import { AllCasesList } from './all_cases_list';
import { CasesTableHeader } from './header';

export interface AllCasesProps {
  disableAlerts?: boolean;
  showTitle?: boolean;
}

export const AllCases: React.FC<AllCasesProps> = ({ showTitle, disableAlerts }) => {
  const { userCanCrud } = useCasesContext();
  const [refresh, setRefresh] = useState<number>(0);
  const doRefresh = useCallback(() => {
    setRefresh((prev) => prev + 1);
  }, [setRefresh]);

  const { actionLicense } = useGetActionLicense();
  const actionsErrors = useMemo(() => getActionLicenseError(actionLicense), [actionLicense]);

  return (
    <>
      <CasesTableHeader
        actionsErrors={actionsErrors}
        refresh={refresh}
        showTitle={showTitle}
        userCanCrud={userCanCrud}
      />
      <AllCasesList disableAlerts={disableAlerts} doRefresh={doRefresh} />
    </>
  );
};

// eslint-disable-next-line import/no-default-export
export { AllCases as default };
