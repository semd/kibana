/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { resolve as resolvePath } from 'path';
import type { InputType } from '../../common';
import { ensureDirSync, createSync, readSync } from '../util';

export function createAgentInput(specificDataStreamDir: string, inputTypes: InputType[]): void {
  const agentDir = resolvePath(specificDataStreamDir, 'agent', 'stream');
  const agentTemplatesDir = resolvePath(__dirname, '../templates/agent');
  ensureDirSync(agentDir);

  // Load common options that exists for all .yml.hbs files, to be merged with each specific input file
  const commonFilePath = resolvePath(agentTemplatesDir, 'common.yml.hbs');
  const commonFile = readSync(commonFilePath);

  for (const inputType of inputTypes) {
    const inputTypeFilePath = resolvePath(
      agentTemplatesDir,
      `${inputType.replaceAll('-', '_')}.yml.hbs`
    );
    const inputTypeFile = readSync(inputTypeFilePath);

    const combinedContents = `${inputTypeFile}\n${commonFile}`;

    const destinationFilePath = resolvePath(agentDir, `${inputType}.yml.hbs`);
    createSync(destinationFilePath, combinedContents);
  }
}
