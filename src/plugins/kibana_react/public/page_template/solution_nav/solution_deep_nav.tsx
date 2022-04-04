/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */
import './solution_nav.scss';

import React, { FunctionComponent, useState, Fragment, useCallback } from 'react';
import { FormattedMessage } from '@kbn/i18n-react';

import {
  EuiButtonEmpty,
  EuiDescriptionList,
  EuiDescriptionListDescription,
  EuiDescriptionListTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiIcon,
  EuiLink,
  EuiSideNav,
  EuiSideNavItemType,
  EuiSideNavProps,
  EuiText,
  EuiTitle,
  useIsWithinBreakpoints,
} from '@elastic/eui';

import classNames from 'classnames';
import styled, { css } from 'styled-components';
import {
  KibanaPageTemplateSolutionNavAvatar,
  KibanaPageTemplateSolutionNavAvatarProps,
} from './solution_nav_avatar';
import { KibanaPageTemplateSolutionNavCollapseButton } from './solution_nav_collapse_button';

export type KibanaPageTemplateSolutionNavProps = EuiSideNavProps<{}> & {
  /**
   * Name of the solution, i.e. "Observability"
   */
  name: KibanaPageTemplateSolutionNavAvatarProps['name'];
  /**
   * Solution logo, i.e. "logoObservability"
   */
  icon?: KibanaPageTemplateSolutionNavAvatarProps['iconType'];
  /**
   * Control the collapsed state
   */
  isOpenOnDesktop?: boolean;
  hasSubNav?: boolean;
  onCollapse?: () => void;
};

const SubNavFlexGroup = styled(EuiFlexGroup)`
  ${({ theme }) => css`
    padding: ${theme.eui.euiSizeL};
  `}
`;

const setTabIndex = (items: Array<EuiSideNavItemType<{}>>, isHidden: boolean) => {
  return items.map((item) => {
    // @ts-ignore-next-line Can be removed on close of https://github.com/elastic/eui/issues/4925
    item.tabIndex = isHidden ? -1 : undefined;
    item.items = item.items && setTabIndex(item.items, isHidden);
    return item;
  });
};

type NavItems = Array<EuiSideNavItemType<{}>>;
type SubNavItems = Record<
  string,
  {
    title: React.ReactNode;
    items: NavItems;
  }
>;

/**
 * A wrapper around EuiSideNav but also creates the appropriate title with optional solution logo
 */
export const KibanaPageTemplateSolutionNav: FunctionComponent<
  KibanaPageTemplateSolutionNavProps
> = ({ name, icon, items, hasSubNav = true, isOpenOnDesktop = false, onCollapse, ...rest }) => {
  // The EuiShowFor and EuiHideFor components are not in sync with the euiBreakpoint() function :(
  const isSmallerBreakpoint = useIsWithinBreakpoints(['xs', 's']);
  const isMediumBreakpoint = useIsWithinBreakpoints(['m']);
  const isLargerBreakpoint = useIsWithinBreakpoints(['l', 'xl']);

  // This is used for both the EuiSideNav and EuiFlyout toggling
  const [isSideNavOpenOnMobile, setIsSideNavOpenOnMobile] = useState(false);
  const toggleOpenOnMobile = () => {
    setIsSideNavOpenOnMobile(!isSideNavOpenOnMobile);
  };

  const isHidden = isLargerBreakpoint && !isOpenOnDesktop;

  /**
   * Create the avatar
   */
  let solutionAvatar;
  if (icon) {
    solutionAvatar = <KibanaPageTemplateSolutionNavAvatar iconType={icon} name={name} />;
  }

  /**
   * Create the titles
   */
  const titleText = (
    <Fragment>
      {solutionAvatar}
      <strong>{name}</strong>
    </Fragment>
  );
  const mobileTitleText = (
    <FormattedMessage
      id="kibana-react.solutionNav.mobileTitleText"
      defaultMessage="{solutionName} Menu"
      values={{ solutionName: name || 'Navigation' }}
    />
  );

  const [currentSubNav, setCurrentSubNav] = useState<string | null>(null);
  const toggleSubNav = useCallback(
    (subNavId: string) => {
      setCurrentSubNav((currentSubNavId) => (subNavId === currentSubNavId ? null : subNavId));
    },
    [setCurrentSubNav]
  );

  const splitSubNavItems = useCallback((allItems: NavItems): [NavItems, SubNavItems] => {
    const subNavItems: SubNavItems = {};
    const navItems = allItems.map<EuiSideNavItemType<{}>>((item) => {
      return {
        ...item,
        ...(item.items != null
          ? {
              items: item.items.map<EuiSideNavItemType<{}>>(
                ({ items: subItemItems, href, onClick, ...subItem }) => {
                  if (subItemItems != null) {
                    subNavItems[subItem.id] = { title: subItem.name, items: subItemItems };
                    return {
                      ...subItem,
                      renderItem: () => (
                        <EuiLink
                          color='text'
                          css={'width: 100%; height: 28px;'}
                          onClick={(ev: React.MouseEvent<HTMLAnchorElement>) => {
                            console.log('toggle click', { ev });
                            toggleSubNav(subItem.id.toString());
                            if (onClick) {
                              onClick(ev);
                            }
                            // ev.stopPropagation(); // prevent the same navItem click to (re)toggle the subNav
                          }}
                        >
                          <EuiFlexGroup gutterSize="none">
                            <EuiFlexItem>{subItem.name}</EuiFlexItem>
                            <EuiFlexItem grow={false}>
                              <EuiIcon type="grid" />
                            </EuiFlexItem>
                          </EuiFlexGroup>
                        </EuiLink>
                      ),
                    };
                  } else {
                    return { ...subItem, href, onClick };
                  }
                }
              ),
            }
          : {}),
      };
    });
    return [navItems, subNavItems];
  }, [currentSubNav]);

  /**
   * Create the side nav component
   */
  let sideNav;
  let sideSubNav;
  if (items) {
    const sideNavClasses = classNames('kbnPageTemplateSolutionNav', {
      'kbnPageTemplateSolutionNav--hidden': isHidden,
    });
    let sideNavItems = setTabIndex(items, isHidden);
    if (hasSubNav) {
      let sideSubNavItems;
      [sideNavItems, sideSubNavItems] = splitSubNavItems(sideNavItems);
      if (sideSubNavItems && currentSubNav != null) {
        const title = sideSubNavItems[currentSubNav].title;
        sideSubNav = (
          <SubNavFlexGroup direction="column" gutterSize="m" alignItems="flexStart">
            <EuiFlexItem
              grow={false}
              css={css`
                font-size: 1.5em;
                font-weight: bold;
              `}
            >
              {title}
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiDescriptionList>
                {sideSubNavItems[currentSubNav]?.items.map((item) => (
                  <>
                    <EuiDescriptionListTitle>
                      {/* eslint-disable-next-line @elastic/eui/href-or-on-click */}
                      <EuiLink
                        href={item.href}
                        onClick={(ev) => {
                          setCurrentSubNav(null);
                          item.onClick?.(ev);
                        }}
                      >
                        {item.name}
                      </EuiLink>
                    </EuiDescriptionListTitle>
                    <EuiDescriptionListDescription>
                      A brief description of the link section
                    </EuiDescriptionListDescription>
                  </>
                ))}
              </EuiDescriptionList>
            </EuiFlexItem>
          </SubNavFlexGroup>
        );
      }
    }
    sideNav = (
      <EuiSideNav
        aria-hidden={isHidden}
        className={sideNavClasses}
        heading={titleText}
        mobileTitle={
          <Fragment>
            {solutionAvatar}
            {mobileTitleText}
          </Fragment>
        }
        toggleOpenOnMobile={toggleOpenOnMobile}
        isOpenOnMobile={isSideNavOpenOnMobile}
        items={sideNavItems}
        {...rest}
      />
    );
  }

  return (
    <Fragment>
      {/* {!!currentSubNav && (
        <Fragment>
          <EuiFlyout
            ownFocus={false}
            outsideClickCloses
            onClose={() => setCurrentSubNav(null)}
            side="left"
            size={!currentSubNav ? 248 : 496}
            closeButtonPosition="outside"
            className="kbnPageTemplateSolutionNav__flyout"
          >
            {!!currentSubNav ? (
              <EuiFlexGroup gutterSize="none" responsive={false}>
                <EuiFlexItem>{sideNav}</EuiFlexItem>
                <EuiFlexItem>{sideSubNav}</EuiFlexItem>
              </EuiFlexGroup>
            ) : (
              sideNav
            )}
          </EuiFlyout>
          <KibanaPageTemplateSolutionNavCollapseButton
            isCollapsed={true}
            onClick={toggleOpenOnMobile}
          />
        </Fragment>
      )}
      {!currentSubNav && (
        <Fragment>
          {sideNav}
          <KibanaPageTemplateSolutionNavCollapseButton
            isCollapsed={!isOpenOnDesktop}
            onClick={onCollapse}
          />
        </Fragment>
      )} */}
      <Fragment>
        {sideNav}
        {!!currentSubNav && (
          <EuiFlyout
            ownFocus={false}
            outsideClickCloses
            onClose={(ev?: React.MouseEvent) => {
              console.log('close', ev);
              // ev.stopPropagation(); // prevent the same navItem click to (re)toggle the subNav
              setCurrentSubNav(null);
            }}
            side="left"
            size="s"
            className="kbnPageTemplateSolutionSubNav__flyout"
            css={css`
              left: 248px;
            `}
          >
            {sideSubNav}
          </EuiFlyout>
        )}
        <KibanaPageTemplateSolutionNavCollapseButton
          isCollapsed={!isOpenOnDesktop}
          onClick={onCollapse}
        />
      </Fragment>
    </Fragment>
  );
};
