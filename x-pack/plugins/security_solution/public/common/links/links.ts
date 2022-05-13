/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { Capabilities } from '@kbn/core/public';
import { get } from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { SecurityPageName } from '../../../common/constants';
import { appLinks } from './app_links';
import {
  AppLinkItems,
  LinkInfo,
  LinkItem,
  NormalizedLink,
  NormalizedLinks,
  LinksPermissions,
} from './types';

export const appLinksUpdater$ = new BehaviorSubject<AppLinkItems>(appLinks);

export const getAllAppLinks = () => appLinks;

export const updateAppLinks = (appLinksToUpdate: LinkItem[]) => {
  appLinksUpdater$.next(Object.freeze(appLinksToUpdate));
};

export const updateFilteredAppLinks = (linksPermissions: LinksPermissions) => {
  updateAppLinks(getFilteredAppLinks(appLinks, linksPermissions));
};

const getFilteredAppLinks = (
  appLinkToFilter: AppLinkItems,
  linksPermissions: LinksPermissions
): LinkItem[] =>
  appLinkToFilter.reduce<LinkItem[]>((acc, { links, ...appLink }) => {
    if (!isLinkAllowed(appLink, linksPermissions)) {
      return acc;
    }
    if (links) {
      const childrenLinks = getFilteredAppLinks(links, linksPermissions);
      if (childrenLinks.length > 0) {
        acc.push({ ...appLink, links: childrenLinks });
      }
    } else {
      acc.push(appLink);
    }
    return acc;
  }, []);

// const createNavLinkItem = (link: LinkItem, linkProps?: UserPermissions): NavLinkItem => ({
//   id: link.id,
//   path: link.path,
//   title: link.title,
//   ...(link.description != null ? { description: link.description } : {}),
//   ...(link.icon != null ? { icon: link.icon } : {}),
//   ...(link.image != null ? { image: link.image } : {}),
//   ...(link.links && link.links.length
//     ? {
//         links: reduceLinks<NavLinkItem>({
//           links: link.links,
//           linkProps,
//           formatFunction: createNavLinkItem,
//         }),
//       }
//     : {}),
//   ...(link.skipUrlState != null ? { skipUrlState: link.skipUrlState } : {}),
// });

// It checks if the user has at least one of the link capabilities needed
const hasCapabilities = (linkCapabilities: string[], userCapabilities: Capabilities): boolean =>
  linkCapabilities.some((linkCapability) => get(userCapabilities, linkCapability, false));

const isLinkAllowed = (
  link: LinkItem,
  { license, experimentalFeatures, capabilities, uiSettings }: LinksPermissions
) => {
  const linkLicenseType = link.licenseType ?? 'basic';
  if (license) {
    if (!license.hasAtLeast(linkLicenseType)) {
      return false;
    }
  } else if (linkLicenseType !== 'basic') {
    return false;
  }
  if (link.hideWhenExperimentalKey && experimentalFeatures[link.hideWhenExperimentalKey]) {
    return false;
  }
  if (link.experimentalKey && !experimentalFeatures[link.experimentalKey]) {
    return false;
  }
  if (link.capabilities && !hasCapabilities(link.capabilities, capabilities)) {
    return false;
  }
  if (link.uiSettingsEnabled && !link.uiSettingsEnabled(uiSettings)) {
    return false;
  }
  return true;
};

/**
 * Recursive function to create the `NormalizedLinks` structure from a `LinkItem` array parameter
 */
const getNormalizedLinks = (
  currentLinks: Readonly<LinkItem[]>,
  parentId?: SecurityPageName
): NormalizedLinks => {
  const result = currentLinks.reduce<Partial<NormalizedLinks>>(
    (normalized, { links, ...currentLink }) => {
      normalized[currentLink.id] = {
        ...currentLink,
        parentId,
      };
      if (links && links.length > 0) {
        Object.assign(normalized, getNormalizedLinks(links, currentLink.id));
      }
      return normalized;
    },
    {}
  );
  return result as NormalizedLinks;
};

/**
 * Normalized indexed version of the global `links` array, referencing the parent by id, instead of having nested links children
 */
const normalizedLinks: Readonly<NormalizedLinks> = Object.freeze(getNormalizedLinks(appLinks));

/**
 * Returns the `NormalizedLink` from a link id parameter.
 * The object reference is frozen to make sure it is not mutated by the caller.
 */
const getNormalizedLink = (id: SecurityPageName): Readonly<NormalizedLink> =>
  Object.freeze(normalizedLinks[id]);

/**
 * Returns the `LinkInfo` from a link id parameter
 */
export const getLinkInfo = (id: SecurityPageName): LinkInfo => {
  // discards the parentId and creates the linkInfo copy.
  const { parentId, ...linkInfo } = getNormalizedLink(id);
  return linkInfo;
};

/**
 * Returns the `LinkInfo` of all the ancestors to the parameter id link, also included.
 */
export const getAncestorLinksInfo = (id: SecurityPageName): LinkInfo[] => {
  const ancestors: LinkInfo[] = [];
  let currentId: SecurityPageName | undefined = id;
  while (currentId) {
    const { parentId, ...linkInfo } = getNormalizedLink(currentId);
    ancestors.push(linkInfo);
    currentId = parentId;
  }
  return ancestors.reverse();
};

/**
 * Returns `true` if the links needs to carry the application state in the url.
 * Defaults to `true` if the `skipUrlState` property of the `LinkItem` is `undefined`.
 */
export const needsUrlState = (id: SecurityPageName): boolean => {
  return !getNormalizedLink(id).skipUrlState;
};
