/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { useProposalChartsSummary } from '../../hooks/use_proposal_charts_summary';
import { CHARTS_SUMMARY_PANELS } from './constants';
import { ProposalChartsSummaryCard } from './proposal_charts_summary_card';

/**
 * Horizontal row of three stat cards (Respond, Investigate, Configure).
 * Fetches bucketed open-proposal counts from the API and distributes them per
 * panel. Renders nothing on error so a stats failure cannot break the queue
 * below it.
 */
export const ProposalChartsSummaryRow: React.FC = () => {
  const { data, isLoading, error } = useProposalChartsSummary();

  // Silently hide on permanent error (no cached data) — the queue below is
  // the primary surface. With keepPreviousData, a transient refetch failure
  // keeps `data` populated, so the cards stay visible.
  if (error && !data) {
    return null;
  }

  const buckets = data?.buckets ?? [];
  const lastBucket = buckets[buckets.length - 1];

  return (
    <EuiFlexGroup
      gutterSize="m"
      responsive={false}
      data-test-subj="alertZeroProposalChartsSummaryRow"
    >
      {CHARTS_SUMMARY_PANELS.map(({ id, category, label, color }) => {
        const series = buckets.map((b) => ({
          x: b.timestamp,
          y: b.counts[category] ?? 0,
        }));
        const count = lastBucket?.counts[category] ?? 0;

        return (
          <EuiFlexItem key={id}>
            <ProposalChartsSummaryCard
              id={id}
              label={label}
              color={color}
              count={count}
              series={series}
              isLoading={isLoading}
            />
          </EuiFlexItem>
        );
      })}
    </EuiFlexGroup>
  );
};
