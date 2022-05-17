/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { IconType } from '@elastic/eui';
import { UrlStateType } from '../url_state/constants';
import { SecurityPageName } from '../../../app/types';
import { UrlState } from '../url_state/types';
import { SiemRouteType } from '../../utils/route/types';

export interface TabNavigationComponentProps {
  pageName: string;
  tabName: SiemRouteType | undefined;
  urlState: UrlState;
  pathName: string;
}

export type SearchNavTab = NavTab | { urlKey: UrlStateType; isDetailPage: boolean };

export interface NavGroupTab {
  id: string;
  name: string;
}
export enum SecurityNavGroupKey {
  detect = 'detect',
  explore = 'explore',
  investigate = 'investigate',
  manage = 'manage',
}

export type SecurityNavGroup = Record<SecurityNavGroupKey, NavGroupTab>;
export interface NavTab {
  id: string;
  name: string;
  href: string;
  disabled: boolean;
  urlKey?: UrlStateType;
  pageId?: SecurityPageName;
  isBeta?: boolean;
}
export const securityNavKeys = [
  SecurityPageName.administration,
  SecurityPageName.alerts,
  SecurityPageName.blocklist,
  SecurityPageName.detectionAndResponse,
  SecurityPageName.case,
  SecurityPageName.endpoints,
  SecurityPageName.landing,
  SecurityPageName.policies,
  SecurityPageName.eventFilters,
  SecurityPageName.exceptions,
  SecurityPageName.hostIsolationExceptions,
  SecurityPageName.hosts,
  SecurityPageName.network,
  SecurityPageName.overview,
  SecurityPageName.rules,
  SecurityPageName.timelines,
  SecurityPageName.trustedApps,
  SecurityPageName.users,
] as const;
export type SecurityNavKey = typeof securityNavKeys[number];

export type SecurityNav = Record<SecurityNavKey, NavTab>;

export type GenericNavRecord = Record<string, NavTab>;

export interface SecuritySolutionTabNavigationProps {
  display?: 'default' | 'condensed';
  navTabs: GenericNavRecord;
}
export type GetUrlForApp = (
  appId: string,
  options?: { deepLinkId?: string; path?: string; absolute?: boolean }
) => string;

export type NavigateToUrl = (url: string) => void;

export interface NavigationCategory {
  label: string;
  linkIds: readonly SecurityPageName[];
}

export type NavigationCategories = Readonly<NavigationCategory[]>;
export interface NavLinkItem {
  description?: string;
  disabled?: boolean;
  icon?: IconType;
  id: SecurityPageName;
  links?: NavLinkItem[];
  image?: string;
  title: string;
  skipUrlState?: boolean;
}
