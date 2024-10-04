/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { Suspense, useMemo, useCallback, useEffect, useRef, useState } from 'react';

import { EuiButtonGroup, EuiFlexGroup, EuiFlexItem, EuiSkeletonText } from '@elastic/eui';
import type { AvailablePackagesHookType, IntegrationCardItem } from '@kbn/fleet-plugin/public';
import { noop } from 'lodash';

import { css } from '@emotion/react';
import { PackageList } from './utils';
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
import type { IntegrationTabId } from './types';

interface WrapperProps {
  useAvailablePackages: AvailablePackagesHookType;
}

const isIntegrationTabId = (id: string): id is IntegrationTabId => {
  return Object.keys(INTEGRATION_TABS_BY_ID).includes(id);
};

const emptyStateStyles = { paddingTop: '16px' };
export const PackageListGrid = React.memo(({ useAvailablePackages }: WrapperProps) => {
  const { spaceId } = useOnboardingContext();
  const scrollElement = useRef<HTMLDivElement>(null);
  const [selectedTabId, setSelectedTabIdToStorage] = useStoredIntegrationTabId(
    spaceId,
    DEFAULT_TAB.id
  );
  const [toggleIdSelected, setToggleIdSelected] = useState<IntegrationTabId>(selectedTabId);
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

  const selectedTab = useMemo(() => INTEGRATION_TABS_BY_ID[selectedTabId], [selectedTabId]);

  const onSearchTermChanged = useCallback(
    (searchQuery: string) => {
      setSearchTerm(searchQuery);
      setSearchTermToStorage(searchQuery);
    },
    [setSearchTerm, setSearchTermToStorage]
  );

  useEffect(() => {
    setCategory(selectedTab.category ?? '');
    setSelectedSubCategory(selectedTab.subCategory);
    if (!selectedTab.showSearchTools) {
      // If search box are not shown, clear the search term to avoid unexpected filtering
      onSearchTermChanged('');
    }

    if (selectedTab.showSearchTools && searchTermFromStorage) {
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
  ]);

  const list: IntegrationCardItem[] = useIntegrationCardList({
    integrationsList: filteredCards,
    customCardNames: selectedTab.customCardNames,
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
        height: ${selectedTab.showSearchTools ? WITH_SEARCH_BOX_HEIGHT : WITHOUT_SEARCH_BOX_HEIGHT};
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
            showSearchTools={selectedTab.showSearchTools ?? true}
            spacer={false}
          />
        </Suspense>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
});

PackageListGrid.displayName = 'PackageListGrid';
