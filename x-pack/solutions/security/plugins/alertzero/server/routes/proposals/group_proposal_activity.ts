/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ProposalWithMetadata } from '@kbn/agentic-investigations-plugin/common';
import {
  CLOSED_GROUP_KEY,
  type ProposalActivityGroups,
  type ProposalActivityItem,
} from '../../../common/proposals/activity';

/**
 * Baseline category keys that must always be present in the response, even when
 * empty. Mirrors `actionCategorySchema` from @kbn/workflows so the client can
 * render static columns without extra logic. Extension categories (unknown
 * strings snapshotted from an action's metadata) pass through unchanged.
 */
const BASELINE_CATEGORIES = ['contain', 'escalate', 'investigate', 'tune'] as const;

/**
 * Groups proposals into a `ProposalActivityGroups` map.
 *
 * Grouping is exclusive: a proposal appears under exactly one key —
 * `"closed"` if it has been decided (decidedAt is set), otherwise its
 * `category`. The `closed` bucket is sorted by `decidedAt` descending
 * (most recent decision first); category buckets preserve the queue order
 * returned by `listActivity` (categoryRank → impactRank → confidenceRank).
 */
export const groupProposalActivity = (
  proposals: ProposalWithMetadata[],
  titles: Map<string, string>
): ProposalActivityGroups => {
  // Seed with the closed group and the four baseline categories so the client
  // always receives these keys, even when the corresponding arrays are empty.
  const groups: ProposalActivityGroups = { [CLOSED_GROUP_KEY]: [] };
  for (const cat of BASELINE_CATEGORIES) {
    groups[cat] = [];
  }

  for (const proposal of proposals) {
    const item: ProposalActivityItem = {
      ...proposal,
      ...(titles.has(proposal.conversationId)
        ? { conversationTitle: titles.get(proposal.conversationId) }
        : {}),
    };

    if (proposal.decidedAt) {
      groups[CLOSED_GROUP_KEY].push(item);
    } else {
      const key = proposal.category;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    }
  }

  // Sort the closed bucket by most-recent decision first.
  groups[CLOSED_GROUP_KEY].sort((a, b) => {
    if (!a.decidedAt || !b.decidedAt) return 0;
    return b.decidedAt.localeCompare(a.decidedAt);
  });

  return groups;
};
