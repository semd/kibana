/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
export const getStatusQueryParams = (value: any) =>
  `?_a=(kuery:%27%27,rangeFrom:now-30d%2Fd,rangeTo:now,status:${value})`;
