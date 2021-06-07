/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useEffect, useMemo, useState, useRef } from 'react';
import styled from 'styled-components';
import { i18n } from '@kbn/i18n';
import { matchPath } from 'react-router-dom';
import { CommonProps, EuiPanel, EuiSideNavItemType } from '@elastic/eui';
import { KibanaPageTemplate } from '../../../../../../../src/plugins/kibana_react/public';
import { AutoSaveWarningMsg } from '../../../timelines/components/timeline/auto_save_warning';
import { useGlobalFullScreen } from '../../../common/containers/use_full_screen';
import { AppGlobalStyle } from '../../../common/components/page';
import { gutterTimeline } from '../../../common/lib/helpers';
import { Flyout } from '../../../timelines/components/flyout';
import { GlobalKQLHeader } from '../../../app/home/global_kql_header';
import { IS_DRAGGING_CLASS_NAME } from '../../../common/components/drag_and_drop/drag_classnames';
import { useThrottledResizeObserver } from '../../../common/components/utils';
import { useKibana } from '../../../common/lib/kibana';
import { getTimelineShowStatusByIdSelector } from '../../../timelines/components/flyout/selectors';
import { useDeepEqualSelector } from '../../../common/hooks/use_selector';
import { TimelineId } from '../../../../common/types/timeline';
import { useShowTimeline } from '../../../common/utils/timeline/use_show_timeline';
import { useSourcererScope } from '../../../common/containers/sourcerer';
import { APP_ID, DETECTIONS_SUB_PLUGIN_ID } from '../../../../common/constants';
import { SourcererScopeName } from '../../../common/store/sourcerer/model';
import { navTabs } from '../../../app/home/home_navigations';
import { useAppMountContext } from '../../../app/app_mount_context';

const translatedNavTitle = i18n.translate('xpack.securitySolution.navigation.mainLabel', {
  defaultMessage: 'Security',
});

const Wrapper = styled.div`
  padding: ${(props) => `${props.theme.eui.paddingSizes.l}`};
  &.securitySolutionWrapper--fullHeight {
    height: 100%;
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
  }
  &.securitySolutionWrapper--noPadding {
    padding: 0;
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
  }
  &.securitySolutionWrapper--withTimeline {
    padding-bottom: ${gutterTimeline};
  }
`;

Wrapper.displayName = 'Wrapper';

interface SecuritySolutionPageWrapperProps {
  children: React.ReactNode;
  noPadding?: boolean;
  noTimeline?: boolean;
  pageHeaderChildren?: React.ReactNode;
  restrictWidth?: boolean | number | string;
  style?: Record<string, string>;
}

const SecuritySolutionPageWrapperComponent: React.FC<
  SecuritySolutionPageWrapperProps & CommonProps
> = ({ children, className, style, noPadding, noTimeline, ...otherProps }) => {
  const { globalFullScreen, setGlobalFullScreen } = useGlobalFullScreen();
  useEffect(() => {
    setGlobalFullScreen(false); // exit full screen mode on page load
  }, [setGlobalFullScreen]);

  const classes = classNames(className, {
    securitySolutionWrapper: true,
    'securitySolutionWrapper--noPadding': noPadding,
    'securitySolutionWrapper--withTimeline': !noTimeline,
    'securitySolutionWrapper--fullHeight': globalFullScreen,
  });

  return (
    <Wrapper className={classes} style={style} {...otherProps}>
      {children}
      <AppGlobalStyle />
    </Wrapper>
  );
};

export const SecuritySolutionPageWrapper = React.memo(SecuritySolutionPageWrapperComponent);
