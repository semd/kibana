/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { ActionType, CaseMetricsResponse } from '../../../common/api';
import { Operations } from '../../authorization';
import { createCaseError } from '../../common/error';
import { CountActionsResponse } from '../../services/attachments';
import { CasesClient } from '../client';
import { CasesClientArgs } from '../types';
import { MetricsHandler } from './types';

export class Actions implements MetricsHandler {
  constructor(
    private readonly caseId: string,
    private readonly casesClient: CasesClient,
    private readonly clientArgs: CasesClientArgs
  ) {}

  public getFeatures(): Set<string> {
    return new Set(['actions.isolateHost']);
  }

  public async compute(): Promise<CaseMetricsResponse> {
    const { unsecuredSavedObjectsClient, authorization, attachmentService, logger } =
      this.clientArgs;

    try {
      // This will perform an authorization check to ensure the user has access to the parent case
      const theCase = await this.casesClient.cases.get({
        id: this.caseId,
        includeComments: false,
        includeSubCaseComments: false,
      });

      const { filter: authorizationFilter } = await authorization.getAuthorizationFilter(
        Operations.getAttachmentMetrics
      );

      const actionsCounters = await attachmentService.countActionsAttachedToCase({
        unsecuredSavedObjectsClient,
        caseId: theCase.id,
        filter: authorizationFilter,
      });

      return this.formatResponse(actionsCounters);
    } catch (error) {
      throw createCaseError({
        message: `Failed to count actions attached case id: ${this.caseId}: ${error}`,
        error,
        logger,
      });
    }
  }

  private formatResponse(actionsCounters: CountActionsResponse | undefined): CaseMetricsResponse {
    return {
      actions: {
        isolateHost: {
          [ActionType.isolate]: { total: actionsCounters?.[ActionType.isolate] ?? 0 },
          [ActionType.unisolate]: { total: actionsCounters?.[ActionType.unisolate] ?? 0 },
        },
      },
    };
  }
}
