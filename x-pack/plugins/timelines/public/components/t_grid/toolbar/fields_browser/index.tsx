/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiButtonEmpty, EuiToolTip } from '@elastic/eui';
import { debounce } from 'lodash';
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import styled from 'styled-components';

import type { BrowserFields } from '../../../../../common/search_strategy/index_fields';
import type { FieldBrowserProps } from '../../../../../common/types/fields_browser';
import { FieldsBrowser } from './field_browser';
import { filterBrowserFieldsByFieldName, mergeBrowserFieldsWithDefaultCategory } from './helpers';
import * as i18n from './translations';

const FIELDS_BUTTON_CLASS_NAME = 'fields-button';

/** wait this many ms after the user completes typing before applying the filter input */
export const INPUT_TIMEOUT = 250;

const FieldsBrowserButtonContainer = styled.div`
  display: inline-block;
  position: relative;
`;

FieldsBrowserButtonContainer.displayName = 'FieldsBrowserButtonContainer';
/**
 * Manages the state of the field browser
 */
export const StatefulFieldsBrowserComponent: React.FC<FieldBrowserProps> = ({
  timelineId,
  columnHeaders,
  browserFields,
  options,
  width,
}) => {
  const customizeColumnsButtonRef = useRef<HTMLButtonElement | null>(null);
  /** all field names shown in the field browser must contain this string (when specified) */
  const [filterInput, setFilterInput] = useState('');
  /** all field names shown in the field browser must contain this string (when specified) */
  const [appliedFilterInput, setAppliedFilterInput] = useState('');
  /** all fields in this collection have field names that match the filterInput */
  const [filteredBrowserFields, setFilteredBrowserFields] = useState<BrowserFields | null>(null);
  /** when true, show a spinner in the input to indicate the field browser is searching for matching field names */
  const [isSearching, setIsSearching] = useState(false);
  /** this category will be displayed in the right-hand pane of the field browser */
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  /** show the field browser */
  const [show, setShow] = useState(false);

  // debounced function to apply the input filter
  // will delay the call to setAppliedFilterInput by INPUT_TIMEOUT ms
  // the parameter used will be the last one passed
  const debouncedApplyFilterInput = useMemo(
    () =>
      debounce((input: string) => {
        setAppliedFilterInput(input);
      }, INPUT_TIMEOUT),
    []
  );
  useEffect(() => {
    return () => {
      debouncedApplyFilterInput.cancel();
    };
  }, [debouncedApplyFilterInput]);

  useEffect(() => {
    const newFilteredBrowserFields = filterBrowserFieldsByFieldName({
      browserFields: mergeBrowserFieldsWithDefaultCategory(browserFields),
      substring: appliedFilterInput,
    });
    setFilteredBrowserFields(newFilteredBrowserFields);
    setIsSearching(false);
  }, [appliedFilterInput, browserFields]);

  /** Shows / hides the field browser */
  const onShow = useCallback(() => {
    setShow(true);
  }, []);

  /** Invoked when the field browser should be hidden */
  const onHide = useCallback(() => {
    setFilterInput('');
    setAppliedFilterInput('');
    setFilteredBrowserFields(null);
    setIsSearching(false);
    setSelectedCategoryIds([]);
    setShow(false);
  }, []);

  /** Invoked when the user types in the filter input */
  const updateFilter = useCallback(
    (newFilterInput: string) => {
      setFilterInput(newFilterInput);
      setIsSearching(true);
      debouncedApplyFilterInput(newFilterInput);
    },
    [debouncedApplyFilterInput]
  );

  // only merge in the default category if the field browser is visible
  const browserFieldsWithDefaultCategory = useMemo(() => {
    return show ? mergeBrowserFieldsWithDefaultCategory(browserFields) : {};
  }, [show, browserFields]);

  return (
    <FieldsBrowserButtonContainer data-test-subj="fields-browser-button-container">
      <EuiToolTip content={i18n.FIELDS_BROWSER}>
        <EuiButtonEmpty
          aria-label={i18n.FIELDS_BROWSER}
          buttonRef={customizeColumnsButtonRef}
          className={FIELDS_BUTTON_CLASS_NAME}
          color="text"
          data-test-subj="show-field-browser"
          iconType="tableOfContents"
          onClick={onShow}
          size="xs"
        >
          {i18n.FIELDS}
        </EuiButtonEmpty>
      </EuiToolTip>

      {show && (
        <FieldsBrowser
          browserFields={browserFieldsWithDefaultCategory}
          columnHeaders={columnHeaders}
          filteredBrowserFields={
            filteredBrowserFields != null ? filteredBrowserFields : browserFieldsWithDefaultCategory
          }
          isSearching={isSearching}
          setSelectedCategoryIds={setSelectedCategoryIds}
          onHide={onHide}
          onSearchInputChange={updateFilter}
          options={options}
          restoreFocusTo={customizeColumnsButtonRef}
          searchInput={filterInput}
          appliedFilterInput={appliedFilterInput}
          selectedCategoryIds={selectedCategoryIds}
          timelineId={timelineId}
          width={width}
        />
      )}
    </FieldsBrowserButtonContainer>
  );
};

export const StatefulFieldsBrowser = React.memo(StatefulFieldsBrowserComponent);
