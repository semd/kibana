/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';
import { FtrProviderContext } from '../../ftr_provider_context';

export default ({ getPageObjects, getService }: FtrProviderContext) => {
  const testSubjects = getService('testSubjects');
  const pageObjects = getPageObjects(['common', 'indexManagement', 'header']);
  const security = getService('security');

  describe('Index template wizard', function () {
    before(async () => {
      await security.testUser.setRoles(['index_management_user']);
      await pageObjects.common.navigateToApp('indexManagement');
      // Navigate to the index templates tab
      await pageObjects.indexManagement.changeTabs('templatesTab');
      await pageObjects.header.waitUntilLoadingHasFinished();
    });

    describe('Create', async () => {
      before(async () => {
        // Click Create Template button
        await testSubjects.click('createTemplateButton');
      });

      it('should set the correct page title', async () => {
        const pageTitle = await testSubjects.exists('pageTitle');
        expect(pageTitle).to.be(true);

        const pageTitleText = await testSubjects.getVisibleText('pageTitle');
        expect(pageTitleText).to.be('Create template');
      });

      it('renders logistics (step 1)', async () => {
        // Verify step title
        const stepTitle = await testSubjects.getVisibleText('stepTitle');
        expect(stepTitle).to.be('Logistics');

        // Fill out required fields
        await testSubjects.setValue('nameField', 'test-index-template');
        await testSubjects.setValue('indexPatternsField', 'test-index-pattern');

        // Click Next button
        await pageObjects.indexManagement.clickNextButton();
      });

      it('renders component templates (step 2)', async () => {
        // Verify empty prompt
        const emptyPrompt = await testSubjects.exists('emptyPrompt');
        expect(emptyPrompt).to.be(true);

        // Click Next button
        await pageObjects.indexManagement.clickNextButton();
      });

      it('renders index settings (step 3)', async () => {
        // Verify step title
        const stepTitle = await testSubjects.getVisibleText('stepTitle');
        expect(stepTitle).to.be('Index settings (optional)');

        // Click Next button
        await pageObjects.indexManagement.clickNextButton();
      });

      it('renders mappings (step 4)', async () => {
        // Verify step title
        const stepTitle = await testSubjects.getVisibleText('stepTitle');
        expect(stepTitle).to.be('Mappings (optional)');

        // Click Next button
        await pageObjects.indexManagement.clickNextButton();
      });

      it('renders aliases (step 5)', async () => {
        // Verify step title
        const stepTitle = await testSubjects.getVisibleText('stepTitle');
        expect(stepTitle).to.be('Aliases (optional)');

        // Click Next button
        await pageObjects.indexManagement.clickNextButton();
      });

      it('renders review template (step 6)', async () => {
        // Verify step title
        const stepTitle = await testSubjects.getVisibleText('stepTitle');
        expect(stepTitle).to.be("Review details for 'test-index-template'");

        // Verify that summary exists
        const summaryTabContent = await testSubjects.exists('summaryTabContent');
        expect(summaryTabContent).to.be(true);

        // Click Create template
        await pageObjects.indexManagement.clickNextButton();
      });
    });
  });
};
