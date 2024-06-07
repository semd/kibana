/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import type { Pages } from './constants';

export type Page = typeof Pages[number];
export type SetPage = (page: Page) => void;
export type SetIntegrationName = (integrationName: string) => void;
