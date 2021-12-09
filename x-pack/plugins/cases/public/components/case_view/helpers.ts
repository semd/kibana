/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { isEmpty } from 'lodash';
import { CommentType } from '../../../common/api';
import type { CaseMetricsFeature } from '../../../common/ui';
import type { Comment } from '../../containers/types';

export const getManualAlertIdsWithNoRuleId = (comments: Comment[]): string[] => {
  const dedupeAlerts = comments.reduce((alertIds, comment: Comment) => {
    if (comment.type === CommentType.alert && isEmpty(comment.rule.id)) {
      const ids = Array.isArray(comment.alertId) ? comment.alertId : [comment.alertId];
      ids.forEach((id) => alertIds.add(id));
      return alertIds;
    }
    return alertIds;
  }, new Set<string>());
  return [...dedupeAlerts];
};

// TODO: temporary function to get metrics features, this needs to come from top level optional props with a default value
export const getAllowedMetricFeatures = ({ owner }: { owner: string[] }): CaseMetricsFeature[] => {
  if (owner.includes('securitySolution')) {
    return ['alerts.count', 'connectors', 'alerts.hosts', 'alerts.users', 'lifespan'];
  }
  return ['alerts.count', 'connectors', 'lifespan'];
};
