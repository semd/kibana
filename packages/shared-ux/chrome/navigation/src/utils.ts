/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import type { ChromeProjectNavigationNode } from '@kbn/core-chrome-browser';

let uniqueId = 0;

export function generateUniqueNodeId() {
  const id = `node${uniqueId++}`;
  return id;
}

export function isAbsoluteLink(link: string) {
  return link.startsWith('http://') || link.startsWith('https://');
}

export function getUniqueNodeId<T extends { path?: string[]; id: string } | null>(
  node?: T
): T extends { path?: string[]; id: string } ? string : undefined {
  if (!node) return undefined as T extends { path?: string[]; id: string } ? string : undefined;
  return (node.path ? node.path.join('.') : node.id) as T extends { path?: string[]; id: string }
    ? string
    : undefined;
}

export function isGroupNode({
  nodeType,
  children,
}: Pick<ChromeProjectNavigationNode, 'nodeType' | 'children'>) {
  if (nodeType === 'group') return true;
  return children !== undefined;
}

export function isItemNode({
  nodeType,
  children,
}: Pick<ChromeProjectNavigationNode, 'nodeType' | 'children'>) {
  if (nodeType === 'item') return true;
  return children === undefined;
}
