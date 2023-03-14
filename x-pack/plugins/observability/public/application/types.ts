/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type {
  ApplicationStart,
  ChromeStart,
  DocLinksStart,
  HttpStart,
  IUiSettingsClient,
  NotificationsStart,
  OverlayStart,
  SavedObjectsStart,
  ThemeServiceStart,
} from '@kbn/core/public';
import { EmbeddableStateTransfer } from '@kbn/embeddable-plugin/public';
import { NavigationPublicPluginStart } from '@kbn/navigation-plugin/public';
import { IStorageWrapper } from '@kbn/kibana-utils-plugin/public';
import { DataPublicPluginStart } from '@kbn/data-plugin/public';
import { DataViewsPublicPluginStart } from '@kbn/data-views-plugin/public';
import { LensPublicStart } from '@kbn/lens-plugin/public';
import { SharePluginStart } from '@kbn/share-plugin/public';
import { TriggersAndActionsUIPublicPluginStart } from '@kbn/triggers-actions-ui-plugin/public';
import { CasesUiStart } from '@kbn/cases-plugin/public';
import type { ChartsPluginStart } from '@kbn/charts-plugin/public';
import { UiActionsStart } from '@kbn/ui-actions-plugin/public';

export interface ObservabilityAppServices {
  application: ApplicationStart;
  cases: CasesUiStart;
  charts: ChartsPluginStart;
  chrome: ChromeStart;
  data: DataPublicPluginStart;
  dataViews: DataViewsPublicPluginStart;
  docLinks: DocLinksStart;
  http: HttpStart;
  lens: LensPublicStart;
  navigation: NavigationPublicPluginStart;
  notifications: NotificationsStart;
  overlays: OverlayStart;
  savedObjectsClient: SavedObjectsStart['client'];
  share: SharePluginStart;
  stateTransfer: EmbeddableStateTransfer;
  storage: IStorageWrapper;
  theme: ThemeServiceStart;
  triggersActionsUi: TriggersAndActionsUIPublicPluginStart;
  uiActions: UiActionsStart;
  uiSettings: IUiSettingsClient;
  isDev?: boolean;
  kibanaVersion: string;
}
