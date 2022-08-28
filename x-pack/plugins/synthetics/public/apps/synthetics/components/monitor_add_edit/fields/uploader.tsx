/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useState, useRef } from 'react';

import { i18n } from '@kbn/i18n';

import { EuiFormRow, EuiFilePicker } from '@elastic/eui';

interface Props {
  onUpload: ({ scriptText, fileName }: { scriptText: string; fileName: string }) => void;
}

export function Uploader({ onUpload }: Props) {
  const fileReader = useRef<null | FileReader>(null);
  const [error, setError] = useState<string | null>(null);
  const filePickerRef = useRef<EuiFilePicker>(null);

  const handleFileRead = (fileName: string) => {
    const content = fileReader?.current?.result as string;

    if (content?.trim().slice(0, 4) !== 'step') {
      setError(PARSING_ERROR);
      filePickerRef.current?.removeFiles();
      return;
    }

    onUpload({ scriptText: content, fileName });
    setError(null);
  };

  const handleFileChosen = (files: FileList | null) => {
    if (!files || !files.length) {
      onUpload({ scriptText: '', fileName: '' });
      return;
    }
    if (files.length && !files[0].type.includes('javascript')) {
      setError(INVALID_FILE_ERROR);
      filePickerRef.current?.removeFiles();
      return;
    }
    fileReader.current = new FileReader();
    fileReader.current.onloadend = () => handleFileRead(files[0].name);
    fileReader.current.readAsText(files[0]);
  };

  return (
    <EuiFormRow
      isInvalid={Boolean(error)}
      error={error}
      aria-label={TESTING_SCRIPT_LABEL}
      fullWidth
    >
      <EuiFilePicker
        id="syntheticsFleetScriptRecorderUploader"
        data-test-subj="syntheticsFleetScriptRecorderUploader"
        ref={filePickerRef}
        initialPromptText={PROMPT_TEXT}
        onChange={handleFileChosen}
        display={'large'}
        fullWidth
      />
    </EuiFormRow>
  );
}

const TESTING_SCRIPT_LABEL = i18n.translate(
  'xpack.synthetics.createPackagePolicy.stepConfigure.monitorIntegrationSettingsSection.browser.uploader.fieldLabel',
  {
    defaultMessage: 'Testing script',
  }
);

const PROMPT_TEXT = i18n.translate('xpack.synthetics.monitorConfig.uploader.label', {
  defaultMessage: 'Select or drag and drop a .js file',
});

const INVALID_FILE_ERROR = i18n.translate(
  'xpack.synthetics.createPackagePolicy.stepConfigure.monitorIntegrationSettingsSection.browser.uploader.invalidFileError',
  {
    defaultMessage:
      'Invalid file type. Please upload a .js file generated by the Elastic Synthetics Recorder.',
  }
);

const PARSING_ERROR = i18n.translate(
  'xpack.synthetics.createPackagePolicy.stepConfigure.monitorIntegrationSettingsSection.browser.uploader.parsingError',
  {
    defaultMessage:
      'Error uploading file. Please upload a .js file generated by the Elastic Synthetics Recorder in inline script format.',
  }
);
