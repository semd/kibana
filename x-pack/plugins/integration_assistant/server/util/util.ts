/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { existsSync, mkdirSync } from 'fs';

export function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export function generateUniqueId() {
  return `${Date.now() + Math.floor(Math.random() * 1e13)}`;
}
