/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { ApiPrivileges } from '@kbn/core-security-server';
import type { z } from '@kbn/zod/v4';
import { API_VERSIONS, ALERTZERO_PROPOSAL_ACTIVITY_URL, INTERNAL_API_ACCESS } from '@kbn/alertzero-common';
import { proposalActivityQuerySchema } from '@kbn/agentic-investigations-plugin/common';
import { buildRouteValidationWithZod } from '@kbn/zod-helpers/v4';
import { ALERTZERO_API_PRIVILEGE_READ } from '../../../common/constants';
import type { GetProposalActivityResponse } from '../../../common/proposals/activity';
import { createConversationTitlesClient } from '../../services/conversations/conversation_titles_client';
import { groupProposalActivity } from './group_proposal_activity';
import type { RouteDependencies } from '../register_routes';

// Re-derive the proposals read privilege with the same ApiPrivileges helper used
// by agentic_investigations/server/proposals/constants.ts. The constant there
// lives in a server-only module that cannot be imported across plugins, so we
// compute the identical value here. This privilege is load-bearing: the
// ProposalsService reads the index as asInternalUser and its README states that
// authz is enforced only at the API layer; requiring only alertzero_read would let a
// user without the proposals feature read proposals they were never granted.
const PROPOSALS_API_PRIVILEGE_READ = ApiPrivileges.read('proposals');

const GetProposalActivityRequestQuery = proposalActivityQuerySchema;
type GetProposalActivityRequestQuery = z.infer<typeof GetProposalActivityRequestQuery>;

export const registerGetProposalActivityRoute = ({
  router,
  logger,
  getSpaceId,
  getAgentBuilder,
  getProposalsService,
}: RouteDependencies) => {
  router.versioned
    .get({
      path: ALERTZERO_PROPOSAL_ACTIVITY_URL,
      access: INTERNAL_API_ACCESS,
      security: {
        authz: {
          requiredPrivileges: [ALERTZERO_API_PRIVILEGE_READ, PROPOSALS_API_PRIVILEGE_READ],
        },
      },
      summary: 'Get proposal activity grouped by category',
      description:
        'Returns all pending proposals plus proposals decided within the window, grouped by action category.',
    })
    .addVersion(
      {
        version: API_VERSIONS.internal.v1,
        validate: {
          request: {
            query: buildRouteValidationWithZod(GetProposalActivityRequestQuery),
          },
        },
      },
      async (_context, request, response) => {
        try {
          const spaceId = getSpaceId(request);
          const proposalsService = getProposalsService();

          const { proposals, total, truncated } = await proposalsService.listActivity(
            request.query,
            spaceId
          );

          const conversationIds = proposals.map((p) => p.conversationId);
          const titlesClient = createConversationTitlesClient({
            agentBuilder: getAgentBuilder(),
            request,
            logger,
          });
          const titles = await titlesClient.getTitles(conversationIds);

          const groups = groupProposalActivity(proposals, titles);

          const body: GetProposalActivityResponse = { groups, total, truncated };
          return response.ok({ body });
        } catch (error) {
          logger.error(`Failed to get proposal activity: ${error}`);
          return response.customError({
            statusCode: 500,
            body: { message: 'Failed to get proposal activity' },
          });
        }
      }
    );
};
