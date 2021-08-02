/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import Boom from '@hapi/boom';
import { PublicMethodsOf } from '@kbn/utility-types';
import { Filter, buildEsQuery, EsQueryConfig } from '@kbn/es-query';
import { decodeVersion, encodeHitVersion } from '@kbn/securitysolution-es-utils';
import {
  mapConsumerToIndexName,
  isValidFeatureId,
  getSafeSortIds,
  STATUS_VALUES,
} from '@kbn/rule-data-utils/target/alerts_as_data_rbac';

import { InlineScript, QueryDslQueryContainer } from '@elastic/elasticsearch/api/types';
import { AlertTypeParams, AlertingAuthorizationFilterType } from '../../../alerting/server';
import {
  ReadOperations,
  AlertingAuthorization,
  WriteOperations,
  AlertingAuthorizationEntity,
} from '../../../alerting/server';
import { Logger, ElasticsearchClient } from '../../../../../src/core/server';
import { alertAuditEvent, AlertAuditAction, operationAlertAuditActionMap } from './audit_events';
import { AuditLogger } from '../../../security/server';
import {
  ALERT_STATUS,
  ALERT_OWNER,
  RULE_ID,
  SPACE_IDS,
} from '../../common/technical_rule_data_field_names';
import { ParsedTechnicalFields } from '../../common/parse_technical_fields';

// TODO: Fix typings https://github.com/elastic/kibana/issues/101776
type NonNullableProps<Obj extends {}, Props extends keyof Obj> = Omit<Obj, Props> &
  { [K in Props]-?: NonNullable<Obj[K]> };
type AlertType = NonNullableProps<ParsedTechnicalFields, 'rule.id' | 'kibana.alert.owner'>;

const isValidAlert = (source?: ParsedTechnicalFields): source is AlertType => {
  return source?.[RULE_ID] != null && source?.[ALERT_OWNER] != null;
};
export interface ConstructorOptions {
  logger: Logger;
  authorization: PublicMethodsOf<AlertingAuthorization>;
  auditLogger?: AuditLogger;
  esClient: ElasticsearchClient;
}

export interface UpdateOptions<Params extends AlertTypeParams> {
  id: string;
  status: string;
  _version: string | undefined;
  index: string;
}

export interface BulkUpdateOptions<Params extends AlertTypeParams> {
  ids: string[] | undefined | null;
  status: STATUS_VALUES;
  index: string;
  query: string | undefined | null;
}

interface GetAlertParams {
  id: string;
  index?: string;
}

interface FetchAndAuditAlertParams {
  id: string | null | undefined;
  query: string | null | undefined;
  index?: string;
  operation: WriteOperations.Update | ReadOperations.Find | ReadOperations.Get;
  lastSortIds: Array<string | number> | undefined;
}

/**
 * Provides apis to interact with alerts as data
 * ensures the request is authorized to perform read / write actions
 * on alerts as data.
 */
export class AlertsClient {
  private readonly logger: Logger;
  private readonly auditLogger?: AuditLogger;
  private readonly authorization: PublicMethodsOf<AlertingAuthorization>;
  private readonly esClient: ElasticsearchClient;
  private readonly spaceId: string | undefined;

  constructor({ auditLogger, authorization, logger, esClient }: ConstructorOptions) {
    this.logger = logger;
    this.authorization = authorization;
    this.esClient = esClient;
    this.auditLogger = auditLogger;
    // If spaceId is undefined, it means that spaces is disabled
    // Otherwise, if space is enabled and not specified, it is "default"
    this.spaceId = this.authorization.getSpaceId();
  }

  /**
   * This will be used as a part of the "find" api
   * In the future we will add an "aggs" param
   * @param param0
   * @returns
   */
  private async fetchAlertAndAudit({
    id,
    query,
    index,
    operation,
    lastSortIds = [],
  }: FetchAndAuditAlertParams) {
    try {
      const alertSpaceId = this.spaceId;
      if (alertSpaceId == null) {
        const errorMessage = 'Failed to acquire spaceId from authorization client';
        this.logger.error(`fetchAlertAndAudit threw an error: ${errorMessage}`);
        throw Boom.failedDependency(`fetchAlertAndAudit threw an error: ${errorMessage}`);
      }

      const config: EsQueryConfig = {
        allowLeadingWildcards: true,
        queryStringOptions: { analyze_wildcard: true },
        ignoreFilterIfFieldNotInIndex: false,
        dateFormatTZ: 'Zulu',
      };
      let queryBody = {
        query: await this.buildEsQueryWithAuthz(query, id, alertSpaceId, operation, config),
        sort: [
          {
            '@timestamp': {
              order: 'asc',
              unmapped_type: 'date',
            },
          },
        ],
      };

      if (lastSortIds.length > 0) {
        queryBody = {
          ...queryBody,
          // @ts-expect-error
          search_after: lastSortIds,
        };
      }

      const result = await this.esClient.search<ParsedTechnicalFields>({
        // Context: Originally thought of always just searching `.alerts-*` but that could
        // result in a big performance hit. If the client already knows which index the alert
        // belongs to, passing in the index will speed things up
        index: index ?? '.alerts-*',
        ignore_unavailable: true,
        // @ts-expect-error
        body: queryBody,
        seq_no_primary_term: true,
      });

      if (!result?.body.hits.hits.every((hit) => isValidAlert(hit._source))) {
        const errorMessage = `Invalid alert found with id of "${id}" or with query "${query}" and operation ${operation}`;
        this.logger.error(errorMessage);
        throw Boom.badData(errorMessage);
      }

      result?.body.hits.hits.map((item) =>
        this.auditLogger?.log(
          alertAuditEvent({
            action: operationAlertAuditActionMap[operation],
            id: item._id,
            outcome: 'unknown',
          })
        )
      );

      return result.body;
    } catch (error) {
      const errorMessage = `Unable to retrieve alert details for alert with id of "${id}" or with query "${query}" and operation ${operation} \nError: ${error}`;
      this.logger.error(errorMessage);
      throw Boom.notFound(errorMessage);
    }
  }

  /**
   * When an update by ids is requested, do a multi-get, ensure authz and audit alerts, then execute bulk update
   * @param param0
   * @returns
   */
  private async fetchAlertAuditOperate({
    ids,
    status,
    indexName,
    operation,
  }: {
    ids: string[];
    status: STATUS_VALUES;
    indexName: string;
    operation: ReadOperations | WriteOperations;
  }) {
    try {
      const mgetRes = await this.esClient.mget<ParsedTechnicalFields>({
        index: indexName,
        body: {
          ids,
        },
      });
      await Promise.all(
        mgetRes.body.docs.map((item) => {
          if (
            item._source != null &&
            item._source[RULE_ID] != null &&
            item._source[OWNER] != null
          ) {
            return this.authorization.ensureAuthorized({
              ruleTypeId: item._source[RULE_ID],
              consumer: item._source[OWNER],
              operation,
              entity: AlertingAuthorizationEntity.Alert,
            });
          }
        })
      );

      const bulkUpdateRequest = mgetRes.body.docs.flatMap((item) => [
        {
          update: {
            _index: item._index,
            _id: item._id,
          },
        },
        {
          doc: { [ALERT_STATUS]: status },
        },
      ]);

      const bulkUpdateResponse = await this.esClient.bulk({
        body: bulkUpdateRequest,
      });
      return bulkUpdateResponse;
    } catch (exc) {
      this.logger.error(`error in fetchAlertAuthzAlertOperateAlert ${exc}`);
      throw exc;
    }
  }

  private async buildEsQueryWithAuthz(
    query: string | null | undefined,
    id: string | null | undefined,
    alertSpaceId: string,
    operation: WriteOperations.Update | ReadOperations.Get | ReadOperations.Find,
    config: EsQueryConfig
  ) {
    try {
      const { filter: authzFilter } = await this.authorization.getAuthorizationFilter(
        AlertingAuthorizationEntity.Alert,
        {
          type: AlertingAuthorizationFilterType.ESDSL,
          fieldNames: { consumer: OWNER, ruleTypeId: RULE_ID },
        },
        operation
      );
      return buildEsQuery(
        undefined,
        { query: query == null ? `_id:${id}` : query, language: 'kuery' },
        [
          (authzFilter as unknown) as Filter,
          ({ term: { [SPACE_IDS]: alertSpaceId } } as unknown) as Filter,
        ],
        config
      );
    } catch (exc) {
      this.logger.error(exc);
      throw Boom.expectationFailed(
        `buildEsQueryWithAuthz threw an error: unable to get authorization filter \n ${exc}`
      );
    }
  }

  /**
   * executes a search after to find alerts with query (+ authz filter)
   * @param param0
   * @returns
   */
  private async queryAndAuditAllAlerts({
    index,
    query,
    operation,
  }: {
    index: string;
    query: string;
    operation: WriteOperations.Update | ReadOperations.Find | ReadOperations.Get;
  }) {
    let lastSortIds;
    let hasSortIds = true;
    const alertSpaceId = await this.spaceId;
    if (alertSpaceId == null) {
      this.logger.error('Failed to acquire spaceId from authorization client');
      return;
    }

    const config: EsQueryConfig = {
      allowLeadingWildcards: true,
      queryStringOptions: { analyze_wildcard: true },
      ignoreFilterIfFieldNotInIndex: false,
      dateFormatTZ: 'Zulu',
    };

    const authorizedQuery = await this.buildEsQueryWithAuthz(
      query,
      null,
      alertSpaceId,
      operation,
      config
    );

    while (hasSortIds) {
      try {
        const result = await this.fetchAlertAndAudit({
          id: null,
          query,
          index,
          operation,
          lastSortIds,
        });

        if (lastSortIds != null && result?.hits.hits.length === 0) {
          return { auditedAlerts: true, authorizedQuery };
        }
        if (result == null || result.hits.hits.length === 0) {
          this.logger.error('RESULT WAS EMPTY');
          return { auditedAlerts: false, authorizedQuery };
        }

        lastSortIds = getSafeSortIds(result.hits.hits[result.hits.hits.length - 1]?.sort);
        if (lastSortIds != null && lastSortIds.length !== 0) {
          hasSortIds = true;
        } else {
          hasSortIds = false;
          return { auditedAlerts: true, authorizedQuery };
        }
      } catch (error) {
        const errorMessage = `queryAndAuditAllAlerts threw an error: Unable to retrieve alerts with query "${query}" and operation ${operation} \n ${error}`;
        this.logger.error(errorMessage);
        throw Boom.notFound(errorMessage);
      }
    }
  }

  public async get({
    id,
    index,
  }: GetAlertParams): Promise<ParsedTechnicalFields | null | undefined> {
    try {
      // first search for the alert by id, then use the alert info to check if user has access to it
      const alert = await this.fetchAlertAndAudit({
        id,
        query: null,
        index,
        operation: ReadOperations.Get,
        lastSortIds: undefined,
      });

      if (alert == null || alert.hits.hits.length === 0) {
        const errorMessage = `Unable to retrieve alert details for alert with id of "${id}" and operation ${ReadOperations.Get}`;
        this.logger.error(errorMessage);
        throw Boom.notFound(errorMessage);
      }

      return alert.hits.hits[0]._source;
    } catch (error) {
      this.auditLogger?.log(
        alertAuditEvent({
          action: AlertAuditAction.GET,
          id,
          error,
        })
      );
      throw error;
    }
  }

  public async update<Params extends AlertTypeParams = never>({
    id,
    status,
    _version,
    index,
  }: UpdateOptions<Params>) {
    try {
      const alert = await this.fetchAlertAndAudit({
        id,
        query: null,
        index,
        operation: WriteOperations.Update,
        lastSortIds: undefined,
      });

      if (alert == null || alert.hits.hits.length === 0) {
        const errorMessage = `Unable to retrieve alert details for alert with id of "${id}" and operation ${ReadOperations.Get}`;
        this.logger.error(errorMessage);
        throw Boom.notFound(errorMessage);
      }

      const { body: response } = await this.esClient.update<ParsedTechnicalFields>({
        ...decodeVersion(_version),
        id,
        index,
        body: {
          doc: {
            [ALERT_STATUS]: status,
          },
        },
        refresh: 'wait_for',
      });

      return {
        ...response,
        _version: encodeHitVersion(response),
      };
    } catch (error) {
      this.auditLogger?.log(
        alertAuditEvent({
          action: AlertAuditAction.UPDATE,
          id,
          error,
        })
      );
      throw error;
    }
  }

  public async bulkUpdate<Params extends AlertTypeParams = never>({
    ids,
    query,
    index,
    status,
  }: BulkUpdateOptions<Params>) {
    if (ids != null) {
      // blow up
      return this.fetchAlertAuditOperate({
        ids,
        status,
        indexName: index,
        operation: WriteOperations.Update,
      });
    } else if (query != null) {
      try {
        // execute either a query with ids or
        // query to be executed in updateByQuery
        // audit results of that query
        const fetchAndAuditResponse = await this.queryAndAuditAllAlerts({
          query,
          index,
          operation: WriteOperations.Update,
        });

        if (!fetchAndAuditResponse?.auditedAlerts) {
          throw Boom.unauthorized('Failed to audit alerts');
        }

        const result = await this.esClient.updateByQuery({
          index,
          conflicts: 'proceed',
          refresh: true,
          body: {
            script: {
              source: `ctx._source['kibana.rac.alert.status'] = '${status}'`,
              lang: 'painless',
            } as InlineScript,
            query: fetchAndAuditResponse.authorizedQuery as Omit<QueryDslQueryContainer, 'script'>,
          },
          ignore_unavailable: true,
        });
        return result;
      } catch (err) {
        this.logger.error(`UPDATE ERROR: ${err}`);
        throw err;
      }
    } else {
      throw Boom.badRequest('no ids or query were provided for updating');
    }
  }

  public async getAuthorizedAlertsIndices(featureIds: string[]): Promise<string[] | undefined> {
    try {
      const augmentedRuleTypes = await this.authorization.getAugmentedRuleTypesWithAuthorization(
        featureIds,
        [ReadOperations.Find, ReadOperations.Get, WriteOperations.Update],
        AlertingAuthorizationEntity.Alert
      );

      // As long as the user can read a minimum of one type of rule type produced by the provided feature,
      // the user should be provided that features' alerts index.
      // Limiting which alerts that user can read on that index will be done via the findAuthorizationFilter
      const authorizedFeatures = new Set<string>();
      for (const ruleType of augmentedRuleTypes.authorizedRuleTypes) {
        authorizedFeatures.add(ruleType.producer);
      }

      const toReturn = Array.from(authorizedFeatures).flatMap((feature) => {
        if (isValidFeatureId(feature)) {
          return mapConsumerToIndexName[feature];
        }
        return [];
      });

      return toReturn;
    } catch (exc) {
      const errMessage = `getAuthorizedAlertsIndices failed to get authorized rule types: ${exc}`;
      this.logger.error(errMessage);
      throw Boom.failedDependency(errMessage);
    }
  }
}
