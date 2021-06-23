/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useMemo } from 'react';
import { EuiSideNavItemType } from '@elastic/eui/src/components/side_nav/side_nav_types';
import { navTabGroups } from '../../../../app/home/home_navigations';
import { APP_ID } from '../../../../../common/constants';
import { track, METRIC_TYPE, TELEMETRY_EVENT } from '../../../lib/telemetry';
import { getSearch } from '../helpers';
import { PrimaryNavigationItemsProps } from './types';
import { useKibana } from '../../../lib/kibana';
import { NavTab } from '../types';

export const usePrimaryNavigationItems = ({
  navTabs,
  selectedTabId,
  ...urlStateProps
}: PrimaryNavigationItemsProps): Array<EuiSideNavItemType<{}>> => {
  const { navigateToApp, getUrlForApp } = useKibana().services.application;

  const getSideNav = useCallback(
    (tab: NavTab) => {
      const { id, name, disabled } = tab;
      const isSelected = selectedTabId === id;
      const urlSearch = getSearch(tab, urlStateProps);

      const handleClick = (ev: React.MouseEvent) => {
        ev.preventDefault();
        // TODO: [1101] remove conditional and use always deepLinkId
        if (
          id === 'overview' ||
          id === 'alerts' ||
          id === 'rules' ||
          id === 'exceptions' ||
          id === 'hosts' ||
          id === 'network' ||
          id === 'endpoints' ||
          id === 'trusted_apps' ||
          id === 'event_filters'
        ) {
          navigateToApp(APP_ID, { deepLinkId: id, path: urlSearch });
        } else {
          navigateToApp(`${APP_ID}:${id}`, { path: urlSearch });
        }
        track(METRIC_TYPE.CLICK, `${TELEMETRY_EVENT.TAB_CLICKED}${id}`);
      };

      // TODO: [1101] remove conditional and use always deepLinkId
      const appHref =
        id === 'overview' ||
        id === 'alerts' ||
        id === 'rules' ||
        id === 'exceptions' ||
        id === 'hosts' ||
        id === 'network' ||
        id === 'endpoints' ||
        id === 'trusted_apps' ||
        id === 'event_filters'
          ? getUrlForApp(APP_ID, { deepLinkId: id, path: urlSearch })
          : getUrlForApp(`${APP_ID}:${id}`, { path: urlSearch });

      return {
        'data-href': appHref,
        'data-test-subj': `navigation-${id}`,
        disabled,
        href: appHref,
        id,
        isSelected,
        name,
        onClick: handleClick,
      };
    },
    [getUrlForApp, navigateToApp, selectedTabId, urlStateProps]
  );

  const primaryNavigationItems = useMemo(
    () => [
      {
        id: APP_ID,
        name: '',
        items: [
          getSideNav(navTabs.overview),
          // TODO: [1101] Move the following nav items to its group
          getSideNav(navTabs.timelines),
          getSideNav(navTabs.case),
        ],
      },
      {
        ...navTabGroups.detect,
        items: [
          getSideNav(navTabs.alerts),
          getSideNav(navTabs.rules),
          getSideNav(navTabs.exceptions),
        ],
      },
      {
        ...navTabGroups.explore,
        items: [getSideNav(navTabs.hosts), getSideNav(navTabs.network)],
      },
      {
        ...navTabGroups.investigate,
        items: [],
      },
      {
        ...navTabGroups.manage,
        items: [
          getSideNav(navTabs.endpoints),
          getSideNav(navTabs.trusted_apps),
          getSideNav(navTabs.event_filters),
        ],
      },
    ],
    [getSideNav, navTabs]
  );

  return primaryNavigationItems;
};
