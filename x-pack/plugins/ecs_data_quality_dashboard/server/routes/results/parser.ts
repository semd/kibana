/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import type { Result, ResultDocument, IndexArray, IndexObject } from '../../schemas/result';

export const createDocumentFromResult = (result: Result): ResultDocument => {
  const { rollup } = result;
  const document: ResultDocument = {
    ...result,
    '@timestamp': Date.now(),
    rollup: {
      ...rollup,
      ilmExplain: indexObjectToIndexArray(rollup.ilmExplain),
      stats: indexObjectToIndexArray(rollup.stats),
      results: indexObjectToIndexArray(rollup.results),
    },
  };

  return document;
};

export const createResultFromDocument = (document: ResultDocument): Result => {
  const { rollup } = document;
  const result = {
    ...document,
    rollup: {
      ...rollup,
      ilmExplain: indexArrayToIndexObject(rollup.ilmExplain),
      stats: indexArrayToIndexObject(rollup.stats),
      results: indexArrayToIndexObject(rollup.results),
    },
  };

  return result;
};

// convert objects with indexName as key to arrays so they can be stored in ES
// this is needed since ES parses object keys as dot-separated field names
// and it crashes trying to index document with object key starting with `.` (e.g. `.index-name-checked`)
const indexObjectToIndexArray = (obj: IndexObject): IndexArray =>
  Object.entries(obj).map(([key, value]) => ({ ...value, _indexName: key }));

// convert index arrays back to objects with indexName as key
const indexArrayToIndexObject = (arr: IndexArray): IndexObject =>
  Object.fromEntries(arr.map(({ _indexName, ...value }) => [_indexName, value]));
