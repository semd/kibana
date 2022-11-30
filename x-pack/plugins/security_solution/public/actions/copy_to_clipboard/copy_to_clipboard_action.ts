/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { CellValueContext } from '@kbn/embeddable-plugin/public';
import { isErrorEmbeddable } from '@kbn/embeddable-plugin/public';
import { i18n } from '@kbn/i18n';
import type { Action } from '@kbn/ui-actions-plugin/public';
import copy from 'copy-to-clipboard';
import { KibanaServices } from '../../common/lib/kibana';
import { isInSecurityApp, isLensEmbeddable } from '../utils';

export const ACTION_ID = 'copyToClipboard';

function isDataColumnsValid(data?: CellValueContext['data']): boolean {
  return (
    !!data && data.length > 0 && data.every(({ columnMeta }) => columnMeta && columnMeta.field)
  );
}

export class CopyToClipboardAction implements Action<CellValueContext> {
  public readonly type = ACTION_ID;
  public readonly id = ACTION_ID;
  public order = 2;

  private icon = 'copyClipboard';

  private applicationService;
  private toastsService;

  constructor() {
    ({
      application: this.applicationService,
      notifications: { toasts: this.toastsService },
    } = KibanaServices.get());
  }

  public getDisplayName() {
    return i18n.translate('xpack.securitySolution.actions.cellValue.copyToClipboard.displayName', {
      defaultMessage: 'Copy to clipboard',
    });
  }

  public getIconType() {
    return this.icon;
  }

  public async isCompatible({ embeddable, data }: CellValueContext) {
    if (
      isErrorEmbeddable(embeddable) ||
      !isLensEmbeddable(embeddable) ||
      !isDataColumnsValid(data)
    ) {
      return false;
    }
    return isInSecurityApp(this.applicationService);
  }

  public async execute({ data }: CellValueContext) {
    const text = data
      .map(({ columnMeta, value }) => `${columnMeta?.field}${value != null ? `: "${value}"` : ''}`)
      .join(' | ');

    const isSuccess = copy(text, { debug: true });

    if (isSuccess) {
      this.toastsService.addSuccess({
        title: i18n.translate(
          'xpack.securitySolution.actions.cellValue.copyToClipboard.successMessage',
          { defaultMessage: 'Copied to the clipboard' }
        ),
        toastLifeTimeMs: 800,
      });
    }
  }
}
