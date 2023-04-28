/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import type { Logger } from '@kbn/core/server';
import { i18n } from '@kbn/i18n';
import { schema } from '@kbn/config-schema';

import { transformError } from '@kbn/securitysolution-es-utils';
import { INTERNAL_TAGS_URL } from '../../../../common/constants';
import type { SetupPlugins } from '../../../plugin';
import type { SecuritySolutionPluginRouter } from '../../../types';
import { buildSiemResponse } from '../../detection_engine/routes/utils';
import { buildFrameworkRequest } from '../../timeline/utils/common';
import { createTag, findTagsByName } from '../saved_objects';

const getTagsParamsSchema = schema.object({
  name: schema.string(),
});
const putTagParamsSchema = schema.object({
  name: schema.string(),
  description: schema.string(),
  color: schema.maybe(schema.string()),
});

export const getSecuritySolutionTagsRoute = (
  router: SecuritySolutionPluginRouter,
  logger: Logger,
  security: SetupPlugins['security']
) => {
  getTagsRoute(router, logger, security);
  putTagRoute(router, logger, security);
};

export const getTagsRoute = (
  router: SecuritySolutionPluginRouter,
  logger: Logger,
  security: SetupPlugins['security']
) => {
  router.get(
    {
      path: INTERNAL_TAGS_URL,
      validate: { query: getTagsParamsSchema },
      options: {
        tags: ['access:securitySolution'],
      },
    },
    async (context, request, response) => {
      const frameworkRequest = await buildFrameworkRequest(context, security, request);
      const savedObjectsClient = (await frameworkRequest.context.core).savedObjects.client;

      const { name: tagName } = request.query;

      try {
        const tags = await findTagsByName({
          savedObjectsClient,
          tagName,
        });

        return response.ok({
          body: tags,
        });
      } catch (err) {
        const error = transformError(err);
        logger.error(`Failed to find ${tagName} tags - ${JSON.stringify(error.message)}`);

        const siemResponse = buildSiemResponse(response);
        return siemResponse.error({
          statusCode: error.statusCode ?? 500,
          body: i18n.translate(
            'xpack.securitySolution.dashboards.getSecuritySolutionTagsErrorTitle',
            {
              values: { tagName, message: error.message },
              defaultMessage: `Failed to find {tagName} tags - {message}`,
            }
          ),
        });
      }
    }
  );
};

export const putTagRoute = (
  router: SecuritySolutionPluginRouter,
  logger: Logger,
  security: SetupPlugins['security']
) => {
  router.put(
    {
      path: INTERNAL_TAGS_URL,
      validate: { body: putTagParamsSchema },
      options: {
        tags: ['access:securitySolution'],
      },
    },
    async (context, request, response) => {
      const frameworkRequest = await buildFrameworkRequest(context, security, request);
      const savedObjectsClient = (await frameworkRequest.context.core).savedObjects.client;
      const { name: tagName, description, color } = request.body;
      try {
        const tag = await createTag({
          savedObjectsClient,
          tagName,
          description,
          color,
        });
        return response.ok({ body: tag });
      } catch (err) {
        const error = transformError(err);
        logger.error(`Failed to create ${tagName} tag - ${JSON.stringify(error.message)}`);

        const siemResponse = buildSiemResponse(response);
        return siemResponse.error({
          statusCode: error.statusCode ?? 500,
          body: i18n.translate(
            'xpack.securitySolution.dashboards.getSecuritySolutionTagsErrorTitle',
            {
              values: { tagName, message: error.message },
              defaultMessage: `Failed to create {tagName} tag - {message}`,
            }
          ),
        });
      }
    }
  );
};
