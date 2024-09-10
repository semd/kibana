/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';

import semver from 'semver';
import { pipe } from 'fp-ts/lib/pipeable';
import { identity } from 'fp-ts/lib/function';
import { fold } from 'fp-ts/lib/Either';

import { createPlainError, throwErrors } from '@kbn/io-ts-utils';

import {
  LOG_ENTRIES_HIGHLIGHTS_PATH,
  logEntriesHighlightsRequestRT,
  logEntriesHighlightsResponseRT,
} from '@kbn/logs-shared-plugin/common';

import moment from 'moment';
import { FtrProviderContext } from '../../ftr_provider_context';

const KEY_BEFORE_START = {
  time: new Date('2000-01-01T00:00:00.000Z').valueOf(),
  tiebreaker: -1,
};
const KEY_AFTER_END = {
  time: new Date('2000-01-01T00:00:09.001Z').valueOf(),
  tiebreaker: 0,
};

const COMMON_HEADERS = {
  'kbn-xsrf': 'some-xsrf-token',
  'Elastic-Api-Version': '1',
};

export default function ({ getService }: FtrProviderContext) {
  const es = getService('es');
  const esArchiver = getService('esArchiver');
  const supertest = getService('supertest');
  const kibanaServer = getService('kibanaServer');

  describe('log highlight apis', () => {
    before(() => esArchiver.load('x-pack/test/functional/es_archives/infra/simple_logs'));
    after(() => esArchiver.unload('x-pack/test/functional/es_archives/infra/simple_logs'));

    describe('/log_entries/highlights', () => {
      describe('with the default source', () => {
        before(() => kibanaServer.savedObjects.cleanStandardList());
        after(() => kibanaServer.savedObjects.cleanStandardList());

        it('Handles empty responses', async () => {
          const { body } = await supertest
            .post(LOG_ENTRIES_HIGHLIGHTS_PATH)
            .set(COMMON_HEADERS)
            .send(
              logEntriesHighlightsRequestRT.encode({
                logView: { type: 'log-view-reference', logViewId: 'default' },
                startTimestamp: KEY_BEFORE_START.time,
                endTimestamp: KEY_AFTER_END.time,
                highlightTerms: ['some string that does not exist'],
              })
            )
            .expect(200);

          const logEntriesHighlightsResponse = pipe(
            logEntriesHighlightsResponseRT.decode(body),
            fold(throwErrors(createPlainError), identity)
          );

          expect(logEntriesHighlightsResponse.data).to.have.length(1);

          const data = logEntriesHighlightsResponse.data[0];

          expect(data.entries).to.have.length(0);
          expect(data.topCursor).to.be(null);
          expect(data.bottomCursor).to.be(null);
        });

        it('highlights built-in message column', async () => {
          const esInfo = await es.info();
          const highlightTerms = 'message of document 0';
          const { body } = await supertest
            .post(LOG_ENTRIES_HIGHLIGHTS_PATH)
            .set(COMMON_HEADERS)
            .send(
              logEntriesHighlightsRequestRT.encode({
                logView: { type: 'log-view-reference', logViewId: 'default' },
                startTimestamp: KEY_BEFORE_START.time,
                endTimestamp: KEY_AFTER_END.time,
                highlightTerms: [highlightTerms],
              })
            )
            .expect(200);

          const logEntriesHighlightsResponse = pipe(
            logEntriesHighlightsResponseRT.decode(body),
            fold(throwErrors(createPlainError), identity)
          );

          expect(logEntriesHighlightsResponse.data).to.have.length(1);

          const data = logEntriesHighlightsResponse.data[0];
          const entries = data.entries;
          const firstEntry = entries[0];
          const lastEntry = entries[entries.length - 1];

          // Finds expected entries
          expect(entries).to.have.length(10);

          // Cursors are set correctly
          expect(firstEntry.cursor).to.eql(data.topCursor);
          expect(lastEntry.cursor).to.eql(data.bottomCursor);

          // Entries fall within range
          // @kbn/expect doesn't have a `lessOrEqualThan` or `moreOrEqualThan` comparators
          expect(firstEntry.cursor.time >= moment(KEY_BEFORE_START.time).toISOString()).to.be(true);
          expect(lastEntry.cursor.time <= moment(KEY_AFTER_END.time).toISOString()).to.be(true);

          // All entries contain the highlights
          entries.forEach((entry) => {
            entry.columns.forEach((column) => {
              if ('message' in column && 'highlights' in column.message[0]) {
                const expectation = semver.gte(esInfo.version.number, '8.10.0')
                  ? [highlightTerms]
                  : highlightTerms.split(' ');
                expect(column.message[0].highlights).to.eql(expectation);
              }
            });
          });
        });

        it('highlights field columns', async () => {
          const { body } = await supertest
            .post(LOG_ENTRIES_HIGHLIGHTS_PATH)
            .set(COMMON_HEADERS)
            .send(
              logEntriesHighlightsRequestRT.encode({
                logView: { type: 'log-view-reference', logViewId: 'default' },
                startTimestamp: KEY_BEFORE_START.time,
                endTimestamp: KEY_AFTER_END.time,
                highlightTerms: ['generate_test_data/simple_logs'],
              })
            )
            .expect(200);

          const logEntriesHighlightsResponse = pipe(
            logEntriesHighlightsResponseRT.decode(body),
            fold(throwErrors(createPlainError), identity)
          );

          expect(logEntriesHighlightsResponse.data).to.have.length(1);

          const entries = logEntriesHighlightsResponse.data[0].entries;

          // Finds expected entries
          expect(entries).to.have.length(50);

          // All entries contain the highlights
          entries.forEach((entry) => {
            entry.columns.forEach((column) => {
              if ('field' in column && 'highlights' in column && column.highlights.length > 0) {
                expect(column.highlights).to.eql(['generate_test_data/simple_logs']);
              }
            });
          });
        });

        it('applies the query as well as the highlight', async () => {
          const { body } = await supertest
            .post(LOG_ENTRIES_HIGHLIGHTS_PATH)
            .set(COMMON_HEADERS)
            .send(
              logEntriesHighlightsRequestRT.encode({
                logView: { type: 'log-view-reference', logViewId: 'default' },
                startTimestamp: KEY_BEFORE_START.time,
                endTimestamp: KEY_AFTER_END.time,
                query: JSON.stringify({
                  multi_match: { query: 'host-a', type: 'phrase', lenient: true },
                }),
                highlightTerms: ['message'],
              })
            )
            .expect(200);

          const logEntriesHighlightsResponse = pipe(
            logEntriesHighlightsResponseRT.decode(body),
            fold(throwErrors(createPlainError), identity)
          );

          expect(logEntriesHighlightsResponse.data).to.have.length(1);

          const entries = logEntriesHighlightsResponse.data[0].entries;

          // Finds expected entries
          expect(entries).to.have.length(25);

          // All entries contain the highlights
          entries.forEach((entry) => {
            entry.columns.forEach((column) => {
              if ('message' in column && 'highlights' in column.message[0]) {
                expect(column.message[0].highlights).to.eql(['message', 'message']);
              }
            });
          });
        });
      });
    });
  });
}
