/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { FC, useMemo } from 'react';
import { i18n } from '@kbn/i18n';
import type { AppDeepLinkId, NodeDefinition } from '@kbn/core-chrome-browser';

import { generateUniqueNodeId } from '../utils';
import { Navigation } from './components';
import type {
  GroupDefinition,
  PresetDefinition,
  NavigationTreeDefinition,
  NonEmptyArray,
  ProjectNavigationDefinition,
  ProjectNavigationTreeDefinition,
  RootNavigationItemDefinition,
  RecentlyAccessedDefinition,
} from './types';
import { RecentlyAccessed } from './components/recently_accessed';
import { NavigationFooter } from './components/navigation_footer';
import { getPresets } from './nav_tree_presets';
import type { ContentProvider } from './components/panel';

const isPresetDefinition = (
  item: RootNavigationItemDefinition | NodeDefinition
): item is PresetDefinition => {
  return (item as PresetDefinition).preset !== undefined;
};

const isGroupDefinition = (
  item: RootNavigationItemDefinition | NodeDefinition
): item is GroupDefinition => {
  return (
    (item as GroupDefinition).type === 'navGroup' || (item as NodeDefinition).children !== undefined
  );
};

const isRecentlyAccessedDefinition = (
  item: RootNavigationItemDefinition | NodeDefinition
): item is RecentlyAccessedDefinition => {
  return (item as RootNavigationItemDefinition).type === 'recentlyAccessed';
};

/**
 * Handler to build a full navigation tree definition from a project definition
 * It adds all the defaults and presets (recently accessed, footer content...)
 *
 * @param projectDefinition The project definition
 * @returns The full navigation tree definition
 */
const getDefaultNavigationTree = (
  projectDefinition: ProjectNavigationTreeDefinition
): NavigationTreeDefinition => {
  return {
    body: [
      {
        type: 'recentlyAccessed',
      },
      ...projectDefinition.map((def) => ({ ...def, type: 'navGroup' as const })),
      {
        type: 'navGroup',
        ...getPresets('analytics'),
      },
      {
        type: 'navGroup',
        ...getPresets('ml'),
      },
    ],
    footer: [
      {
        type: 'navGroup',
        id: 'devTools',
        title: i18n.translate('sharedUXPackages.chrome.sideNavigation.devTools', {
          defaultMessage: 'Developer tools',
        }),
        link: 'dev_tools',
        icon: 'editorCodeBlock',
      },
      {
        type: 'navGroup',
        id: 'project_settings_project_nav',
        title: i18n.translate('sharedUXPackages.chrome.sideNavigation.projectSettings', {
          defaultMessage: 'Project settings',
        }),
        icon: 'gear',
        breadcrumbStatus: 'hidden',
        children: [
          {
            link: 'management',
            title: i18n.translate('sharedUXPackages.chrome.sideNavigation.mngt', {
              defaultMessage: 'Management',
            }),
          },
          {
            id: 'cloudLinkUserAndRoles',
            cloudLink: 'userAndRoles',
          },
          {
            id: 'cloudLinkBilling',
            cloudLink: 'billingAndSub',
          },
        ],
      },
    ],
  };
};

/**
 * Serialize a navigation node. Currently this handler only adds an autogenerated id if it's missing
 *
 * @param item The navigation node
 * @returns The navigation node serialized
 */
function serializeNode<
  T extends {
    id?: string;
    link?: LinkId;
    children?: NonEmptyArray<{ id?: string; link?: LinkId }>;
  },
  LinkId extends AppDeepLinkId = AppDeepLinkId
>(item: T, index: number, depth = 0): T & { id: string } {
  // IF no "id" is provided we will generate a unique id
  const id = item.id ?? `node-${depth}-${index}`;

  const serializedChildren = item.children?.map((_item, i) => serializeNode(_item, i, depth + 1));

  return {
    ...item,
    id,
    children: serializedChildren,
  };
}

const serializeNavigationTree = (navTree: NavigationTreeDefinition): NavigationTreeDefinition => {
  const serialized: NavigationTreeDefinition = { ...navTree };

  const serialize = (item: RootNavigationItemDefinition, index: number) => {
    if (item.type === 'recentlyAccessed') return item;
    return serializeNode(item, index);
  };

  if (navTree.body) {
    serialized.body = navTree.body.map(serialize);
  }

  if (navTree.footer) {
    serialized.footer = navTree.footer.map(serialize);
  }

  return serialized;
};

const renderItems = (
  items: Array<RootNavigationItemDefinition | NodeDefinition> = [],
  path: string[] = []
) => {
  return items.map((item, i) => {
    if (isPresetDefinition(item)) {
      return <Navigation.Group preset={item.preset} key={`${item.preset}-${i}`} />;
    }

    if (isRecentlyAccessedDefinition(item)) {
      return <RecentlyAccessed {...item} key={`recentlyAccessed-${i}`} />;
    }

    const { id = generateUniqueNodeId() } = item;

    if (isGroupDefinition(item)) {
      return (
        <Navigation.Group {...item} id={id} key={id}>
          {/* Recursively build the tree */}
          {renderItems(item.children, [...path, id])}
        </Navigation.Group>
      );
    }
    return <Navigation.Item {...item} key={id} />;
  });
};

interface Props {
  dataTestSubj?: string;
  panelContentProvider?: ContentProvider;
}

export const DefaultNavigation: FC<ProjectNavigationDefinition & Props> = ({
  projectNavigationTree,
  navigationTree,
  dataTestSubj,
  panelContentProvider,
}) => {
  if (!navigationTree && !projectNavigationTree) {
    throw new Error('One of navigationTree or projectNavigationTree must be defined');
  }

  const navigationDefinition = useMemo(() => {
    const definition = !navigationTree
      ? getDefaultNavigationTree(projectNavigationTree!)
      : navigationTree!;

    return serializeNavigationTree(definition);
  }, [navigationTree, projectNavigationTree]);

  return (
    <Navigation dataTestSubj={dataTestSubj} panelContentProvider={panelContentProvider}>
      <>
        {renderItems(navigationDefinition.body)}
        {navigationDefinition.footer && (
          <NavigationFooter>{renderItems(navigationDefinition.footer)}</NavigationFooter>
        )}
      </>
    </Navigation>
  );
};
