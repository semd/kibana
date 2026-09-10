/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Types for the proposal-activity API (`GET /internal/alertzero/proposals/activity`).
 *
 * These types live here rather than in @kbn/alertzero-common because:
 * 1. `ProposalWithMetadata` is defined in @kbn/agentic-investigations-plugin/common,
 *    which the standalone kbn-alertzero-common package should not import.
 * 2. `category` is an open string set (not a closed enum), so the payload shape
 *    is `Record<string, …>` — code-generation would express this as bare
 *    `additionalProperties` with no type safety benefit.
 */

import type { ProposalWithMetadata } from '@kbn/agentic-investigations-plugin/common';

/** Key used for proposals that have been decided (regardless of their category). */
export const CLOSED_GROUP_KEY = 'closed' as const;

/**
 * A proposal enriched with the title of its conversation. `conversationTitle`
 * is optional because per-document access control on conversations may prevent
 * the server from reading a title even for a proposal the caller is allowed to
 * see (a background Worker's proposal on another user's conversation, for
 * example). The proposal itself is always returned; the caller already has
 * `conversationId` available if they need to deep-link.
 */
export interface ProposalActivityItem extends ProposalWithMetadata {
  conversationTitle?: string;
}

/**
 * Proposals grouped by their action category (pending) or under the special
 * `"closed"` key (decided). The four baseline categories (`contain`, `escalate`,
 * `investigate`, `tune`) are always present as keys even when empty; extension
 * categories appear as they occur.
 */
export type ProposalActivityGroups = Record<string, ProposalActivityItem[]>;

export interface GetProposalActivityResponse {
  groups: ProposalActivityGroups;
  total: number;
  /**
   * `true` when the underlying result was capped at `MAX_PROPOSAL_ACTIVITY_SIZE`.
   * The caller is seeing the highest-priority prefix.
   */
  truncated: boolean;
}
