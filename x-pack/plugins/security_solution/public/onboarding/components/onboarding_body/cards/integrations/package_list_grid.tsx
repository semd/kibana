/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { lazy, Suspense, useMemo, useCallback, useEffect, useRef, useState } from 'react';

import { EuiButtonGroup, EuiFlexGroup, EuiFlexItem, EuiSkeletonText } from '@elastic/eui';
import type { AvailablePackagesHookType, IntegrationCardItem } from '@kbn/fleet-plugin/public';
import { noop } from 'lodash';

import { css } from '@emotion/react';
import {
  useStoredIntegrationSearchTerm,
  useStoredIntegrationTabId,
} from '../../../../hooks/use_stored_state';
import { useOnboardingContext } from '../../../onboarding_context';
import {
  DEFAULT_TAB,
  LOADING_SKELETON_HEIGHT,
  SCROLL_ELEMENT_ID,
  SEARCH_FILTER_CATEGORIES,
  WITHOUT_SEARCH_BOX_HEIGHT,
  WITH_SEARCH_BOX_HEIGHT,
} from './constants';
import { INTEGRATION_TABS, INTEGRATION_TABS_BY_ID } from './integration_tabs_configs';
import { useIntegrationCardList } from './use_integration_card_list';
import { IntegrationTabId } from './types';
import { IntegrationCardTopCallout } from './callouts/integration_card_top_callout';

export interface WrapperProps {
  installedIntegrationsCount: number;
  isAgentRequired: boolean;
  useAvailablePackages: AvailablePackagesHookType;
}

const isIntegrationTabId = (id: string): id is IntegrationTabId => {
  return Object.keys(INTEGRATION_TABS_BY_ID).includes(id);
};

const emptyStateStyles = { paddingTop: '16px' };

export const PackageList = lazy(async () => ({
  default: await import('@kbn/fleet-plugin/public')
    .then((module) => module.PackageList())
    .then((pkg) => pkg.PackageListGrid),
}));

export const PackageListGrid = React.memo(
  ({ installedIntegrationsCount, isAgentRequired, useAvailablePackages }: WrapperProps) => {
    const { spaceId } = useOnboardingContext();
    const scrollElement = useRef<HTMLDivElement>(null);
    const [selectedTabIdFromStorage, setSelectedTabIdToStorage] = useStoredIntegrationTabId(
      spaceId,
      DEFAULT_TAB.id
    );
    const [toggleIdSelected, setToggleIdSelected] =
      useState<IntegrationTabId>(selectedTabIdFromStorage);
    const [searchTermFromStorage, setSearchTermToStorage] = useStoredIntegrationSearchTerm(spaceId);
    const onTabChange = useCallback(
      (id: string) => {
        if (!isIntegrationTabId(id)) {
          return;
        }
        scrollElement.current?.scrollTo?.(0, 0);
        setToggleIdSelected(id);
        setSelectedTabIdToStorage(id);
      },
      [setToggleIdSelected, setSelectedTabIdToStorage]
    );

    const {
      filteredCards,
      isLoading,
      searchTerm,
      setCategory,
      setSearchTerm,
      setSelectedSubCategory,
    } = useAvailablePackages({
      prereleaseIntegrationsEnabled: false,
    });

    const selectedTab = useMemo(() => INTEGRATION_TABS_BY_ID[toggleIdSelected], [toggleIdSelected]);

    const onSearchTermChanged = useCallback(
      (searchQuery: string) => {
        setSearchTerm(searchQuery);
        // Search term is preserved across VISIBLE tabs
        // As we want user to be able to see the same search results when coming back from Fleet
        if (selectedTab.showSearchTools) {
          setSearchTermToStorage(searchQuery);
        }
      },
      [selectedTab.showSearchTools, setSearchTerm, setSearchTermToStorage]
    );

    useEffect(() => {
      setCategory(selectedTab.category ?? '');
      setSelectedSubCategory(selectedTab.subCategory);
      if (!selectedTab.showSearchTools) {
        // If search box are not shown, clear the search term to avoid unexpected filtering
        onSearchTermChanged('');
      }

      if (
        selectedTab.showSearchTools &&
        searchTermFromStorage &&
        toggleIdSelected !== IntegrationTabId.recommended
      ) {
        setSearchTerm(searchTermFromStorage);
      }
    }, [
      onSearchTermChanged,
      searchTermFromStorage,
      selectedTab.category,
      selectedTab.showSearchTools,
      selectedTab.subCategory,
      setCategory,
      setSearchTerm,
      setSelectedSubCategory,
      toggleIdSelected,
    ]);

    const list: IntegrationCardItem[] = useIntegrationCardList({
      integrationsList: filteredCards,
      featuredCardIds: selectedTab.featuredCardIds,
    });

    if (isLoading) {
      return (
        <EuiSkeletonText
          data-test-subj="loadingPackages"
          isLoading={true}
          lines={LOADING_SKELETON_HEIGHT}
        />
      );
    }
    return (
      <EuiFlexGroup
        direction="column"
        className="step-paragraph"
        gutterSize={selectedTab.showSearchTools ? 'm' : 'none'}
        css={css`
          height: ${selectedTab.showSearchTools
            ? WITH_SEARCH_BOX_HEIGHT
            : WITHOUT_SEARCH_BOX_HEIGHT};
        `}
      >
        <EuiFlexItem grow={false}>
          <EuiButtonGroup
            buttonSize="compressed"
            color="primary"
            idSelected={toggleIdSelected}
            isFullWidth
            legend="Categories"
            onChange={onTabChange}
            options={INTEGRATION_TABS}
            type="single"
          />
        </EuiFlexItem>
        <EuiFlexItem
          css={css`
            overflow-y: ${selectedTab.overflow ?? 'auto'};
          `}
          grow={1}
          id={SCROLL_ELEMENT_ID}
          ref={scrollElement}
        >
          <Suspense fallback={<EuiSkeletonText isLoading={true} lines={LOADING_SKELETON_HEIGHT} />}>
            <PackageList
              callout={
                <IntegrationCardTopCallout
                  isAgentRequired={isAgentRequired}
                  installedIntegrationsCount={installedIntegrationsCount}
                />
              }
              calloutTopSpacerSize="m"
              categories={SEARCH_FILTER_CATEGORIES} // We do not want to show categories and subcategories as the search bar filter
              emptyStateStyles={emptyStateStyles}
              list={list}
              scrollElementId={SCROLL_ELEMENT_ID}
              searchTerm={searchTerm}
              selectedCategory={selectedTab.category ?? ''}
              selectedSubCategory={selectedTab.subCategory}
              setCategory={setCategory}
              setSearchTerm={onSearchTermChanged}
              setUrlandPushHistory={noop}
              setUrlandReplaceHistory={noop}
              showCardLabels={false}
              showControls={false}
              showSearchTools={selectedTab.showSearchTools}
              sortByFeaturedIntegrations={selectedTab.sortByFeaturedIntegrations}
              spacer={false}
            />
          </Suspense>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }
);

PackageListGrid.displayName = 'PackageListGrid';
