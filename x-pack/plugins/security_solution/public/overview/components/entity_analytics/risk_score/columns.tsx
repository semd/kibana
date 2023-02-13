/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import type { EuiBasicTableColumn } from '@elastic/eui';
import { EuiLink, EuiIcon, EuiToolTip } from '@elastic/eui';
import { get } from 'lodash/fp';
import { CellActions, CellActionsMode } from '@kbn/cell-actions';
import styled from 'styled-components';
import { UsersTableType } from '../../../../explore/users/store/model';
import { getEmptyTagValue } from '../../../../common/components/empty_value';
import { HostDetailsLink, UserDetailsLink } from '../../../../common/components/links';
import { HostsTableType } from '../../../../explore/hosts/store/model';
import { RiskScore } from '../../../../explore/components/risk_score/severity/common';
import type {
  HostRiskScore,
  RiskSeverity,
  UserRiskScore,
} from '../../../../../common/search_strategy';
import { RiskScoreEntity, RiskScoreFields } from '../../../../../common/search_strategy';
import * as i18n from './translations';
import { FormattedCount } from '../../../../common/components/formatted_number';
import { CELL_ACTIONS_DEFAULT_TRIGGER } from '../../../../../common/constants';
import { ACTION_ID as FILTER_IN_ACTION_ID } from '../../../../actions/filter/cell_action/filter_in';
import { ACTION_ID as FILTER_OUT_ACTION_ID } from '../../../../actions/filter/cell_action/filter_out';
import { ACTION_ID as SHOW_TOP_N_ACTION_ID } from '../../../../actions/show_top_n/cell_action/show_top_n';

type HostRiskScoreColumns = Array<EuiBasicTableColumn<HostRiskScore & UserRiskScore>>;

const StyledCellActions = styled(CellActions)`
  padding-left: ${({ theme }) => theme.eui.euiSizeS};
`;

export const getRiskScoreColumns = (
  riskEntity: RiskScoreEntity,
  openEntityInTimeline: (entityName: string, oldestAlertTimestamp?: string) => void
): HostRiskScoreColumns => [
  {
    field: riskEntity === RiskScoreEntity.host ? 'host.name' : 'user.name',
    name: i18n.ENTITY_NAME(riskEntity),
    truncateText: false,
    mobileOptions: { show: true },
    render: (entityName: string) => {
      if (entityName != null && entityName.length > 0) {
        return riskEntity === RiskScoreEntity.host ? (
          <>
            <HostDetailsLink hostName={entityName} hostTab={HostsTableType.risk} />
            <StyledCellActions
              field={{
                name: 'host.name',
                value: entityName,
                type: 'keyword',
              }}
              triggerId={CELL_ACTIONS_DEFAULT_TRIGGER}
              mode={CellActionsMode.INLINE}
              visibleCellActions={2}
              disabledActions={[SHOW_TOP_N_ACTION_ID, FILTER_IN_ACTION_ID, FILTER_OUT_ACTION_ID]}
            />
          </>
        ) : (
          <>
            <UserDetailsLink userName={entityName} userTab={UsersTableType.risk} />
            <StyledCellActions
              field={{
                name: 'user.name',
                value: entityName,
                type: 'keyword',
              }}
              triggerId={CELL_ACTIONS_DEFAULT_TRIGGER}
              mode={CellActionsMode.INLINE}
              disabledActions={[SHOW_TOP_N_ACTION_ID, FILTER_IN_ACTION_ID, FILTER_OUT_ACTION_ID]}
            />
          </>
        );
      }
      return getEmptyTagValue();
    },
  },
  {
    field:
      riskEntity === RiskScoreEntity.host
        ? RiskScoreFields.hostRiskScore
        : RiskScoreFields.userRiskScore,
    width: '15%',
    name: i18n.RISK_SCORE_TITLE(riskEntity),
    truncateText: true,
    mobileOptions: { show: true },
    render: (riskScore: number) => {
      if (riskScore != null) {
        return (
          <span data-test-subj="risk-score-truncate" title={`${riskScore}`}>
            {Math.round(riskScore)}
          </span>
        );
      }
      return getEmptyTagValue();
    },
  },
  {
    field:
      riskEntity === RiskScoreEntity.host ? RiskScoreFields.hostRisk : RiskScoreFields.userRisk,
    width: '30%',
    name: (
      <EuiToolTip content={i18n.ENTITY_RISK_TOOLTIP(riskEntity)}>
        <>
          {i18n.ENTITY_RISK(riskEntity)}
          <EuiIcon color="subdued" type="iInCircle" className="eui-alignTop" />
        </>
      </EuiToolTip>
    ),
    truncateText: false,
    mobileOptions: { show: true },
    render: (risk: RiskSeverity) => {
      if (risk != null) {
        return <RiskScore severity={risk} />;
      }
      return getEmptyTagValue();
    },
  },
  {
    field: RiskScoreFields.alertsCount,
    width: '10%',
    name: i18n.ALERTS,
    truncateText: false,
    mobileOptions: { show: true },
    render: (alertCount: number, risk) => (
      <EuiLink
        data-test-subj="risk-score-alerts"
        disabled={alertCount === 0}
        onClick={() =>
          openEntityInTimeline(
            get('host.name', risk) ?? get('user.name', risk),
            risk.oldestAlertTimestamp
          )
        }
      >
        <FormattedCount count={alertCount} />
      </EuiLink>
    ),
  },
];
