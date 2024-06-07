/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { useKibana } from '@kbn/kibana-react-plugin/public';
import { FormattedMessage } from '@kbn/i18n-react';
import { EuiText, EuiLink } from '@elastic/eui';

export const DocsLinkSubtitle = React.memo(() => {
  const { docLinks } = useKibana().services;
  return (
    <EuiText size="xs" color="subdued">
      <FormattedMessage
        id="xpack.integrationAssistant.createIntegrationUpload.uploadHelpText"
        defaultMessage="Have some issues? Please read the {link}"
        values={{
          link: (
            <EuiLink
              href={docLinks?.links.fleet.installAndUninstallIntegrationAssets} // TODO: Update the docs link to the correct place
              target="_blank"
            >
              <FormattedMessage
                id="xpack.integrationAssistant.createIntegrationUpload.documentation"
                defaultMessage="documentation"
              />
            </EuiLink>
          ),
        }}
      />
    </EuiText>
  );
});
DocsLinkSubtitle.displayName = 'DocsLinkSubtitle';
