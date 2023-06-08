/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { OPTIONS_LIST_CONTROL } from '@kbn/controls-plugin/common';

import { OPTIONS_LIST_ANIMAL_SOUND_SUGGESTIONS } from '../../../../page_objects/dashboard_page_controls';
import { FtrProviderContext } from '../../../../ftr_provider_context';

export default function ({ getService, getPageObjects }: FtrProviderContext) {
  const testSubjects = getService('testSubjects');

  const { dashboardControls, dashboard, header } = getPageObjects([
    'dashboardControls',
    'timePicker',
    'dashboard',
    'settings',
    'console',
    'common',
    'header',
  ]);

  describe('Dashboard options list suggestions', () => {
    let controlId: string;

    before(async () => {
      await dashboard.ensureDashboardIsInEditMode();
      await dashboardControls.createControl({
        controlType: OPTIONS_LIST_CONTROL,
        dataViewTitle: 'animals-*',
        fieldName: 'sound.keyword',
      });
      controlId = (await dashboardControls.getAllControlIds())[0];
      await dashboard.clickQuickSave();
      await header.waitUntilLoadingHasFinished();
    });

    after(async () => {
      await dashboardControls.deleteAllControls();
      await dashboard.clickQuickSave();
    });

    describe('sorting', () => {
      before(async () => {
        await dashboardControls.optionsListOpenPopover(controlId);
      });

      after(async () => {
        await dashboardControls.optionsListEnsurePopoverIsClosed(controlId);
      });

      it('sort alphabetically - descending', async () => {
        await dashboardControls.optionsListPopoverSetSort({ by: '_key', direction: 'desc' });
        const sortedSuggestions = Object.keys(OPTIONS_LIST_ANIMAL_SOUND_SUGGESTIONS)
          .sort()
          .reverse()
          .reduce((result, key) => {
            return { ...result, [key]: OPTIONS_LIST_ANIMAL_SOUND_SUGGESTIONS[key] };
          }, {});
        await dashboardControls.ensureAvailableOptionsEqual(
          controlId,
          { suggestions: sortedSuggestions, invalidSelections: [] },
          true
        );
      });

      it('sort alphabetically - ascending', async () => {
        await dashboardControls.optionsListPopoverSetSort({ by: '_key', direction: 'asc' });
        const sortedSuggestions = Object.keys(OPTIONS_LIST_ANIMAL_SOUND_SUGGESTIONS)
          .sort()
          .reduce((result, key) => {
            return { ...result, [key]: OPTIONS_LIST_ANIMAL_SOUND_SUGGESTIONS[key] };
          }, {});
        await dashboardControls.ensureAvailableOptionsEqual(
          controlId,
          { suggestions: sortedSuggestions, invalidSelections: [] },
          true
        );
      });

      it('sort by document count - descending', async () => {
        await dashboardControls.optionsListPopoverSetSort({ by: '_count', direction: 'desc' });
        await dashboardControls.ensureAvailableOptionsEqual(
          controlId,
          {
            suggestions: OPTIONS_LIST_ANIMAL_SOUND_SUGGESTIONS, // keys are already sorted descending by doc count
            invalidSelections: [],
          },
          true
        );
      });

      it('sort by document count - ascending', async () => {
        await dashboardControls.optionsListPopoverSetSort({ by: '_count', direction: 'asc' });
        const sortedSuggestions = Object.entries(OPTIONS_LIST_ANIMAL_SOUND_SUGGESTIONS)
          .sort(([, docCountA], [, docCountB]) => {
            return docCountB - docCountA;
          })
          .reduce((result, [key, docCount]) => {
            return { ...result, [key]: docCount };
          }, {});
        await dashboardControls.ensureAvailableOptionsEqual(
          controlId,
          { suggestions: sortedSuggestions, invalidSelections: [] },
          true
        );
      });

      it('non-default sort value should cause unsaved changes', async () => {
        await testSubjects.existOrFail('dashboardUnsavedChangesBadge');
      });

      it('returning to default sort value should remove unsaved changes', async () => {
        await dashboardControls.optionsListPopoverSetSort({ by: '_count', direction: 'desc' });
        await testSubjects.missingOrFail('dashboardUnsavedChangesBadge');
      });
    });

    describe('searching', () => {
      it('prefix searching works as expected', async () => {
        await dashboardControls.optionsListOpenPopover(controlId);
        await dashboardControls.optionsListPopoverSearchForOption('G');

        const startsWithG = Object.entries(OPTIONS_LIST_ANIMAL_SOUND_SUGGESTIONS).reduce(
          (result, [key, docCount]) => {
            if (key[0] === 'g') return { ...result, [key]: docCount };
            return { ...result };
          },
          {}
        );
        await dashboardControls.ensureAvailableOptionsEqual(
          controlId,
          {
            suggestions: startsWithG,
            invalidSelections: [],
          },
          true
        );
        await dashboardControls.optionsListPopoverClearSearch();
        await dashboardControls.optionsListEnsurePopoverIsClosed(controlId);
      });
    });

    it('wildcard searching causes unsaved changes', async () => {
      await dashboardControls.editExistingControl(controlId);
      await dashboardControls.optionsListSetAdditionalSettings({ searchTechnique: 'wildcard' });
      await dashboardControls.controlEditorSave();
      await testSubjects.existOrFail('dashboardUnsavedChangesBadge');
    });

    it('wildcard searching works as expected', async () => {
      await dashboardControls.optionsListOpenPopover(controlId);
      await dashboardControls.optionsListPopoverSearchForOption('r');
      const containsR = Object.entries(OPTIONS_LIST_ANIMAL_SOUND_SUGGESTIONS).reduce(
        (result, [key, docCount]) => {
          if (key.includes('r')) return { ...result, [key]: docCount };
          return { ...result };
        },
        {}
      );
      await dashboardControls.ensureAvailableOptionsEqual(
        controlId,
        {
          suggestions: containsR,
          invalidSelections: [],
        },
        true
      );
      await dashboardControls.optionsListPopoverClearSearch();
      await dashboardControls.optionsListEnsurePopoverIsClosed(controlId);
    });

    it('returning to default search technqiue should remove unsaved changes', async () => {
      await dashboardControls.editExistingControl(controlId);
      await dashboardControls.optionsListSetAdditionalSettings({ searchTechnique: 'prefix' });
      await dashboardControls.controlEditorSave();
      await testSubjects.missingOrFail('dashboardUnsavedChangesBadge');
    });
  });
}
