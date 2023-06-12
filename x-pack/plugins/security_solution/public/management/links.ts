/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { CoreStart } from '@kbn/core/public';
import { i18n } from '@kbn/i18n';

import { hasKibanaPrivilege } from '../../common/endpoint/service/authz/authz';
import { checkArtifactHasData } from './services/exceptions_list/check_artifact_has_data';
import {
  calculateEndpointAuthz,
  getEndpointAuthzInitialState,
} from '../../common/endpoint/service/authz';
import {
  BLOCKLIST_PATH,
  ENDPOINTS_PATH,
  EVENT_FILTERS_PATH,
  HOST_ISOLATION_EXCEPTIONS_PATH,
  MANAGE_PATH,
  POLICIES_PATH,
  RESPONSE_ACTIONS_HISTORY_PATH,
  SecurityPageName,
  SERVER_APP_ID,
  TRUSTED_APPS_PATH,
} from '../../common/constants';
import {
  BLOCKLIST,
  ENDPOINTS,
  EVENT_FILTERS,
  HOST_ISOLATION_EXCEPTIONS,
  SETTINGS,
  POLICIES,
  RESPONSE_ACTIONS_HISTORY,
  TRUSTED_APPLICATIONS,
} from '../app/translations';
import { licenseService } from '../common/hooks/use_license';
import type { LinkItem } from '../common/links/types';
import type { StartPlugins } from '../types';
import { manageLinks as cloudDefendLinks } from '../cloud_defend/links';
import { IconActionHistory } from './icons/action_history';
import { IconBlocklist } from './icons/blocklist';
import { IconEndpoints } from './icons/endpoints';
import { IconEndpointPolicies } from './icons/endpoint_policies';
import { IconEventFilters } from './icons/event_filters';
import { IconHostIsolation } from './icons/host_isolation';
import { IconTrustedApplications } from './icons/trusted_applications';
import { HostIsolationExceptionsApiClient } from './pages/host_isolation_exceptions/host_isolation_exceptions_api_client';
import { ExperimentalFeaturesService } from '../common/experimental_features_service';

const categories = [
  {
    label: i18n.translate('xpack.securitySolution.appLinks.category.endpoints', {
      defaultMessage: 'ENDPOINTS',
    }),
    linkIds: [
      SecurityPageName.endpoints,
      SecurityPageName.policies,
      SecurityPageName.trustedApps,
      SecurityPageName.eventFilters,
      SecurityPageName.hostIsolationExceptions,
      SecurityPageName.blocklist,
      SecurityPageName.responseActionsHistory,
    ],
  },
];

export const links: LinkItem = {
  id: SecurityPageName.administration,
  title: SETTINGS,
  path: MANAGE_PATH,
  skipUrlState: true,
  hideTimeline: true,
  globalNavPosition: 8,
  capabilities: [`${SERVER_APP_ID}.show`],
  globalSearchKeywords: [
    i18n.translate('xpack.securitySolution.appLinks.settings', {
      defaultMessage: 'Settings',
    }),
  ],
  categories,
  links: [
    {
      id: SecurityPageName.endpoints,
      description: i18n.translate('xpack.securitySolution.appLinks.endpointsDescription', {
        defaultMessage: 'Hosts running Elastic Defend.',
      }),
      landingIcon: IconEndpoints,
      title: ENDPOINTS,
      path: ENDPOINTS_PATH,
      skipUrlState: true,
      hideTimeline: true,
    },
    {
      id: SecurityPageName.policies,
      title: POLICIES,
      description: i18n.translate('xpack.securitySolution.appLinks.policiesDescription', {
        defaultMessage:
          'Use policies to customize endpoint and cloud workload protections and other configurations.',
      }),
      landingIcon: IconEndpointPolicies,
      path: POLICIES_PATH,
      skipUrlState: true,
      hideTimeline: true,
      experimentalKey: 'policyListEnabled',
    },
    {
      id: SecurityPageName.trustedApps,
      title: TRUSTED_APPLICATIONS,
      description: i18n.translate(
        'xpack.securitySolution.appLinks.trustedApplicationsDescription',
        {
          defaultMessage:
            'Improve performance or alleviate conflicts with other applications running on your hosts.',
        }
      ),
      landingIcon: IconTrustedApplications,
      path: TRUSTED_APPS_PATH,
      skipUrlState: true,
      hideTimeline: true,
    },
    {
      id: SecurityPageName.eventFilters,
      title: EVENT_FILTERS,
      description: i18n.translate('xpack.securitySolution.appLinks.eventFiltersDescription', {
        defaultMessage: 'Exclude high volume or unwanted events being written into Elasticsearch.',
      }),
      landingIcon: IconEventFilters,
      path: EVENT_FILTERS_PATH,
      skipUrlState: true,
      hideTimeline: true,
    },
    {
      id: SecurityPageName.hostIsolationExceptions,
      title: HOST_ISOLATION_EXCEPTIONS,
      description: i18n.translate('xpack.securitySolution.appLinks.hostIsolationDescription', {
        defaultMessage: 'Allow isolated hosts to communicate with specific IPs.',
      }),
      landingIcon: IconHostIsolation,
      path: HOST_ISOLATION_EXCEPTIONS_PATH,
      skipUrlState: true,
      hideTimeline: true,
    },
    {
      id: SecurityPageName.blocklist,
      title: BLOCKLIST,
      description: i18n.translate('xpack.securitySolution.appLinks.blocklistDescription', {
        defaultMessage: 'Exclude unwanted applications from running on your hosts.',
      }),
      landingIcon: IconBlocklist,
      path: BLOCKLIST_PATH,
      skipUrlState: true,
      hideTimeline: true,
    },
    {
      id: SecurityPageName.responseActionsHistory,
      title: RESPONSE_ACTIONS_HISTORY,
      description: i18n.translate('xpack.securitySolution.appLinks.actionHistoryDescription', {
        defaultMessage: 'View the history of response actions performed on hosts.',
      }),
      landingIcon: IconActionHistory,
      path: RESPONSE_ACTIONS_HISTORY_PATH,
      skipUrlState: true,
      hideTimeline: true,
    },
    cloudDefendLinks,
  ],
};

const excludeLinks = (linkIds: SecurityPageName[]) => ({
  ...links,
  links: links.links?.filter((link) => !linkIds.includes(link.id)),
});

export const getManagementFilteredLinks = async (
  core: CoreStart,
  plugins: StartPlugins
): Promise<LinkItem> => {
  const fleetAuthz = plugins.fleet?.authz;

  const { endpointRbacEnabled, endpointRbacV1Enabled } = ExperimentalFeaturesService.get();
  const isEndpointRbacEnabled = endpointRbacEnabled || endpointRbacV1Enabled;

  const linksToExclude: SecurityPageName[] = [];

  const currentUser = await plugins.security.authc.getCurrentUser();

  const isPlatinumPlus = licenseService.isPlatinumPlus();
  let hasHostIsolationExceptions: boolean = isPlatinumPlus;

  // If not Platinum+ license and user has read permissions to security solution
  // then check if Host Isolation Exceptions exist.
  // *** IT IS IMPORTANT *** that  this HTTP call only be made if the user has access to the
  // Lists plugin, else non-security solution users, especially when license is not Platinum,
  // may see failed HTTP requests in the browser console. This is the reason that
  // `hasKibanaPrivilege()` is used below.
  if (
    currentUser &&
    !isPlatinumPlus &&
    fleetAuthz &&
    hasKibanaPrivilege(
      fleetAuthz,
      isEndpointRbacEnabled,
      currentUser.roles.includes('superuser'),
      'readHostIsolationExceptions'
    )
  ) {
    hasHostIsolationExceptions = await checkArtifactHasData(
      HostIsolationExceptionsApiClient.getInstance(core.http)
    );
  }

  const {
    canReadActionsLogManagement,
    canReadHostIsolationExceptions,
    canReadEndpointList,
    canReadTrustedApplications,
    canReadEventFilters,
    canReadBlocklist,
    canReadPolicyManagement,
  } =
    fleetAuthz && currentUser
      ? calculateEndpointAuthz(
          licenseService,
          fleetAuthz,
          currentUser.roles,
          isEndpointRbacEnabled,
          hasHostIsolationExceptions
        )
      : getEndpointAuthzInitialState();

  if (!canReadEndpointList) {
    linksToExclude.push(SecurityPageName.endpoints);
  }

  if (!canReadPolicyManagement) {
    linksToExclude.push(SecurityPageName.policies);
  }

  if (!canReadActionsLogManagement) {
    linksToExclude.push(SecurityPageName.responseActionsHistory);
  }

  if (!canReadHostIsolationExceptions) {
    linksToExclude.push(SecurityPageName.hostIsolationExceptions);
  }

  if (!canReadTrustedApplications) {
    linksToExclude.push(SecurityPageName.trustedApps);
  }

  if (!canReadEventFilters) {
    linksToExclude.push(SecurityPageName.eventFilters);
  }

  if (!canReadBlocklist) {
    linksToExclude.push(SecurityPageName.blocklist);
  }

  return excludeLinks(linksToExclude);
};
