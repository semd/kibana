/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';

import { FtrProviderContext } from '../../../../common/ftr_provider_context';
import { deleteAllCaseItems, getCaseMetrics } from '../../../../common/lib/utils';

// eslint-disable-next-line import/no-default-export
export default ({ getService }: FtrProviderContext): void => {
  const supertest = getService('supertest');
  const es = getService('es');
  const esArchiver = getService('esArchiver');

  describe('metrics', () => {
    before(async () => {
      await esArchiver.load('x-pack/test/functional/es_archives/cases/migrations/7.13.2');
    });

    after(async () => {
      await esArchiver.unload('x-pack/test/functional/es_archives/cases/migrations/7.13.2');
    });

    afterEach(async () => {
      await deleteAllCaseItems(es);
    });

    it('returns the lifespan of the case', async () => {
      const caseId = 'e49ad6e0-cf9d-11eb-a603-13e7747d215z';

      const metrics = await getCaseMetrics({ supertest, caseId, features: ['lifespan'] });

      expect(metrics).to.eql({
        lifespan: {
          creationDate: '2021-06-17T18:57:41.682Z',
          closeDate: '2021-06-17T18:57:42.682Z',
        },
      });
    });

    it('returns an error when passing invalid features', async () => {
      const caseId = 'e49ad6e0-cf9d-11eb-a603-13e7747d215z';

      const errorResponse = (await getCaseMetrics({
        supertest,
        caseId,
        features: ['bananas'],
        expectedHttpCode: 500,
        // casting here because we're expecting an error with a message field
      })) as unknown as { message: string };

      expect(errorResponse.message).to.contain('invalid features');
    });
  });
};
