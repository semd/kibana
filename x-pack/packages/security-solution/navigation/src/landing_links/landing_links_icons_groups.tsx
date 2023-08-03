/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React from 'react';
import { EuiFlexGroup, EuiFlexItem, useEuiTheme } from '@elastic/eui';
import { css } from '@emotion/react';
import { LinkAnchor } from '../links';
import type { NavigationLink } from '../types';
import { LandingLinkIcon } from './landing_links_icons';
import { getKibanaLinkProps } from './utils';

export interface LandingLinksIconsGroupsProps {
  items: NavigationLink[];
  urlState?: string;
  onLinkClick?: (id: string) => void;
}

export interface LandingSubLinkProps {
  item: NavigationLink;
  urlState?: string;
  onLinkClick?: (id: string) => void;
}

const useSubLinkStyles = () => {
  const { euiTheme } = useEuiTheme();
  return {
    container: css`
      margin-top: ${euiTheme.size.base};
    `,
  };
};

const LandingSubLink: React.FC<LandingSubLinkProps> = React.memo(function LandingSubLink({
  item,
  urlState,
  onLinkClick,
}) {
  const styles = useSubLinkStyles();
  const linkProps = getKibanaLinkProps({ item, urlState, onLinkClick });

  return (
    <EuiFlexItem grow={false} css={styles.container} data-test-subj="LandingSubItem">
      <LinkAnchor tabIndex={-1} {...linkProps}>
        <h2>{item.title}</h2>
      </LinkAnchor>
    </EuiFlexItem>
  );
});

export const LandingLinksIconsGroups: React.FC<LandingLinksIconsGroupsProps> = React.memo(
  function LandingLinksIconsGroups({ items, urlState, onLinkClick }) {
    return (
      <EuiFlexGroup gutterSize="xl" wrap>
        {items.map(({ links, ...item }) => (
          <LandingLinkIcon key={item.id} item={item} urlState={urlState} onLinkClick={onLinkClick}>
            {links?.length && (
              <EuiFlexGroup gutterSize="none" direction="column" alignItems="flexStart">
                {links.map((subItem) => (
                  <LandingSubLink
                    key={subItem.id}
                    item={subItem}
                    urlState={urlState}
                    onLinkClick={onLinkClick}
                  />
                ))}
              </EuiFlexGroup>
            )}
          </LandingLinkIcon>
        ))}
      </EuiFlexGroup>
    );
  }
);

// eslint-disable-next-line import/no-default-export
export default LandingLinksIconsGroups;
