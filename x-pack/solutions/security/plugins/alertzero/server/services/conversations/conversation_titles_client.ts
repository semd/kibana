/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Narrow interface for resolving conversation titles. Backed by N individual
 * `conversations.get()` calls because there is no bulk conversation API yet.
 *
 * TODO(elastic/search-team#15972): once a bulk API lands, replace the body of
 * `createConversationTitlesClient` with a single batch call. The interface is
 * deliberately narrow so this is a one-file change.
 */

import { asyncMapWithLimit } from '@kbn/std';
import type { KibanaRequest, Logger } from '@kbn/core/server';
import type { AgentBuilderPluginStart } from '@kbn/agent-builder-server';

export interface ConversationTitlesClient {
  /**
   * Returns titles keyed by conversation id. Ids that the caller cannot read
   * (access denied, not found, or any other error) are simply absent from the
   * returned map — one inaccessible conversation must not fail the whole
   * response. This is expected behaviour: a background Worker's proposal on
   * someone else's conversation may legitimately be unreadable for the viewing
   * analyst.
   */
  getTitles(conversationIds: string[]): Promise<Map<string, string>>;
}

const CONCURRENCY_LIMIT = 10;

export const createConversationTitlesClient = ({
  agentBuilder,
  request,
  logger,
}: {
  agentBuilder: AgentBuilderPluginStart;
  request: KibanaRequest;
  logger: Logger;
}): ConversationTitlesClient => ({
  async getTitles(conversationIds: string[]): Promise<Map<string, string>> {
    const uniqueIds = [...new Set(conversationIds)];

    const client = await agentBuilder.conversations.getScopedClient({ request });

    const pairs = await asyncMapWithLimit(uniqueIds, CONCURRENCY_LIMIT, async (id) => {
      try {
        const conversation = await client.get(id);
        return [id, conversation.title] as [string, string];
      } catch (err) {
        // Per-document access control denials are masked as not-found; any
        // other error (network, ES down) should also not cascade. Log at debug
        // so the gap is visible without flooding warn logs on multi-user setups.
        logger.debug(`Could not resolve title for conversation [${id}]: ${err}`);
        return undefined;
      }
    });

    const map = new Map<string, string>();
    for (const pair of pairs) {
      if (pair) {
        map.set(pair[0], pair[1]);
      }
    }
    return map;
  },
});
