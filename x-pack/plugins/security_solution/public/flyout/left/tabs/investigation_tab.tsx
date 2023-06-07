/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { memo } from 'react';
import { EuiPanel } from '@elastic/eui';
import { INVESTIGATION_TAB_CONTENT_TEST_ID } from './test_ids';
import { InvestigationGuideView } from '../../../common/components/event_details/investigation_guide_view';
import { useLeftPanelContext } from '../context';

/**
 * Investigations view displayed in the document details expandable flyout left section
 */
export const InvestigationTab: React.FC = memo(() => {
  const { dataFormattedForFieldBrowser } = useLeftPanelContext();
  if (dataFormattedForFieldBrowser === null) {
    return null;
  }

  return (
    <EuiPanel data-test-subj={INVESTIGATION_TAB_CONTENT_TEST_ID} hasShadow={false}>
      <InvestigationGuideView
        data={dataFormattedForFieldBrowser}
        showTitle={false}
        showFullView={true}
      />
    </EuiPanel>
  );
});

InvestigationTab.displayName = 'InvestigationTab';
