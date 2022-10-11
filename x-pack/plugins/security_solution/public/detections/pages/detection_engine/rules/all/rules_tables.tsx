/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  EuiBasicTable,
  EuiConfirmModal,
  EuiEmptyPrompt,
  EuiLoadingContent,
  EuiProgress,
} from '@elastic/eui';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { AllRulesTabs } from './rules_table_toolbar';
import { RULES_TABLE_PAGE_SIZE_OPTIONS } from '../../../../../../common/constants';
import { Loader } from '../../../../../common/components/loader';
import { useBoolState } from '../../../../../common/hooks/use_bool_state';
import { useValueChanged } from '../../../../../common/hooks/use_value_changed';
import { RULES_TABLE_ACTIONS } from '../../../../../common/lib/apm/user_actions';
import { useStartTransaction } from '../../../../../common/lib/apm/use_start_transaction';
import { PrePackagedRulesPrompt } from '../../../../components/rules/pre_packaged_rules/load_empty_prompt';
import type { Rule, RulesSortingFields } from '../../../../containers/detection_engine/rules';
import { useTags } from '../../../../containers/detection_engine/rules/use_tags';
import { getPrePackagedRuleStatus } from '../helpers';
import * as i18n from '../translations';
import type { EuiBasicTableOnChange } from '../types';
import { useMonitoringColumns, useRulesColumns } from './use_columns';
import { showRulesTable } from './helpers';
import { useRulesTableContext } from './rules_table/rules_table_context';
import { useAsyncConfirmation } from './rules_table/use_async_confirmation';
import { RulesTableFilters } from './rules_table_filters/rules_table_filters';
import { RulesTableUtilityBar } from './rules_table_utility_bar';
import { useBulkActionsDryRun } from './bulk_actions/use_bulk_actions_dry_run';
import { useBulkActionsConfirmation } from './bulk_actions/use_bulk_actions_confirmation';
import { useBulkEditFormFlyout } from './bulk_actions/use_bulk_edit_form_flyout';
import { BulkActionDryRunConfirmation } from './bulk_actions/bulk_action_dry_run_confirmation';
import { BulkEditFlyout } from './bulk_actions/bulk_edit_flyout';
import { useBulkActions } from './bulk_actions/use_bulk_actions';

const INITIAL_SORT_FIELD = 'enabled';

interface RulesTableProps {
  createPrePackagedRules: () => void;
  hasPermissions: boolean;
  loadingCreatePrePackagedRules: boolean;
  rulesCustomInstalled?: number;
  rulesInstalled?: number;
  rulesNotInstalled?: number;
  rulesNotUpdated?: number;
  selectedTab: AllRulesTabs;
}

const NO_ITEMS_MESSAGE = (
  <EuiEmptyPrompt title={<h3>{i18n.NO_RULES}</h3>} titleSize="xs" body={i18n.NO_RULES_BODY} />
);

/**
 * Table Component for displaying all Rules for a given cluster. Provides the ability to filter
 * by name, sort by enabled, and perform the following actions:
 *   * Enable/Disable
 *   * Duplicate
 *   * Delete
 *   * Import/Export
 */
export const RulesTables = React.memo<RulesTableProps>(
  ({
    createPrePackagedRules,
    hasPermissions,
    loadingCreatePrePackagedRules,
    rulesCustomInstalled,
    rulesInstalled,
    rulesNotInstalled,
    rulesNotUpdated,
    selectedTab,
  }) => {
    const { startTransaction } = useStartTransaction();
    const tableRef = useRef<EuiBasicTable>(null);
    const rulesTableContext = useRulesTableContext();

    const {
      state: {
        rules,
        filterOptions,
        isActionInProgress,
        isAllSelected,
        isFetched,
        isLoading,
        isRefetching,
        isRefreshOn,
        loadingRuleIds,
        loadingRulesAction,
        pagination,
        selectedRuleIds,
        sortingOptions,
      },
      actions: {
        reFetchRules,
        setIsAllSelected,
        setIsRefreshOn,
        setPage,
        setPerPage,
        setSelectedRuleIds,
        setSortingOptions,
      },
    } = rulesTableContext;

    const prePackagedRuleStatus = getPrePackagedRuleStatus(
      rulesInstalled,
      rulesNotInstalled,
      rulesNotUpdated
    );

    const [, allTags, reFetchTags] = useTags();

    useEffect(() => {
      reFetchTags();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rulesCustomInstalled, rulesInstalled]);

    const [isDeleteConfirmationVisible, showDeleteConfirmation, hideDeleteConfirmation] =
      useBoolState();

    const [confirmDeletion, handleDeletionConfirm, handleDeletionCancel] = useAsyncConfirmation({
      onInit: showDeleteConfirmation,
      onFinish: hideDeleteConfirmation,
    });

    const {
      bulkActionsDryRunResult,
      bulkAction,
      isBulkActionConfirmationVisible,
      showBulkActionConfirmation,
      cancelBulkActionConfirmation,
      approveBulkActionConfirmation,
    } = useBulkActionsConfirmation();

    const {
      bulkEditActionType,
      isBulkEditFlyoutVisible,
      handleBulkEditFormConfirm,
      handleBulkEditFormCancel,
      completeBulkEditForm,
    } = useBulkEditFormFlyout();

    const selectedItemsCount = isAllSelected ? pagination.total : selectedRuleIds.length;

    const { isBulkActionsDryRunLoading, executeBulkActionsDryRun } = useBulkActionsDryRun();

    const getBulkItemsPopoverContent = useBulkActions({
      filterOptions,
      confirmDeletion,
      showBulkActionConfirmation,
      completeBulkEditForm,
      reFetchTags,
      executeBulkActionsDryRun,
    });

    const paginationMemo = useMemo(
      () => ({
        pageIndex: pagination.page - 1,
        pageSize: pagination.perPage,
        totalItemCount: pagination.total,
        pageSizeOptions: RULES_TABLE_PAGE_SIZE_OPTIONS,
      }),
      [pagination]
    );

    const tableOnChangeCallback = useCallback(
      ({ page, sort }: EuiBasicTableOnChange) => {
        setSortingOptions({
          field: (sort?.field as RulesSortingFields) ?? INITIAL_SORT_FIELD, // Narrowing EuiBasicTable sorting types
          order: sort?.direction ?? 'desc',
        });
        setPage(page.index + 1);
        setPerPage(page.size);
      },
      [setPage, setPerPage, setSortingOptions]
    );

    const rulesColumns = useRulesColumns({ hasPermissions });
    const monitoringColumns = useMonitoringColumns({ hasPermissions });

    const handleCreatePrePackagedRules = useCallback(async () => {
      if (createPrePackagedRules != null) {
        startTransaction({ name: RULES_TABLE_ACTIONS.LOAD_PREBUILT });
        await createPrePackagedRules();
        await reFetchRules();
      }
    }, [createPrePackagedRules, reFetchRules, startTransaction]);

    const handleRefreshRules = useCallback(() => {
      startTransaction({ name: RULES_TABLE_ACTIONS.REFRESH });
      reFetchRules();
    }, [reFetchRules, startTransaction]);

    const isSelectAllCalled = useRef(false);

    // Synchronize selectedRuleIds with EuiBasicTable's selected rows
    useValueChanged((ruleIds) => {
      if (tableRef.current != null) {
        tableRef.current.setSelection(rules.filter((rule) => ruleIds.includes(rule.id)));
      }
    }, selectedRuleIds);

    const euiBasicTableSelectionProps = useMemo(
      () => ({
        selectable: (item: Rule) => !loadingRuleIds.includes(item.id),
        onSelectionChange: (selected: Rule[]) => {
          /**
           * EuiBasicTable doesn't provide declarative API to control selected rows.
           * This limitation requires us to synchronize selection state manually using setSelection().
           * But it creates a chain reaction when the user clicks Select All:
           * selectAll() -> setSelection() -> onSelectionChange() -> setSelection().
           * To break the chain we should check whether the onSelectionChange was triggered
           * by the Select All action or not.
           *
           */
          if (isSelectAllCalled.current) {
            isSelectAllCalled.current = false;
            // Handle special case of unselecting all rules via checkbox
            // after all rules were selected via Bulk select.
            if (selected.length === 0) {
              setIsAllSelected(false);
              setSelectedRuleIds([]);
            }
          } else {
            setSelectedRuleIds(selected.map(({ id }) => id));
            setIsAllSelected(false);
          }
        },
      }),
      [loadingRuleIds, setIsAllSelected, setSelectedRuleIds]
    );

    const toggleSelectAll = useCallback(() => {
      isSelectAllCalled.current = true;
      setIsAllSelected(!isAllSelected);
      setSelectedRuleIds(!isAllSelected ? rules.map(({ id }) => id) : []);
    }, [rules, isAllSelected, setIsAllSelected, setSelectedRuleIds]);

    const handleAutoRefreshSwitch = useCallback(
      (refreshOn: boolean) => {
        if (refreshOn) {
          reFetchRules();
        }
        setIsRefreshOn(refreshOn);
      },
      [setIsRefreshOn, reFetchRules]
    );

    const shouldShowRulesTable = useMemo(
      (): boolean => showRulesTable({ rulesCustomInstalled, rulesInstalled }) && !isLoading,
      [isLoading, rulesCustomInstalled, rulesInstalled]
    );

    const shouldShowPrepackagedRulesPrompt = useMemo(
      (): boolean =>
        rulesCustomInstalled != null &&
        rulesCustomInstalled === 0 &&
        prePackagedRuleStatus === 'ruleNotInstalled' &&
        !isLoading,
      [isLoading, prePackagedRuleStatus, rulesCustomInstalled]
    );

    const tableProps =
      selectedTab === AllRulesTabs.rules
        ? {
            'data-test-subj': 'rules-table',
            columns: rulesColumns,
          }
        : { 'data-test-subj': 'monitoring-table', columns: monitoringColumns };

    const shouldShowLinearProgress = isFetched && isRefetching;
    const shouldShowLoadingOverlay = (!isFetched && isRefetching) || isActionInProgress;

    return (
      <>
        {shouldShowLinearProgress && (
          <EuiProgress
            data-test-subj="loadingRulesInfoProgress"
            size="xs"
            position="absolute"
            color="accent"
          />
        )}
        {shouldShowLoadingOverlay && (
          <Loader data-test-subj="loadingPanelAllRulesTable" overlay size="xl" />
        )}
        {shouldShowRulesTable && (
          <RulesTableFilters
            rulesCustomInstalled={rulesCustomInstalled}
            rulesInstalled={rulesInstalled}
            allTags={allTags}
          />
        )}
        {shouldShowPrepackagedRulesPrompt && (
          <PrePackagedRulesPrompt
            createPrePackagedRules={handleCreatePrePackagedRules}
            loading={loadingCreatePrePackagedRules}
            userHasPermissions={hasPermissions}
          />
        )}
        {isLoading && (
          <EuiLoadingContent data-test-subj="initialLoadingPanelAllRulesTable" lines={10} />
        )}
        {isDeleteConfirmationVisible && (
          <EuiConfirmModal
            title={i18n.DELETE_CONFIRMATION_TITLE}
            onCancel={handleDeletionCancel}
            onConfirm={handleDeletionConfirm}
            confirmButtonText={i18n.DELETE_CONFIRMATION_CONFIRM}
            cancelButtonText={i18n.DELETE_CONFIRMATION_CANCEL}
            buttonColor="danger"
            defaultFocusedButton="confirm"
            data-test-subj="allRulesDeleteConfirmationModal"
          >
            <p>{i18n.DELETE_CONFIRMATION_BODY}</p>
          </EuiConfirmModal>
        )}
        {isBulkActionConfirmationVisible && bulkAction && (
          <BulkActionDryRunConfirmation
            bulkAction={bulkAction}
            result={bulkActionsDryRunResult}
            onCancel={cancelBulkActionConfirmation}
            onConfirm={approveBulkActionConfirmation}
          />
        )}
        {isBulkEditFlyoutVisible && bulkEditActionType !== undefined && (
          <BulkEditFlyout
            rulesCount={bulkActionsDryRunResult?.succeededRulesCount ?? 0}
            editAction={bulkEditActionType}
            onClose={handleBulkEditFormCancel}
            onConfirm={handleBulkEditFormConfirm}
            tags={allTags}
          />
        )}
        {shouldShowRulesTable && (
          <>
            <RulesTableUtilityBar
              canBulkEdit={hasPermissions}
              pagination={pagination}
              numberSelectedItems={selectedItemsCount}
              onGetBulkItemsPopoverContent={getBulkItemsPopoverContent}
              onRefresh={handleRefreshRules}
              isAutoRefreshOn={isRefreshOn}
              onRefreshSwitch={handleAutoRefreshSwitch}
              isAllSelected={isAllSelected}
              onToggleSelectAll={toggleSelectAll}
              isBulkActionInProgress={isBulkActionsDryRunLoading || loadingRulesAction != null}
              hasDisabledActions={loadingRulesAction != null}
            />
            <EuiBasicTable
              itemId="id"
              items={rules}
              isSelectable={hasPermissions}
              noItemsMessage={NO_ITEMS_MESSAGE}
              onChange={tableOnChangeCallback}
              pagination={paginationMemo}
              ref={tableRef}
              selection={hasPermissions ? euiBasicTableSelectionProps : undefined}
              sorting={{
                sort: {
                  // EuiBasicTable has incorrect `sort.field` types which accept only `keyof Item` and reject fields in dot notation
                  field: sortingOptions.field as keyof Rule,
                  direction: sortingOptions.order,
                },
              }}
              {...tableProps}
            />
          </>
        )}
      </>
    );
  }
);

RulesTables.displayName = 'RulesTables';
